const axios = require('axios');
const { getDb } = require('../utils/mongo');

let quoteRequestsLastMinute = [];
let quoteRequestsThisMonth = 0;
let monthlyReset = getNextMonthReset();

function getNextMonthReset() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
}

async function getTotalQuotesFromCacheOrAPI(query) {
    const db = getDb();
    const cacheKey = JSON.stringify(query);
    const cache = await db.collection('animequote_totals').findOne({ _id: cacheKey });

    if (cache) {
        return cache.total;
    }

    try {
        const { data } = await axios.get('https://api.rei.my.id/animequotes', {
            params: { ...query, limit: 1 }
        });
        const total = data.total || 1000;

        await db.collection('animequote_totals').updateOne(
            { _id: cacheKey },
            {
                $set: {
                    total,
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );

        // Ensure the TTL index exists
        await db.collection('animequote_totals').createIndex({ createdAt: 1 }, { expireAfterSeconds: 21600 }); // 6 hours

        return total;
    } catch (err) {
        return 1000; // fallback
    }
}

module.exports = async (sock, from, input, msg) => {
    const BASE_URL = 'https://api.rei.my.id/animequotes';
    const now = Date.now();

    if (now >= monthlyReset) {
        quoteRequestsThisMonth = 0;
        monthlyReset = getNextMonthReset();
    }

    // Clean old timestamps
    quoteRequestsLastMinute = quoteRequestsLastMinute.filter(ts => now - ts < 60000);

    // Check rate limits
    if (quoteRequestsLastMinute.length >= 6) {
        const wait = 60 - Math.floor((now - quoteRequestsLastMinute[ 0 ]) / 1000);
        return sock.sendMessage(from, { text: `⚠️ Rate limit: Try again in ${wait}s.` });
    }

    if (quoteRequestsThisMonth >= 5000) {
        return sock.sendMessage(from, { text: `⚠️ Monthly quote limit (5000) reached. Try next month.` });
    }

    // Input parsing
    const args = input.trim().split(/\s+/);
    let query = {};
    if (args[ 0 ]?.toLowerCase() === 'character') {
        if (args.length < 2) {
            return sock.sendMessage(from, {
                text: `⚠️ Usage: !animequote character <name>`
            });
        }
        query.character = args.slice(1).join(' ');
    } else if (args.length === 1 && args[ 0 ] !== '') {
        query.anime = args[ 0 ];
    } else if (args.length >= 2) {
        query.anime = args[ 0 ];
        query.character = args.slice(1).join(' ');
    }

    try {
        const total = await getTotalQuotesFromCacheOrAPI(query);
        const totalPages = Math.ceil(total / 100);
        const randomPage = Math.floor(Math.random() * totalPages) + 1;

        const { data } = await axios.get(BASE_URL, {
            params: { ...query, page: randomPage, limit: 100 }
        });

        const quotes = data?.data || [];
        if (!quotes.length) {
            return sock.sendMessage(from, {
                text: `😕 No quotes found. Try a different anime/character.`
            });
        }

        const quote = quotes[ Math.floor(Math.random() * quotes.length) ];
        quoteRequestsLastMinute.push(now);
        quoteRequestsThisMonth++;

        const message =
            `🗯️ *"${quote.english}"*\n\n` +
            `👤 ${quote.character}\n` +
            `🎬 ${quote.anime}`;

        await sock.sendMessage(from, { text: message }, { quoted: msg });

    } catch (err) {
        return sock.sendMessage(from, {
            text: `⚠️ Failed to fetch quote. Please try again later.`
        });
    }
};
