const { getSenderId } = require('../utils/helpers');

module.exports = async (sock, from, _, msg) => {
    if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ `!demote` can only be used in group chats.' });
    }

    const metadata = await sock.groupMetadata(from);
    const senderId = getSenderId(msg);
    const senderInfo = metadata.participants.find(p => p.id === senderId);
    const isSenderAdmin = senderInfo?.admin === 'admin' || senderInfo?.admin === 'superadmin';

    if (!isSenderAdmin) {
        return sock.sendMessage(from, { text: '🚫 Only group admins can use `!demote`.' });
    }

    const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mentions || mentions.length === 0) {
        return sock.sendMessage(from, { text: '⚠️ Please tag a user to demote.' });
    }

    const targetId = mentions[ 0 ];
    const targetInfo = metadata.participants.find(p => p.id === targetId);

    if (!targetInfo) {
        return sock.sendMessage(from, { text: '⚠️ User not found in the group.' });
    }

    if (!targetInfo.admin) {
        return sock.sendMessage(from, { text: 'ℹ️ This user is not an admin.' });
    }

    await sock.groupParticipantsUpdate(from, [ targetId ], 'demote');

    await sock.sendMessage(from, {
        text: `❎ @${targetId.split('@')[ 0 ]} has been *demoted* from admin.`,
        mentions: [ targetId ],
    });
};
