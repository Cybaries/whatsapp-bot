const axios = require('axios');

// Rate limit tracking
let quoteRequestCount = 0;
let quoteResetTime = Date.now() + 60 * 60 * 1000; // 1 hour from first request

module.exports = async (sock, from, input, msg) => {
    const BASE_URL = 'https://api.animechan.io/v1';
    const endpoint = `${BASE_URL}/quotes/random`;

    // Handle reset
    const now = Date.now();
    if (now > quoteResetTime) {
        quoteRequestCount = 0;
        quoteResetTime = now + 60 * 60 * 1000;
    }

    if (quoteRequestCount >= 5) {
        const minsLeft = Math.ceil((quoteResetTime - now) / 60000);
        return sock.sendMessage(from, {
            text: `⚠️ API rate limit reached (5/hour). Please try again in ${minsLeft} min.`
        });
    }

    const args = input.trim().split(/\s+/);
    let params = '';

    if (args[ 0 ]?.toLowerCase() === 'character') {
        const character = args.slice(1).join(' ');
        if (!character) {
            return sock.sendMessage(from, {
                text: '⚠️ Usage: !animequote character <character name>'
            });
        }
        params = `?character=${encodeURIComponent(character)}`;
    } else if (args.length > 0 && args[ 0 ] !== '') {
        const anime = args.join(' ');
        params = `?anime=${encodeURIComponent(anime)}`;
    }

    const fullUrl = endpoint + params;
    console.log(`🔍 Requesting: ${fullUrl}`);

    try {
        const res = await fetch(fullUrl);
        const quoteData = await res.json();

        if (quoteData.status !== 'success' || !quoteData.data?.content) {
            return sock.sendMessage(from, { text: '😞 No quote found for that request.' });
        }

        const quote = quoteData.data;

        const message =
            `🗯️ *"${quote.content}"*\n\n` +
            `👤 ${quote.character.name}\n` +
            `🎬 ${quote.anime.name}`;

        quoteRequestCount += 1; // count this request

        await sock.sendMessage(from, { text: message });

    } catch (err) {
        console.error('❌ Error fetching quote:', err.message);
        await sock.sendMessage(from, {
            text: '⚠️ Failed to fetch quote. Please try again later.'
        });
    }
};
