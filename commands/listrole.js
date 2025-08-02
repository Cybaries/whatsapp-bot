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
                    return {
                        text: '📭 No roles have been assigned in this group yet.'
                    };
                }

                const roleList = allRoles.map(r => `• ${r.role}`).join('\n');

                return {
                    text: `📜 *Roles in this group:*\n${roleList}`
                };
            }

            // 🔹 Input present: show members in a role
            const roleDoc = await roles.findOne({ groupId: from, role: roleName });

            if (!roleDoc || !roleDoc.members?.length) {
                return {
                    text: `❌ No users found with role *${roleName}*.`
                };
            }

            const mentionList = roleDoc.members.map(id => `• @${id.split('@')[ 0 ]}`).join('\n');

            return {
                text: `👥 *Members with role ${roleName}:*\n${mentionList}`,
                mentions: roleDoc.members
            };

        } catch (err) {
            console.error('❌ listrole error:', err);
            return {
                text: '❌ Could not fetch role list. Please try again later.'
            };
        } finally {
            await client.close();
        }
    }
};
