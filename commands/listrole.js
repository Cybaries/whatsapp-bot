const { MongoClient } = require('mongodb');
const { getSenderId } = require('../utils/helpers');

const uri = process.env.MONGO_URI;

module.exports = {
    config: {
        command: 'listrole',
        aliases: [ 'roles' ],
        description: 'List all roles or members with a specific role in the group.',
        usage: '!listrole [RoleName]',
        category: 'roles',
        dm: false
    },

    handler: async (sock, from, input, msg) => {
        if (!from.endsWith('@g.us')) return;

        const roleName = input.trim().toUpperCase();
        const client = new MongoClient(uri);

        try {
            await client.connect();
            const roles = client.db('whatsapp').collection('roles');

            // 🔹 No input: list all roles
            if (!roleName) {
                const allRoles = await roles.find({ groupId: from }).toArray();

                if (!allRoles.length) {
                    return sock.sendMessage(from, {
                        text: '📭 No roles have been assigned in this group yet.'
                    }, { quoted: msg });
                }

                const roleList = allRoles.map(r => `• ${r.role}`).join('\n');

                return sock.sendMessage(from, {
                    text: `📜 *Roles in this group:*\n${roleList}`
                }, { quoted: msg });
            }

            // 🔹 Input present: show members in a role
            const roleDoc = await roles.findOne({ groupId: from, role: roleName });

            if (!roleDoc || !roleDoc.members?.length) {
                return sock.sendMessage(from, {
                    text: `❌ No users found with role *${roleName}*.`
                }, { quoted: msg });
            }

            const mentionList = roleDoc.members.map(id => `• @${id.split('@')[ 0 ]}`).join('\n');

            return sock.sendMessage(from, {
                text: `👥 *Members with role ${roleName}:*\n${mentionList}`,
                mentions: roleDoc.members
            }, { quoted: msg });

        } catch (err) {
            console.error('❌ listrole error:', err);
            await sock.sendMessage(from, {
                text: '❌ Could not fetch role list. Please try again later.'
            }, { quoted: msg });
        } finally {
            await client.close();
        }
    }
};
