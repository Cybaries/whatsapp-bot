// connection.js
const {
    default: makeWASocket,
    useMongoDBAuthState,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require('@iamrony777/baileys');
const { Boom } = require('@hapi/boom');
const { logMessage, logger } = require('./logger');
const { deleteStaleAuth } = require('./clearAuth.js');
const {
    handleIncomingMessages,
    handleReaction,
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

    global.BOT_ID = sock.user?.id;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update;

        if (qr) {
            latestQR = qr;
            logger.info(`📸 New QR available at: http://localhost:${process.env.QR_PORT || 3000}`);
        }

        if (connection === 'open') {
            logger.info('✅ WhatsApp connection opened');
            isReady = false;
            setBotReady(true);
            setTimeout(() => { isReady = true; }, 5000);
            latestQR = '';

            if (isNewLogin) {
                await sock.sendPresenceUpdate('available');
                await sock.sendMessage(sock.user.id, { text: '🤖 Bot successfully reconnected and is now active.' });
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

    sock.ev.on('message-reaction', async r => {
        try {
            await handleReaction(sock, r);
        } catch (e) {
            logger.error({ err: e }, '❌ Reaction handler error');
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
