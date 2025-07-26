// commands/ping.js

const mongo = require('../utils/mongo');
const { getSenderId } = require('../utils/helpers');
const { getDisplayName } = require('../utils/getDisplayName');

const pingCooldowns = new Map(); // groupId -> lastTimestamp

module.exports = {
    config: {
        command: 'ping',
        aliases: [],
        description: 'Tag all users or a specific role (admin only)',
        usage: '!ping [@role] [message]',
        category: 'general',
        dm: false
    },

    handler: async (sock, from, input, msg) => {
        if (!from.endsWith('@g.us')) {
            return sock.sendMessage(from, {
                text: '❌ The `!ping` command can only be used in group chats.'
            });
        }

        try {
            const metadata = await sock.groupMetadata(from);
            const senderId = getSenderId(msg);

            const senderInfo = metadata.participants.find(p => p.id === senderId);
            const isAdmin = senderInfo?.admin === 'admin' || senderInfo?.admin === 'superadmin';

            if (!isAdmin) {
                return sock.sendMessage(from, {
                    text: '🚫 Only *admins* can use `!ping` in this group.'
                });
            }

            // ⏱ Group Cooldown (60 sec)
            const now = Date.now();
            const lastPing = pingCooldowns.get(from) || 0;
            if (now - lastPing < 60_000) {
                const remaining = Math.ceil((60_000 - (now - lastPing)) / 1000);
                return sock.sendMessage(from, {
                    text: `⏳ Please wait ${remaining}s before using \`!ping\` again.`
                });
            }
            pingCooldowns.set(from, now);

            const botId = (global.BOT_ID || '').split(':')[ 0 ];
            const inputParts = input.trim().split(/\s+/);
            const [ firstWord, ...restWords ] = inputParts;

            const db = await mongo.getDb();
            const rolesCollection = db.collection('roles');

            let mentions = [];
            let mentionType = 'everyone';
            let messageBody = input.trim();

            // 🔍 Role-based ping
            if (firstWord?.startsWith('@')) {
                const roleName = firstWord.slice(1).toUpperCase();
                const roleDoc = await rolesCollection.findOne({ groupId: from, role: roleName });

                if (roleDoc && Array.isArray(roleDoc.members) && roleDoc.members.length > 0) {
                    mentions = roleDoc.members.filter(id => id !== botId);
                    mentionType = `@${roleName}`;
                    messageBody = restWords.join(' ').trim();
                } else {
                    return sock.sendMessage(from, {
                        text: `❌ No users found with the role \`${roleName}\`.`
                    });
                }
            } else {
                // Ping all group members
                for (const p of metadata.participants) {
                    const id = p.id;
                    if (!id || typeof id !== 'string') continue;
                    if (id === botId || !id.endsWith('@s.whatsapp.net')) continue;
                    mentions.push(id);
                }
            }

            const senderName = await getDisplayName(sock, senderId);
            const taggerMention = `@${senderName.split('@')[ 1 ]}`;
            const readableMentionType = mentionType === 'everyone' ? '@everyone' : mentionType;
            const displayMessage = messageBody || '(No message provided)';

            const finalMessage = `💬 *Message:* ${displayMessage}\n\n📣 *Tagger:* ${taggerMention}\n📧 *Tags:* ${readableMentionType}`;

            await sock.sendMessage(from, {
                text: finalMessage,
                mentions
            }, { quoted: msg });

            console.log(`✅ !ping sent to ${mentions.length} members with role "${mentionType}"`);
        } catch (err) {
            console.error('❌ Error in !ping command:', err);
            await sock.sendMessage(from, {
                text: '⚠️ Could not send ping. Something went wrong.'
            });
        }
    }
};
