const { extractMentions, getSenderId } = require('../utils/helpers');
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;

module.exports = {
    config: {
        command: 'assign',
        aliases: [],
        description: 'Assign a role to one or more mentioned users (admin-only).',
        usage: '!assign <RoleName> @mention1 @mention2 ...',
        category: 'roles',
        dm: false
    },

    handler: async (sock, from, input, msg) => {
        if (!from.endsWith('@g.us')) {
            return sock.sendMessage(from, {
                text: '❌ This command can only be used in *group chats*.'
            }, { quoted: msg });
        }

        const senderId = getSenderId(msg);
        const mentions = extractMentions(input);
        let [ roleName, ..._ ] = input.trim().split(/\s+/);
        roleName = roleName?.toUpperCase();

        if (!roleName || mentions.length === 0) {
            return sock.sendMessage(from, {
                text: '⚠️ Usage: `!assign <RoleName> @mention1 @mention2 ...`'
            }, { quoted: msg });
        }

        try {
            // ✅ Check if sender is an admin
            const metadata = await sock.groupMetadata(from);
            const isAdmin = metadata.participants.some(
                p => p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin')
            );

            if (!isAdmin) {
                return sock.sendMessage(from, {
                    text: '🚫 Only *group admins* can assign roles.'
                }, { quoted: msg });
            }

            // 🔗 Connect to MongoDB
            const client = new MongoClient(uri);
            await client.connect();
            const roles = client.db('whatsapp').collection('roles');

            // 🔄 Upsert role with mentioned members
            await roles.updateOne(
                { groupId: from, role: roleName },
                { $addToSet: { members: { $each: mentions } } },
                { upsert: true }
            );

            await sock.sendMessage(from, {
                text: `✅ Assigned role *${roleName}* to ${mentions.length} user(s).`
            }, { quoted: msg });

            await client.close();

        } catch (err) {
            console.error('❌ Role assign error:', err);
            await sock.sendMessage(from, {
                text: '❌ Could not assign role. Please try again later.'
            }, { quoted: msg });
        }
    }
};
