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

    const botId = sock.user.id.split(':')[ 0 ] + '@s.whatsapp.net';
    const isBotAdmin = admins.includes(botId);

    if (!isBotAdmin) {
        return await sock.sendMessage(from, { text: '❌ I need to be an admin to delete messages.' });
    }

    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo;
    if (!quotedMsg?.stanzaId || !quotedMsg?.participant) {
        return await sock.sendMessage(from, {
            text: '⚠️ Please reply to the message you want to delete.\n🧾 _Usage:_ reply with `!delete`'
        });
    }

    try {
        await sock.sendMessage(from, {
            delete: {
                remoteJid: from,
                fromMe: false,
                id: quotedMsg.stanzaId,
                participant: quotedMsg.participant
            }
        });
        await sock.sendMessage(from, { text: '🗑️ Message deleted successfully.' });
    } catch (err) {
        console.error('❌ Delete failed:', err);
        await sock.sendMessage(from, { text: '❌ Failed to delete the message.' });
    }
};
