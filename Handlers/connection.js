// connection.js
const {
    default: makeWASocket,
    useMongoDBAuthState,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require('@iamrony777/baileys');
const { Boom } = require('@hapi/boom');
const { logMessage, logger } = require('../utils/logger.js');
const { deleteStaleAuth } = require('../utils/clearAuth.js');
const ALLOWED_GROUPS = (process.env.ALLOWED_GROUPS || '').split(',').filter(Boolean);
const {
    handleIncomingMessages,
    setBotReady,
    setRestartCallback,
} = require('./messageHandler');


let latestQR = '';
let isReady = false;

function getLatestQR() {
    return latestQR;
}

async function createConnection(mongo, restartCallback = () => { }) {
    await mongo.init();
    const collection = mongo.getDb().collection(process.env.MONGO_COLLECTION || 'auth');
    const { state, saveCreds } = await useMongoDBAuthState(collection);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys),
        },
        printQRInTerminal: false,
        getMessage: async () => null
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('group-participants.update', async (update) => {
        const { id: groupId, participants, action } = update;

        if (!ALLOWED_GROUPS.includes(groupId)) return;

        if (action === 'add') {
            for (const participant of participants) {
                try {
                    const contact = await sock.onWhatsApp(participant);
                    const username = contact?.[ 0 ]?.notify || participant.split('@')[ 0 ];
                    const groupMetadata = await sock.groupMetadata(groupId);
                    const groupName = groupMetadata.subject;
                    await sock.sendMessage(groupId, {
                        text: `
╭───────────────★
│ 👋  *Welcome, @${participant.split('@')[ 0 ]}!*  
│ 
│ 🎉 We're glad to have you in *${groupName}*!
│ 
│ 💬 Feel free to:
│ ├─ Introduce yourself
│ ├─ Ask questions
│ └─ Join the conversation
│ 
│ 🤝 Let's grow together!
╰───────────────★
`,
                        mentions: [ participant ]
                    });
                } catch (err) {
                    console.error('❌ Error sending welcome message:', err);
                }
            }
        }
    });


    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update;

        if (qr) {
            latestQR = qr;
            logger.info(`📸 New QR available at: http://localhost:${process.env.QR_PORT || 3000}`);
        }

        if (connection === 'open') {
            logger.info('✅ WhatsApp connection opened');
            global.BOT_ID = sock.user?.id;
            isReady = false;
            setBotReady(true);
            setTimeout(() => { isReady = true; }, 5000);
            latestQR = '';

            if (isNewLogin) {
                await sock.sendPresenceUpdate('available');
                await sock.sendMessage(BOT_ID, { text: '🤖 Bot successfully reconnected and is now active.' });
                logger.info('🔁 New session initialized and notified');
            }
        }

        if (connection === 'close') {
            const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
            setBotReady(false);
            switch (code) {
                case DisconnectReason.loggedOut:
                    console.log('🔒 You are logged out. Deleting stale auth...');
                    await deleteStaleAuth();
                    break;

                case DisconnectReason.restartRequired:
                case DisconnectReason.connectionClosed:
                case DisconnectReason.connectionLost:
                case DisconnectReason.timedOut:
                    console.log('📡 Connection issue. Reconnecting...');
                    return restartCallback();

                default:
                    console.log(`❌ Connection closed with code ${code}. Reconnecting...`);
                    return restartCallback();
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!isReady || !messages || messages.length === 0) return;
        await handleIncomingMessages(sock, messages);
    });
    setRestartCallback(restartCallback);
    return sock;
}

module.exports = { createConnection, getLatestQR };
