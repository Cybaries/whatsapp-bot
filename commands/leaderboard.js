const { getDb } = require('../utils/mongo');
const { getRank } = require('../utils/rankUtils');
const { getDisplayName } = require('../utils/getDisplayName');

module.exports = async (sock, from, input, msg) => {
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(from, { text: '❌ This command only works in groups.' });
        return;
    }

    const collection = getDb().collection('messageStats');

    const top = await collection
        .find({ groupId: from })
        .sort({ xp: -1 })
        .limit(10)
        .toArray();

    if (!top.length) {
        await sock.sendMessage(from, { text: '📉 No XP data yet.' });
        return;
    }

    let text = `🏆 *Top 10 XP Leaders*\n\n`;
    const mentionedJid = [];

    for (let i = 0; i < top.length; i++) {
        const user = top[ i ];
        const userId = user.user || user.userId || user._id;

        // Force mention display
        const name = await getDisplayName(sock, userId);
        const displayName = name.startsWith('@') ? name : `@${name}`;

        const rank = getRank(user.xp);
        text += `${i + 1}. ${rank.emoji} *${displayName}* — ${user.xp} XP\n`;

        mentionedJid.push(userId); // Ensure proper mention
    }

    await sock.sendMessage(from, {
        text,
        mentions: mentionedJid
    });
};
