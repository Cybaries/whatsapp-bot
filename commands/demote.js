const { getSenderId } = require('../utils/helpers');

module.exports = {
    config: {
        command: 'demote',
        aliases: [],
        description: 'Demote a group admin to a normal member.',
        usage: '!demote @user',
        category: 'moderation',
        dm: false
    },

    handler: async (sock, from, _, msg) => {
        const isGroup = from.endsWith('@g.us');
        const senderId = getSenderId(msg);

        if (!isGroup) {
            return sock.sendMessage(from, {
                text: '❌ This command can only be used in group chats.'
            }, { quoted: msg });
        }

        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants;

        const sender = participants.find(p => p.id === senderId);
        const botId = sock.user.id;
        const bot = participants.find(p => p.id === botId);

        const isSenderAdmin = sender?.admin === 'admin' || sender?.admin === 'superadmin';
        const isBotAdmin = bot?.admin === 'admin' || bot?.admin === 'superadmin';

        if (!isSenderAdmin) {
            return sock.sendMessage(from, {
                text: '🚫 Only group admins can use this command.'
            }, { quoted: msg });
        }

        if (!isBotAdmin) {
            return sock.sendMessage(from, {
                text: '❌ I need to be a group admin to demote members.'
            }, { quoted: msg });
        }

        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        const targetId = ctx?.mentionedJid?.[ 0 ] || ctx?.participant;

        if (!targetId) {
            return sock.sendMessage(from, {
                text: '⚠️ Please mention or reply to the admin you want to demote.\n\n🧾 Usage: `!demote @user`'
            }, { quoted: msg });
        }

        const target = participants.find(p => p.id === targetId);
        if (!target) {
            return sock.sendMessage(from, {
                text: '❓ User not found in this group.'
            }, { quoted: msg });
        }

        if (!target.admin) {
            return sock.sendMessage(from, {
                text: 'ℹ️ That user is not an admin.'
            }, { quoted: msg });
        }

        try {
            await sock.groupParticipantsUpdate(from, [ targetId ], 'demote');
            await sock.sendMessage(from, {
                text: `❎ @${targetId.split('@')[ 0 ]} has been *demoted* from admin.`,
                mentions: [ targetId ]
            });
        } catch (err) {
            console.error('Demote error:', err);
            await sock.sendMessage(from, {
                text: '❌ Failed to demote user. Check if I still have admin rights.'
            }, { quoted: msg });
        }
    }
};
