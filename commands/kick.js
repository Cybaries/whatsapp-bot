const { getBotId } = require('../Handlers/connection')

module.exports = {
    config: {
        command: 'kick',
        aliases: [],
        description: 'Remove a member from the group.',
        usage: '!kick @user or reply with !kick',
        category: 'moderation',
        dm: false
    },

    handler: async (sock, from, input, msg, meta) => {
        const isGroup = from.endsWith('@g.us');
        const sender = msg.key.participant || msg.key.remoteJid;

        if (!isGroup) {
            return { text: '❌ This command can only be used in groups.' };
        }

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;

        const admins = participants
            .filter(p => p.admin)
            .map(p => p.id);

        const isUserAdmin = admins.includes(sender);
        const botFullId = getBotId(); // e.g. 91xxxxx:94@s.whatsapp.net
        const botId = botFullId.split(':')[ 0 ]; // e.g. 91xxxxx
        const isBotAdmin = admins.includes(`${botId}@s.whatsapp.net`);

        if (!isUserAdmin) {
            return { text: '❌ Only group admins can use this command.' };
        }

        if (!isBotAdmin) {
            return { text: '❌ I need to be an admin to kick members.' };
        }

        // Extract target user from mention or reply
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        const targetId = ctx?.mentionedJid?.[ 0 ] || ctx?.participant;

        if (!targetId) {
            return {
                text: '⚠️ Please tag or reply to the user you want to kick.\n\n🧾 Usage: `!kick @user` or reply with `!kick`'
            };
        }

        const normalizedTarget = targetId.split('@')[ 0 ];

        if (normalizedTarget === botId) {
            return { text: `🙅‍♂️ I can't kick myself!` };
        }

        // 🔨 Attempt to remove user
        await sock.groupParticipantsUpdate(from, [ targetId ], 'remove');

        return {
            text: `👢 Removed <@${normalizedTarget}> from the group.`,
            mentions: [ targetId ]
        };
    }
};
