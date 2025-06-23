require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const qrcode = require('qrcode');
const Bottleneck = require('bottleneck');
const { logMessage } = require('./utils/logger');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const handleReaction = require('./utils/reactionhandler');

const app = express();
const PORT = 3000;

let latestQR = ''; // for storing current QR

// Serve static HTML for QR viewer
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'views', 'qr.html')));

// Serve latest QR as base64 image
app.get('/qr', async (_, res) => {
    if (!latestQR) return res.json({ image: null });
    const image = await qrcode.toDataURL(latestQR);
    res.json({ image });
});

app.listen(PORT, () => {
    console.log(`🧿 QR viewer: http://localhost:${PORT}`);
});

const PREFIX = '!';
const COOLDOWN_MS = 15 * 1000;

const ALLOWED_USERS = [ '918102490016@s.whatsapp.net', '919523554487@s.whatsapp.net' ];
const ALLOWED_GROUPS = [ '916299504768-1579795063@g.us' ];

const userCooldowns = new Map();
const userRequestCount = new Map();
let totalRequests = 0;

const limiter = new Bottleneck({ minTime: 1500, maxConcurrent: 1 });

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        getMessage: async () => null
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update;

        if (qr) {
            latestQR = qr;
            console.log(`\n🔑 [QR RECEIVED] Scan it from: http://localhost:${PORT}`);
        }

        if (connection === 'connecting') {
            console.log('📶 [CONNECTING] Establishing connection to WhatsApp...');
        }

        if (connection === 'open') {
            console.log('✅ [CONNECTED] WhatsApp connection established!');
            global.BOT_ID = sock.user.id;
            console.log(`🤖 Bot connected as: ${BOT_ID}`);

            latestQR = '';
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.payload?.message || 'unknown';
            console.log(`❌ [DISCONNECTED] Reason: ${reason}`);

            // Don't auto-reconnect to avoid conflicts
            if (reason.includes('restart required') || reason.includes('stream errored')) {
                console.log('♻️ Attempting auto-reconnect due to stream error...');
                setTimeout(() => {
                    startBot(); // restart safely after a pause
                }, 3000);
            }
        }
    });

    sock.ev.on('message-reaction', async (reactionUpdate) => {
        try {
            await handleReaction(sock, reactionUpdate);
        } catch (err) {
            console.error('❌ Error handling reaction:', err);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[ 0 ];
        // if (!msg.message || msg.key.fromMe) return;
        // console.log('📨 Raw message:', JSON.stringify(msg, null, 2));

        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const isAllowedGroup = ALLOWED_GROUPS.includes(from);
        const isAllowedUser = ALLOWED_USERS.includes(from);
        // if (isGroup) {
        //     const groupId = from;
        //     console.log(`👥 Message received from group ID: ${groupId}`);
        // }

        if ((isGroup && !isAllowedGroup) || (!isGroup && !isAllowedUser)) {
            return;
        }

        const body = msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption || '';

        if (!body.startsWith(PREFIX)) return;

        const [ command, ...args ] = body.slice(PREFIX.length).trim().split(/\s+/);
        const input = args.join(' ').trim();

        const lastTime = userCooldowns.get(from) || 0;
        if (Date.now() - lastTime < COOLDOWN_MS) return;
        userCooldowns.set(from, Date.now());

        limiter.schedule(async () => {
            try {
                logMessage({ from, isGroup, command, input });

                totalRequests += 1;
                userRequestCount.set(from, (userRequestCount.get(from) || 0) + 1);
                console.log(`[+] Command from ${from} | User total: ${userRequestCount.get(from)} | All: ${totalRequests}`);

                const cmdPath = path.join(__dirname, 'commands', `${command.toLowerCase()}.js`);
                if (fs.existsSync(cmdPath)) {
                    const handler = require(cmdPath);
                    await handler(sock, from, input, msg);
                } else {
                    await sock.sendMessage(from, { text: `❌ Unknown command: ${command}` });
                }
            } catch (err) {
                await sock.sendMessage(from, { text: '⚠️ Error executing command.' });
                console.error(err);
            }
        });
    });
}

startBot();
