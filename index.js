require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const qrcode = require('qrcode');
const Bottleneck = require('bottleneck');
const { logMessage } = require('./utils/logger');
const { default: makeWASocket, useMongoDBAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@iamrony777/baileys');
const handleReaction = require('./utils/reactionhandler');
const { MongoClient } = require('mongodb');
const mongo = require('./utils/mongo');
const { incrementMessageCount } = require('./utils/messageCounter');
let fetch;
(async () => {
    fetch = (await import('node-fetch')).default;
})();

const app = express();

const PORT = process.env.QR_PORT || 3000;
let latestQR = '';

app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'views/qr.html')));
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
let sock = null;

async function startBot() {
    await mongo.init();
    const collection = mongo.getDb().collection(process.env.MONGO_COLLECTION || 'auth');

    const { state, saveCreds } = await useMongoDBAuthState(collection);
    const { version } = await fetchLatestBaileysVersion();

    if (sock?.ws?.readyState !== undefined) {
        try {
            await sock.ws.close();
        } catch (e) {
            console.warn('⚠️ Error closing existing socket:', e);
        }
    }

    sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys),
        },
        printQRInTerminal: false,
        getMessage: async () => null
    });

    global.BOT_ID = sock.user?.id;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, qr, lastDisconnect, isNewLogin }) => {
        if (qr) {
            latestQR = qr;
            console.log(`\n📸 Scan QR at: http://localhost:${PORT}`);
        }
        if (connection === 'open') {
            console.log('✅ Connected!');
            isReady = false;
            setTimeout(() => { isReady = true; }, 5000);
            latestQR = '';
            if (isNewLogin) {
                sock.sendPresenceUpdate('available');
                sock.sendMessage(sock.user.id, { text: '🤖 Bot successfully reconnected and is now active.' });
            }
        }
        if (connection === 'close') {
            console.log('❌ Disconnected:', lastDisconnect?.error?.message || lastDisconnect?.error);
            setTimeout(startBot, 3000);
        }
    });

    sock.ev.on('message-reaction', async r => {
        try {
            await handleReaction(sock, r);
        } catch (e) {
            console.error('❌ Reaction handler error:', e);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!isReady) return;
        const msg = messages[ 0 ];
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = msg.key.participant || msg.key.remoteJid;

        if (isGroup) await incrementMessageCount(from, sender, sock);


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
                logMessage({
                    from,
                    isGroup,
                    command,
                    input,
                    userId: sender // Optional — stores who triggered the command
                });

                totalRequests++;
                userRequestCount.set(sender, (userRequestCount.get(sender) || 0) + 1);
                console.log(`[+] Command from ${from} • You: ${userRequestCount.get(sender)} • Total: ${totalRequests}`);

                const cmdFile = path.join(__dirname, 'commands', `${command.toLowerCase()}.js`);
                if (fs.existsSync(cmdFile)) {
                    await require(cmdFile)(sock, from, input, msg);
                } else {
                    await sock.sendMessage(from, { text: `❌ Unknown command: ${command}` });
                }
            } catch (e) {
                console.error('❌ Command error:', e);
                await sock.sendMessage(from, { text: '⚠️ Error executing command.' });
            }
        });
    });
}

// 🔁 Start the bot
startBot();

// 🛰️ Self-ping to keep alive (Render-specific hack)
setInterval(async () => {
    try {
        const res = await fetch(process.env.PING_URL);
        console.log(`📡 Pinged self: ${res.status}`);
    } catch (e) {
        console.error('Ping failed:', e);
    }
}, 8 * 60 * 1000);  //ping every 8 minutes
