require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const qrcode = require('qrcode');
const Bottleneck = require('bottleneck');
const { logMessage } = require('./utils/logger');
const { default: makeWASocket, useMongoDBAuthState, makeCacheableSignalKeyStore } = require('@iamrony777/baileys');
const handleReaction = require('./utils/reactionhandler');
const mongo = require('./utils/mongo');
const connectionHandler = require('./events/connectionHandler');
const showTyping = require('./middlewares/typingIndicator');
const stats = require('./services/stats');
const delay = require('./utils/delay');
const { isSessionHealthy } = require('./utils/sessionHealth');

let fetch;
(async () => {
    fetch = (await import('node-fetch')).default;
})();
let isRestarting = false;
const app = express();
const PORT = process.env.QR_PORT || 3000;
let latestQR = '';

app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'views/qr.html')));
app.get('/health', (_, res) => {
    if (global.isReady) {
        res.status(200).send('✅ Bot is running');
    } else {
        res.status(503).send('⏳ Bot not ready');
    }
});
app.get('/qr', async (_, res) => {
    if (!latestQR) return res.json({ image: null });
    res.json({ image: await qrcode.toDataURL(latestQR) });
});
app.listen(PORT, () => console.log(`🧿 QR viewer: http://localhost:${PORT}`));

const PREFIX = '!';
const COOLDOWN_MS = parseInt(process.env.COOLDOWN_MS || '15000');
const ALLOWED_USERS = (process.env.ALLOWED_USERS || '').split(',').filter(Boolean);
const ALLOWED_GROUPS = (process.env.ALLOWED_GROUPS || '').split(',').filter(Boolean);

const userCooldowns = new Map();
const userRequestCount = new Map();
let totalRequests = 0;
const limiter = new Bottleneck({ minTime: 1500, maxConcurrent: 1 });

async function startBot() {
    if (isRestarting) return;
    isRestarting = true;

    await mongo.init();
    const collection = mongo.getDb().collection(process.env.MONGO_COLLECTION || 'auth');
    const { state, saveCreds } = await useMongoDBAuthState(collection);

    if (!isSessionHealthy(state.creds)) {
        console.warn('⚠️ Invalid or corrupted session detected. Forcing fresh login.');
        await collection.deleteMany({}); // clears stale session
        return setTimeout(startBot, 1000); // retry after fresh session
    }


    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys),
        },
        printQRInTerminal: false,
        getMessage: async () => null,
    });

    global.BOT_ID = sock.user?.id;
    sock.ev.on('creds.update', saveCreds);

    // ✅ Kaoi-style modular connection logic
    connectionHandler(sock, latestQR => (latestQR = latestQR), () => startBot());

    sock.ev.on('message-reaction', async r => {
        try {
            await handleReaction(sock, r);
        } catch (e) {
            console.error('❌ Reaction handler error:', e);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!global.isReady) return;

        const msg = messages[ 0 ];
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = msg.key.participant || msg.key.remoteJid;

        if ((isGroup && !ALLOWED_GROUPS.includes(from)) || (!isGroup && !ALLOWED_USERS.includes(from))) return;

        const text =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            '';

        if (!text.startsWith(PREFIX)) return;

        const [ command, ...args ] = text.slice(PREFIX.length).trim().split(/\s+/);
        const input = args.join(' ');

        const last = userCooldowns.get(sender) || 0;
        if (Date.now() - last < COOLDOWN_MS) return;
        userCooldowns.set(sender, Date.now());

        limiter.schedule(async () => {
            try {
                stats.incrementTotal();
                stats.incrementUser(sender);
                logMessage({ from, isGroup, command, input });

                console.log(`[+] Command from ${from} • You: ${stats.getUserCount(sender)} • Total: ${stats.getTotal()}`);

                const cmdFile = path.join(__dirname, 'commands', `${command.toLowerCase()}.js`);
                if (fs.existsSync(cmdFile)) {
                    await showTyping(sock, from, async () => {
                        await require(cmdFile)(sock, from, input, msg);
                    });
                } else {
                    await sock.sendMessage(from, { text: `❌ Unknown command: ${command}` });
                }
            } catch (e) {
                console.error('❌ Command error:', e);
                await sock.sendMessage(from, { text: '⚠️ Error executing command.' });
            }
        });
    });
    isRestarting = false;

}

startBot();

// 🛰️ Keep-alive ping
setInterval(async () => {
    try {
        const res = await fetch(process.env.PING_URL);
        console.log(`📡 Pinged self: ${res.status}`);
    } catch (e) {
        console.error('Ping failed:', e);
    }
}, 8 * 60 * 1000);
