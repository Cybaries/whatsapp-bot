const { getSenderId } = require('../utils/helpers');
const { getBotId } = require('../Handlers/connection')

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
            return { text: '❌ This command can only be used in group chats.' };
        }

        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants;

        const sender = participants.find(p => p.id === senderId);
        const BOT_ID = getBotId().split(':')[ 0 ];
        const botId = `${BOT_ID}@s.whatsapp.net`;
        console.log(botId);
        const bot = participants.find(p => p.id === botId);

        const isSenderAdmin = sender?.admin === 'admin' || sender?.admin === 'superadmin';
        const isBotAdmin = bot?.admin === 'admin' || bot?.admin === 'superadmin';

        if (!isSenderAdmin) {
            return { text: '🚫 Only group admins can use this command.' };
        }

        if (!isBotAdmin) {
            return { text: '❌ I need to be a group admin to demote members.' };
        }

        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        const targetId = ctx?.mentionedJid?.[ 0 ] || ctx?.participant;

        if (!targetId) {
            return {
                text: '⚠️ Please mention or reply to the admin you want to demote.\n\n🧾 Usage: `!demote @user`'
            };
        }

        const target = participants.find(p => p.id === targetId);
        if (!target) {
            return { text: '❓ User not found in this group.' };
        }

        if (!target.admin) {
            return { text: 'ℹ️ That user is not an admin.' };
        }

        try {
            await sock.groupParticipantsUpdate(from, [ targetId ], 'demote');
            return {
                text: `❎ @${targetId.split('@')[ 0 ]} has been *demoted* from admin.`,
                mentions: [ targetId ]
            };
        } catch (err) {
            console.error('Demote error:', err);
            return {
                text: '❌ Failed to demote user. Check if I still have admin rights.'
            };
        }
    }
};
