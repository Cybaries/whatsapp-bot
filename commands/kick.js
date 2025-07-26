module.exports = {
    config: {
        command: 'kick',
        aliases: [],
        description: 'Remove a member from the group.',
        usage: '!kick @user or reply with !kick',
        category: 'moderation',
        dm: false
    },

    handler: async (sock, from, input, msg) => {
        const isGroup = from.endsWith('@g.us');
        const sender = msg.key.participant || msg.key.remoteJid;

        if (!isGroup) {
            return sock.sendMessage(from, {
                text: '❌ This command can only be used in groups.'
            }, { quoted: msg });
        }

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;

        const admins = participants
            .filter(p => p.admin)
            .map(p => p.id);

        const isUserAdmin = admins.includes(sender);
        const isBotAdmin = admins.includes(botId);

        if (!isUserAdmin) {
            return sock.sendMessage(from, {
                text: '❌ Only group admins can use this command.'
            }, { quoted: msg });
        }

        if (!isBotAdmin) {
            return sock.sendMessage(from, {
                text: '❌ I need to be an admin to kick members.'
            }, { quoted: msg });
        }

        // Extract target user from mention or reply
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        const targetId = ctx?.mentionedJid?.[ 0 ] || ctx?.participant;

        if (!targetId) {
            return sock.sendMessage(from, {
                text: '⚠️ Please tag or reply to the user you want to kick.\n\n🧾 Usage: `!kick @user` or reply with `!kick`'
            }, { quoted: msg });
        }

        // 🔍 Normalize bot and target ID
        const botFullId = sock.user.id; // e.g. 91xxxxx:94@s.whatsapp.net
        const botId = botFullId.split(':')[ 0 ]; // e.g. 91xxxxx
        const normalizedTarget = targetId.split('@')[ 0 ]; // e.g. 91xxxxx

        if (normalizedTarget === botId) {
            return await sock.sendMessage(from, {
                text: `🙅‍♂️ I can't kick myself!`
            });
        }

        // 🔨 Attempt to remove user
        await sock.groupParticipantsUpdate(from, [ targetId ], 'remove');
        await sock.sendMessage(from, {
            text: `👢 Removed <@${normalizedTarget}> from the group.`,
            mentions: [ targetId ]
        });

    }
};
