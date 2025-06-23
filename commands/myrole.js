const { getUserRole } = require('../utils/roles');
const { getSenderId } = require('../utils/helpers')

module.exports = async (sock, from, _, msg) => {
    if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, {
            text: '❌ This command only works in group chats.'
        });
    }

    const senderId = getSenderId(msg);
    const role = getUserRole(from, senderId);

    const name = senderId.split('@')[ 0 ];

    const response = role
        ? `🎓 @${name}, your current role is: *${role}*`
        : `ℹ️ @${name}, you don't have any role assigned yet.\nUse !assignroles and react to get one.`;

    await sock.sendMessage(from, {
        text: response,
        mentions: [ senderId ]
    });
};
