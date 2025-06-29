const mongo = require('../mongo');
const { getSenderId } = require('../utils/helpers');

module.exports = async (sock, from, _, msg) => {
    if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ `!listroles` can only be used in groups.' });
    }

    const db = mongo.getDb();
    const roles = await db.collection(process.env.ROLE_COLLECTION || 'roles')
        .find({ group: from })
        .toArray();

    if (roles.length === 0) {
        return sock.sendMessage(from, {
            text: 'ℹ️ No roles assigned in this group yet. Use `!roles` to start.'
        });
    }

    const lines = roles.map(r => `• @${r.user.split('@')[ 0 ]} → *${r.role}* ${r.emoji}`);
    const text = `📋 *Group Roles*\n\n${lines.join('\n')}`;

    await sock.sendMessage(from, {
        text,
        mentions: roles.map(r => r.user)
    });
};
