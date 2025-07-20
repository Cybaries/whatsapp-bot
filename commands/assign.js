const { extractMentions, getSenderId } = require('../utils/helpers');
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;

module.exports = async (sock, from, input, msg) => {
    if (!from.endsWith('@g.us')) return;

    const senderId = getSenderId(msg);
    const mentions = extractMentions(input);
    let [ role, ..._ ] = input.split(' ');
    role = role.toUpperCase();

    if (!role || mentions.length === 0) {
        return sock.sendMessage(from, {
            text: '⚠️ Usage: !assign <Role> <@mention1> <@mention2> ...'
        });
    }

    try {
        // ✅ Check if sender is admin
        const metadata = await sock.groupMetadata(from);
        const isAdmin = metadata.participants.some(
            p => p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin')
        );

        if (!isAdmin) {
            return sock.sendMessage(from, {
                text: '❌ Only *group admins* can assign roles.'
            }, { quoted: msg });
        }

        const client = new MongoClient(uri);
        await client.connect();
        const roles = client.db('whatsapp').collection('roles');

        // ⬆️ Upsert members into the role document for the group
        await roles.updateOne(
            { groupId: from, role },
            { $addToSet: { members: { $each: mentions } } },
            { upsert: true }
        );

        await sock.sendMessage(from, {
            text: `✅ Assigned role *${role}* to ${mentions.length} user(s).`
        }, { quoted: msg });

        await client.close();

    } catch (err) {
        console.error('❌ Role assign error:', err);
        await sock.sendMessage(from, {
            text: '❌ Could not assign role. Try again later.'
        });
    }
};
