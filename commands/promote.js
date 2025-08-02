const { getSenderId } = require('../utils/helpers');

module.exports = {
    config: {
        command: 'promote',
        aliases: [],
        description: 'Promote a tagged user to admin (group-only)',
        usage: '!promote @user',
        category: 'admin',
        dm: false
    },

    handler: async (sock, from, input, msg) => {
        // ✅ Ensure group chat
        if (!from.endsWith('@g.us')) {
            return {
                text: '❌ `!promote` can only be used in *group chats*.'
            };
        }

        const metadata = await sock.groupMetadata(from);
        const senderId = getSenderId(msg);
        const senderInfo = metadata.participants.find(p => p.id === senderId);
        const BOT_ID = getBotId().split(':')[ 0 ];
        const botId = `${BOT_ID}@s.whatsapp.net`;
        console.log(botId);
        const bot = metadata.participants.find(p => p.id === botId);
        const isSenderAdmin = senderInfo?.admin === 'admin' || senderInfo?.admin === 'superadmin';
        const isBotAdmin = bot?.admin === 'admin' || bot?.admin === 'superadmin';

        // 🔐 Ensure sender is admin
        if (!isSenderAdmin) {
            return {
                text: '🚫 Only *group admins* can use `!promote`.'
            };
        }

        if (!isBotAdmin) {
            return { text: '❌ I need to be a group admin to promote members.' };
        }

        // 👤 Get mentioned users
        const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length === 0) {
            return {
                text: '⚠️ Please *tag* a user to promote.\n\n📌 Usage: `!promote @user`'
            };
        }

        const targetId = mentions[ 0 ];
        const targetInfo = metadata.participants.find(p => p.id === targetId);

        if (!targetInfo) {
            return {
                text: '⚠️ Tagged user not found in the group.'
            };
        }

        if (targetInfo.admin === 'admin' || targetInfo.admin === 'superadmin') {
            return {
                text: 'ℹ️ This user is *already an admin*.'
            };
        }

        // ✅ Promote
        await sock.groupParticipantsUpdate(from, [ targetId ], 'promote');

        return {
            text: `✅ @${targetId.split('@')[ 0 ]} has been *promoted* to admin.`,
            mentions: [ targetId ]
        };
    }
};
