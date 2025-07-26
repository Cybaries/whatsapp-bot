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
            return sock.sendMessage(from, {
                text: '❌ `!promote` can only be used in *group chats*.'
            }, { quoted: msg });
        }

        const metadata = await sock.groupMetadata(from);
        const senderId = getSenderId(msg);
        const senderInfo = metadata.participants.find(p => p.id === senderId);
        const isSenderAdmin = senderInfo?.admin === 'admin' || senderInfo?.admin === 'superadmin';

        // 🔐 Ensure sender is admin
        if (!isSenderAdmin) {
            return sock.sendMessage(from, {
                text: '🚫 Only *group admins* can use `!promote`.'
            }, { quoted: msg });
        }

        // 👤 Get mentioned users
        const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length === 0) {
            return sock.sendMessage(from, {
                text: '⚠️ Please *tag* a user to promote.\n\n📌 Usage: `!promote @user`'
            }, { quoted: msg });
        }

        const targetId = mentions[ 0 ];
        const targetInfo = metadata.participants.find(p => p.id === targetId);

        if (!targetInfo) {
            return sock.sendMessage(from, {
                text: '⚠️ Tagged user not found in the group.'
            }, { quoted: msg });
        }

        if (targetInfo.admin === 'admin' || targetInfo.admin === 'superadmin') {
            return sock.sendMessage(from, {
                text: 'ℹ️ This user is *already an admin*.'
            }, { quoted: msg });
        }

        // ✅ Promote
        await sock.groupParticipantsUpdate(from, [ targetId ], 'promote');

        await sock.sendMessage(from, {
            text: `✅ @${targetId.split('@')[ 0 ]} has been *promoted* to admin.`,
            mentions: [ targetId ]
        }, { quoted: msg });
    }
};
