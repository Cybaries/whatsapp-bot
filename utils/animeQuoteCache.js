const { getDb } = require('../Handlers/mongo');

const CACHE_DURATION_HOURS = 24;

async function getCachedTotal(anime = '', character = '') {
    const key = `${anime.toLowerCase()}|${character.toLowerCase()}`;
    const collection = getDb().collection('animeQuoteTotals');

    const now = new Date();
    const doc = await collection.findOne({ key });

    if (doc && (now - new Date(doc.cachedAt)) < CACHE_DURATION_HOURS * 3600 * 1000) {
        return doc.total;
    }

    // Cache is missing or stale
    try {
        const url = new URL('https://api.rei.my.id/animequotes');
        if (anime) url.searchParams.append('anime', anime);
        if (character) url.searchParams.append('character', character);
        url.searchParams.append('limit', 1); // Small page just to get total

        const res = await fetch(url);
        const json = await res.json();
        const total = json.total || 0;

        await collection.updateOne(
            { key },
            { $set: { total, cachedAt: now } },
            { upsert: true }
        );

        return total;
    } catch (err) {
        console.error('❌ Failed to fetch and cache total:', err);
        return 0;
    }
}

module.exports = { getCachedTotal };
