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

    if (top.length === 0) {
        await sock.sendMessage(from, { text: '📉 No XP data yet.' });
        return;
    }

    let text = `🏆 *Top 10 XP Leaders*\n\n`;
    for (let i = 0; i < top.length; i++) {
        const user = top[ i ];
        const name = await getDisplayName(sock, user.userId);
        const rank = getRank(user.xp);
        text += `${i + 1}. ${rank.emoji} *${name}* — ${user.xp} XP\n`;
    }

    await sock.sendMessage(from, { text });
};
