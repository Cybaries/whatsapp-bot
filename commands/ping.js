const fs = require('fs');
const path = require('path');
const { getSenderId } = require('../utils/helpers');


const pingCooldowns = new Map(); // groupId -> lastTimestamp

module.exports = async (sock, from, input, msg) => {
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

        // ⏱ Cooldown
        const now = Date.now();
        const lastPing = pingCooldowns.get(from) || 0;
        if (now - lastPing < 60_000) {
            const remaining = Math.ceil((60_000 - (now - lastPing)) / 1000);
            return sock.sendMessage(from, {
                text: `⏳ Please wait ${remaining}s before using \`!ping\` again.`
            });
        }
        pingCooldowns.set(from, now);

        const botIdRaw = global.BOT_ID;
        const botId = botIdRaw.split(':')[ 0 ]; // remove suffix like ":46"

        const mentions = [];
        const failedMentions = [];

        // 🧠 Build mention list safely
        for (const p of metadata.participants) {
            const id = p.id;
            if (!id || typeof id !== 'string') {
                failedMentions.push({ reason: 'Invalid ID', id });
                continue;
            }

            if (id === botId) {
                continue; // skip bot
            }

            if (!id.endsWith('@s.whatsapp.net')) {
                failedMentions.push({ reason: 'Malformed JID', id });
                continue;
            }

            mentions.push(id);
        }

        // 💬 Build visible @mention string
        const mentionText = mentions.map(id => `@${id.split('@')[ 0 ]}`).join(' ');

        // ✍️ Sender name
        let senderName = 'Unknown';

        try {
            const contact = await sock.onWhatsApp(senderId);
            senderName =
                contact?.[ 0 ]?.notify ||
                contact?.[ 0 ]?.name ||
                senderInfo?.name ||
                senderId.split('@')[ 0 ];
        } catch {
            senderName = senderInfo?.name || senderId.split('@')[ 0 ];
        }

        const message = input?.trim() || '📢 Attention everyone!';
        const fullMessage = `${message}\n\n${mentionText}\n\n👤 _~ ${senderName}_`;

        // ✅ Send ping
        await sock.sendMessage(from, {
            text: fullMessage,
            mentions
        });

        // ✅ Log failed mentions
        if (failedMentions.length > 0) {
            const logPath = path.join(__dirname, '..', 'logs', 'ping_failed_mentions.log');
            const groupName = metadata.subject;
            const timestamp = new Date().toISOString();

            const logText = failedMentions.map(f => `- ${f.id || 'UNKNOWN'} (${f.reason})`).join('\n');

            const fullLog = `[${timestamp}] Group: "${groupName}" (${from}) | Sender: ${senderName} (${senderId})\nFailed to mention:\n${logText}\n\n`;

            fs.appendFile(logPath, fullLog, err => {
                if (err) console.error('❌ Failed to log ping errors:', err);
                else console.log(`⚠️ Logged ${failedMentions.length} mention errors.`);
            });
        }

        console.log(`✅ !ping sent to ${mentions.length} members (group: ${metadata.subject})`);

    } catch (err) {
        console.error('❌ Error in !ping command:', err);
        await sock.sendMessage(from, {
            text: '⚠️ Could not send ping. Something went wrong.'
        });
    }
};
