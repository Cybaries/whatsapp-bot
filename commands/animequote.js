const axios = require('axios');
const { getDb } = require('../utils/mongo');

const BASE_URL = 'https://api.rei.my.id/animequotes';

async function getTotalQuotes(query) {
    const db = getDb();
    const cacheKey = JSON.stringify(query);
    const cache = await db.collection('animequote_totals').findOne({ _id: cacheKey });

    if (cache) return cache.total;

    try {
        const { data } = await axios.get(BASE_URL, {
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

        // Set TTL (6 hours)
        await db.collection('animequote_totals').createIndex({ createdAt: 1 }, { expireAfterSeconds: 21600 });

        return total;
    } catch {
        return 1000; // fallback total
    }
}

module.exports = {
    config: {
        command: 'animequote',
        aliases: [ 'aq' ],
        description: 'Fetch a random anime quote by anime or character name.',
        usage: '!animequote [anime] [character]',
        category: 'fun',
        dm: true
    },

    handler: async (sock, from, input, msg) => {
        const args = input.trim().split(/\s+/);
        let query = {};

        if (args[ 0 ]?.toLowerCase() === 'character') {
            if (args.length < 2) {
                return sock.sendMessage(from, {
                    text: `⚠️ Usage: !animequote character <name>`
                }, { quoted: msg });
            }
            query.character = args.slice(1).join(' ');
        } else if (args.length === 1 && args[ 0 ] !== '') {
            query.anime = args[ 0 ];
        } else if (args.length >= 2) {
            query.anime = args[ 0 ];
            query.character = args.slice(1).join(' ');
        }

        try {
            const total = await getTotalQuotes(query);
            const totalPages = Math.ceil(total / 100);
            const randomPage = Math.floor(Math.random() * totalPages) + 1;

            const { data } = await axios.get(BASE_URL, {
                params: { ...query, page: randomPage, limit: 100 }
            });

            const quotes = data?.data || [];
            if (!quotes.length) {
                return sock.sendMessage(from, {
                    text: `😕 No quotes found. Try a different anime/character.`
                }, { quoted: msg });
            }

            const quote = quotes[ Math.floor(Math.random() * quotes.length) ];
            const message =
                `🗯️ *"${quote.english}"*\n\n` +
                `👤 ${quote.character}\n` +
                `🎬 ${quote.anime}`;

            await sock.sendMessage(from, { text: message }, { quoted: msg });

        } catch (err) {
            console.error('❌ Quote fetch error:', err);
            await sock.sendMessage(from, {
                text: `⚠️ Failed to fetch quote. Please try again later.`
            }, { quoted: msg });
        }
    }
};
