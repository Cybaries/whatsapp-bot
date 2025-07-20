const { MongoClient } = require('mongodb');
const { getSenderId } = require('../utils/helpers');
const uri = process.env.MONGO_URI;

module.exports = async (sock, from, input, msg) => {
    if (!from.endsWith('@g.us')) return;

    const roleName = input.trim().toUpperCase();
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const roles = client.db('whatsapp').collection('roles');

        if (!roleName) {
            // 🔹 List all roles available in the group
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

        } else {
            // 🔹 List users in a specific role
            const roleDoc = await roles.findOne({ groupId: from, role: roleName });

            if (!roleDoc || !roleDoc.members || roleDoc.members.length === 0) {
                return sock.sendMessage(from, {
                    text: `❌ No users found with role *${roleName}*.`
                }, { quoted: msg });
            }

            const mentions = roleDoc.members;
            const mentionList = mentions.map(id => `• @${id.split('@')[ 0 ]}`).join('\n');

            return sock.sendMessage(from, {
                text: `👥 *Members with role ${roleName}:*\n${mentionList}`,
                mentions
            }, { quoted: msg });
        }

    } catch (err) {
        console.error('❌ listRole error:', err);
        await sock.sendMessage(from, {
            text: '❌ Could not fetch role list. Try again later.'
        }, { quoted: msg });
    } finally {
        await client.close();
    }
};
