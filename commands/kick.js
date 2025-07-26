module.exports = async (sock, from, input, msg) => {
    try {
        const isGroup = from.endsWith('@g.us');
        const sender = msg.key.participant || msg.key.remoteJid;

        if (!isGroup) {
            return await sock.sendMessage(from, { text: '❌ This command can only be used in groups.' });
        }

        const groupMetadata = await sock.groupMetadata(from);
        const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);


        const isAdmin = admins.includes(sender);
        if (!isAdmin) {
            return await sock.sendMessage(from, { text: '❌ Only group admins can use this command.' });
        }

        // 🔍 Get mentioned or replied-to user
        let targetId = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[ 0 ];
        if (!targetId && msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetId = msg.message.extendedTextMessage.contextInfo.participant;
        }

        if (!targetId) {
            return await sock.sendMessage(from, {
                text: '⚠️ Please tag or reply to the user you want to kick.\n🧾 _Usage:_ `!kick @user` or reply with `!kick`'
            });
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

    } catch (err) {
        await sock.sendMessage(from, {
            text: '❌ Failed to kick the user. Make sure I am an admin and the user exists.'
        });
    }
};
