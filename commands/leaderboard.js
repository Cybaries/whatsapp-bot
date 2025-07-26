const { getDb } = require('../utils/mongo');
const { getRank } = require('../utils/rankUtils');
const { getDisplayName } = require('../utils/getDisplayName');

module.exports = {
    config: {
        command: 'leaderboard',
        aliases: [ 'top', 'lb' ],
        description: 'Show top 10 members with the highest XP in this group.',
        usage: '!leaderboard',
        category: 'ranking',
        dm: false
    },

    handler: async (sock, from, input, msg) => {
        if (!from.endsWith('@g.us')) {
            await sock.sendMessage(from, {
                text: '❌ This command only works in groups.'
            }, { quoted: msg });
            return;
        }

        const collection = getDb().collection('messageStats');

        try {
            const top = await collection
                .find({ groupId: from })
                .sort({ xp: -1 })
                .limit(10)
                .toArray();

            if (!top.length) {
                await sock.sendMessage(from, {
                    text: '📉 No XP data yet.'
                }, { quoted: msg });
                return;
            }

            let leaderboardText = `🏆 *Top 10 XP Leaders*\n\n`;
            const mentions = [];

            for (let i = 0; i < top.length; i++) {
                const user = top[ i ];
                const userId = user.user || user.userId || user._id;

                const name = await getDisplayName(sock, userId);
                const displayName = name.startsWith('@') ? name : `@${name}`;

                const rank = getRank(user.xp);
                leaderboardText += `${i + 1}. ${rank.emoji} *${displayName}* — ${user.xp} XP\n`;

                mentions.push(userId);
            }

            await sock.sendMessage(from, {
                text: leaderboardText,
                mentions
            }, { quoted: msg });

        } catch (error) {
            console.error('❌ leaderboard error:', error);
            await sock.sendMessage(from, {
                text: '❌ Failed to fetch leaderboard. Try again later.'
            }, { quoted: msg });
        }
    }
};
