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
            return {
                text: '❌ This command can only be used in *group chats*.'
            };
        }

        const senderId = getSenderId(msg);
        const mentions = extractMentions(input);
        let [ roleName, ..._ ] = input.trim().split(/\s+/);
        roleName = roleName?.toUpperCase();

        if (!roleName || mentions.length === 0) {
            return {
                text: '⚠️ Usage: `!assign <RoleName> @mention1 @mention2 ...`'
            };
        }

        try {
            // ✅ Check if sender is an admin
            const metadata = await sock.groupMetadata(from);
            const isAdmin = metadata.participants.some(
                p => p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin')
            );

            if (!isAdmin) {
                return {
                    text: '🚫 Only *group admins* can assign roles.'
                };
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

            const response = {
                text: `✅ Assigned role *${roleName}* to ${mentions.length} user(s).`
            };

            await client.close();
            return response;
        } catch (err) {
            console.error('❌ Role assign error:', err);
            return {
                text: '❌ Could not assign role. Please try again later.'
            };
        }
    }
};
