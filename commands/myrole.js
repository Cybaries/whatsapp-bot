const { getUserRole } = require('../utils/roleManager');
const { getSenderId } = require('../utils/helpers');

module.exports = async (sock, from, _, msg) => {
    if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ `!myrole` can only be used in a group.' });
    }

    const user = getSenderId(msg);
    const roleData = await getUserRole(user, from);

    if (!roleData) {
        return sock.sendMessage(from, {
            text: 'ℹ️ You have no role assigned. Use `!roles` to select one.'
        });
    }

    await sock.sendMessage(from, {
        text: `🎭 Your role: *${roleData.role}* ${roleData.emoji}`
    });
};
