// commands/kick.js
module.exports = async (sock, from, input, msg) => {
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

    // 🧠 Try to get mentioned user
    let targetId = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[ 0 ];

    // 🧠 If no mention, try reply
    if (!targetId && msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetId = msg.message.extendedTextMessage.contextInfo.participant;
    }

    if (!targetId) {
        return await sock.sendMessage(from, {
            text: '⚠️ Please tag or reply to the user you want to kick.\n🧾 _Usage:_ `!kick @user` or reply with `!kick`'
        });
    }

    try {
        await sock.groupParticipantsUpdate(from, [ targetId ], 'remove');
        await sock.sendMessage(from, {
            text: `👢 Removed <@${targetId.split('@')[ 0 ]}> from the group.`,
            mentions: [ targetId ]
        });
    } catch (err) {
        console.error('Kick error:', err);
        await sock.sendMessage(from, { text: '❌ Failed to kick the user. Is the bot an admin?' });
    }
};
