const { logger } = require('../utils/logger');

const LAST_REPLY_TIMES = new Map(); // Moved here — private to this module

async function sendAndTrack(sock, jid, output, sender, msg) {
    const now = Date.now();
    const lastReplyTime = LAST_REPLY_TIMES.get(sender) || 0;

    // ⏳ Sync encryption keys if last reply was over 5 minutes ago
    if (now - lastReplyTime > 5 * 60 * 1000) {
        try {
            const dummy = await sock.sendMessage(jid, { text: '🔑 syncing...' });
            await new Promise(r => setTimeout(r, 4000));
            await sock.sendMessage(jid, {
                delete: {
                    remoteJid: jid,
                    fromMe: true,
                    id: dummy.key.id,
                    participant: dummy.key.participant || undefined
                }
            });
        } catch (err) {
            logger.warn({ err }, `⚠️ Failed to sync encryption for ${sender}`);
        }
    }

    // ✅ Send actual output
    const result = await sock.sendMessage(jid, output, { quoted: msg });
    // console.log(result);
    LAST_REPLY_TIMES.set(sender, now); // ⏱️ Update time
    return result;
}

module.exports = { sendAndTrack };
