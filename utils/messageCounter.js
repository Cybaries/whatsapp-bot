const mongo = require('./mongo');
const { getRank } = require('./rankUtils');
const { getDisplayName } = require('./getDisplayName');

const XP_PER_MESSAGE = 10;

async function incrementMessageCount(groupId, userId, sock) {
    const db = mongo.getDb();
    const collection = db.collection('messageStats');

    const prev = await collection.findOne({ groupId, userId });
    const oldXP = prev?.xp || 0;
    const newXP = oldXP + XP_PER_MESSAGE;

    await collection.updateOne(
        { groupId, userId },
        {
            $inc: { messageCount: 1, xp: XP_PER_MESSAGE },
            $set: { lastUpdated: new Date() }
        },
        { upsert: true }
    );

    const oldRank = getRank(oldXP);
    const newRank = getRank(newXP);

    if (newRank.tier > oldRank.tier) {
        const name = await getDisplayName(sock, userId);
        const message = `🎉 *${name}* has ranked up!\n\n🏅 New Rank: ${newRank.emoji} *${newRank.title}*`;
        await sock.sendMessage(groupId, {
            text: message,
            mentions: [ userId ]
        });
    }
}

async function getMessageStats(groupId, userId) {
    const db = mongo.getDb();
    const collection = db.collection('messageStats');
    return await collection.findOne({ groupId, userId });
}

module.exports = { incrementMessageCount, getMessageStats };
