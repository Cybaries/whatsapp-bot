// commands/rank.js

const { getMessageStats } = require('../utils/messageCounter');
const { createRankCard } = require('../utils/rankCard');
const { getDisplayName } = require('../utils/getDisplayName');
const { getRank } = require('../utils/rankUtils');

module.exports = {
    config: {
        command: 'rank',
        aliases: [],
        description: 'Shows your rank based on XP and messages',
        usage: '!rank [@user]',
        category: 'general',
        dm: false
    },

    handler: async (sock, from, input, msg) => {
        const isGroup = from.endsWith('@g.us');
        if (!isGroup) {
            return { text: '❌ This command only works in groups.' };
        }

        let targetId;
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

        if (contextInfo?.mentionedJid?.length > 0) {
            // Case: !rank @someone
            targetId = contextInfo.mentionedJid[ 0 ];
        } else if (contextInfo?.participant && contextInfo?.quotedMessage) {
            // Case: !rank used while replying
            targetId = contextInfo.participant;
        } else {
            // Default: !rank (self)
            targetId = msg.key.participant || msg.sender || msg.key.remoteJid;
        }

        const isSelf = targetId === (msg.key.participant || msg.key.remoteJid);
        const displayName = await getDisplayName(sock, targetId, isSelf ? msg.pushName : null);

        const stats = await getMessageStats(from, targetId);
        const xp = stats?.xp || 0;
        const messageCount = stats?.messageCount || 0;
        const rank = getRank(xp);

        let profilePicUrl = 'https://i.imgur.com/oJZ9qVf.png'; // fallback
        try {
            profilePicUrl = await sock.profilePictureUrl(targetId, 'image');
        } catch { }

        const imageBuffer = await createRankCard({
            name: displayName,
            profilePicUrl,
            rank,
            xp
        });

        const caption = `🌟 *${displayName}'s Rank Card*\n\n🏅 Rank: ${rank.emoji} *${rank.title}*\n📊 XP: *${xp}* • Messages: *${messageCount}*`;

        return {
            image: imageBuffer,
            caption,
            mentions: [ targetId ],
        };
    }
};
