module.exports = {
    config: {
        command: 'delete',
        aliases: [ 'del' ],
        description: 'Deletes a message (admin-only, reply only).',
        usage: 'Reply to a message with `!delete`',
        category: 'moderation',
        dm: false
    },

    handler: async (sock, from, _, msg) => {
        const isGroup = from.endsWith('@g.us');
        const senderId = msg.key.participant || msg.key.remoteJid;

        if (!isGroup) {
            return sock.sendMessage(from, {
                text: '❌ This command can only be used in *group chats*.'
            }, { quoted: msg });
        }

        const metadata = await sock.groupMetadata(from);
        const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
        const isSenderAdmin = admins.includes(senderId);

        if (!isSenderAdmin) {
            return sock.sendMessage(from, {
                text: '🚫 Only *group admins* can use this command.'
            }, { quoted: msg });
        }

        const botId = sock.user.id.split(':')[ 0 ] + '@s.whatsapp.net';
        const isBotAdmin = admins.includes(botId);

        if (!isBotAdmin) {
            return sock.sendMessage(from, {
                text: '⚠️ I need to be an *admin* to delete messages.'
            }, { quoted: msg });
        }

        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        if (!quoted?.stanzaId || !quoted?.participant) {
            return sock.sendMessage(from, {
                text: '⚠️ Please *reply* to the message you want to delete.\n\n🧾 Usage: `!delete`'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(from, {
                delete: {
                    remoteJid: from,
                    fromMe: false,
                    id: quoted.stanzaId,
                    participant: quoted.participant
                }
            });

            await sock.sendMessage(from, {
                text: '🗑️ Message deleted successfully.'
            }, { quoted: msg });

        } catch (err) {
            console.error('❌ Delete failed:', err);
            await sock.sendMessage(from, {
                text: '❌ Failed to delete the message. Please try again.'
            }, { quoted: msg });
        }
    }
};
