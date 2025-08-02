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
            return { text: '❌ This command can only be used in *group chats*.' };
        }

        const metadata = await sock.groupMetadata(from);
        const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
        const isSenderAdmin = admins.includes(senderId);

        if (!isSenderAdmin) {
            return { text: '🚫 Only *group admins* can use this command.' };
        }

        const botId = sock.user.id.split(':')[ 0 ] + '@s.whatsapp.net';
        const isBotAdmin = admins.includes(botId);

        if (!isBotAdmin) {
            return { text: '⚠️ I need to be an *admin* to delete messages.' };
        }

        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        if (!quoted?.stanzaId || !quoted?.participant) {
            return {
                text: '⚠️ Please *reply* to the message you want to delete.\n\n🧾 Usage: `!delete`'
            };
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

            return { text: '🗑️ Message deleted successfully.' };

        } catch (err) {
            console.error('❌ Delete failed:', err);
            return { text: '❌ Failed to delete the message. Please try again.' };
        }
    }
};
