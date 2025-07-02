const mongo = require('./mongo');
const { getRank } = require('./rankUtils');
const { getDisplayName } = require('./getDisplayName');

function calculateXP(msg) {
    let xp = 10;

    const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        '';

    if (text.length > 100) xp += 5;
    if (text.length > 250) xp += 10;

    const isReply = !!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (isReply) xp += 5;

    const hasMedia =
        msg.message?.imageMessage ||
        msg.message?.videoMessage ||
        msg.message?.audioMessage ||
        msg.message?.documentMessage;
    if (hasMedia) xp += 5;

    return xp;
}

async function incrementMessageCount(groupId, userId, sock, msg) {
    const db = mongo.getDb();
    const collection = db.collection('messageStats');

    const prev = await collection.findOne({ groupId, userId });
    const oldXP = prev?.xp || 0;
    const xpGain = calculateXP(msg);
    const newXP = oldXP + xpGain;

    await collection.updateOne(
        { groupId, userId },
        {
            $inc: { messageCount: 1, xp: xpGain },
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
