const path = require('path');
const fs = require('fs');
const { incrementMessageCount } = require('./messageCounter');
const { logMessage, logger } = require('./logger');

const PREFIX = '!';
const COOLDOWN_MS = parseInt(process.env.COOLDOWN_MS || '15000');
const ALLOWED_USERS = (process.env.ALLOWED_USERS || '').split(',').filter(Boolean);
const ALLOWED_GROUPS = (process.env.ALLOWED_GROUPS || '').split(',').filter(Boolean);
const retryAttempts = new Map();

const userCooldowns = new Map();
const userRequestCount = new Map();
let totalRequests = 0;
let botReady = false;
const retryQueue = [];
const MAX_RETRIES = 3;

function setBotReady(status) {
    botReady = status;
}

function isBotReady() {
    return botReady;
}

const messageQueue = [];
let processingQueue = false;
let restartCallback = () => { };

function setRestartCallback(cb) {
    restartCallback = cb;
}

function isSocketAlive(sock) {
    return !!sock?.user && !sock?.ev?.isClosed;
}

async function processRetryQueue() {
    if (retryQueue.length === 0) return;

    logger.info(`🔁 Processing retry queue with ${retryQueue.length} messages...`);

    const toRetry = [ ...retryQueue ];
    retryQueue.length = 0;

    for (const item of toRetry) {
        if (item.attempts >= MAX_RETRIES) {
            logger.warn(`❌ Dropping message after ${MAX_RETRIES} attempts: ${item.command}`);
            continue;
        }

        try {
            logger.info(`🔁 Retrying command: ${item.command} (Attempt ${item.attempts + 1})`);
            messageQueue.push({ ...item });
            processQueue();
        } catch (err) {
            item.attempts += 1;
            retryQueue.push(item);
        }
    }
}

async function processQueue() {
    if (processingQueue || messageQueue.length === 0) return;
    processingQueue = true;

    while (messageQueue.length > 0) {
        const { sock, from, command, input, msg, sender, isGroup } = messageQueue.shift();

        try {
            if (!isSocketAlive(sock)) {
                logger.warn('🛑 Skipping command due to closed socket.');
                continue;
            }

            logMessage({ from, isGroup, command, input, userId: sender });
            logger.info({ type: 'command', from, isGroup, command, input, userId: sender }, 'Processing command from queue');

            totalRequests++;
            userRequestCount.set(sender, (userRequestCount.get(sender) || 0) + 1);

            const cmdFile = path.join(__dirname, '../commands', `${command.toLowerCase()}.js`);
            if (fs.existsSync(cmdFile)) {
                await require(cmdFile)(sock, from, input, msg);
            } else {
                await sock.sendMessage(from, { text: `❌ Unknown command: ${command}` });
                logger.warn(`⚠️ Unknown command: !${command}`);
            }
        } catch (err) {
            logger.error({ err }, `❌ Error running command from queue: ${command}`);
            try {
                await sock.sendMessage(from, { text: '⚠️ Error executing command.' });
            } catch (sendErr) {
                logger.error({ err: sendErr }, '❌ Failed to send fallback error message.');
            }
        }
    }

    processingQueue = false;
}

async function handleIncomingMessages(sock, messages) {
    if (!isBotReady()) {
        logger.warn('⏸ Bot not ready, deferring message processing...');
        return;
    }

    const msg = messages[ 0 ];
    if (!msg?.message) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = msg.key.participant || msg.key.remoteJid;

    // 🛡️ Early exit for status broadcast or unauthorized senders/groups
    if (sender.endsWith('@g.us')) return;

    const isAllowed =
        (isGroup && ALLOWED_GROUPS.includes(from)) ||
        (!isGroup && ALLOWED_USERS.includes(from));

    if (!isAllowed) return;

    try {
        if (isGroup) {
            await incrementMessageCount(from, sender, sock, msg);
        }

        const text = msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption || '';

        if (!text.startsWith(PREFIX)) return;

        const [ command, ...args ] = text.slice(PREFIX.length).trim().split(/\s+/);
        const input = args.join(' ');

        const last = userCooldowns.get(sender) || 0;
        if (Date.now() - last < COOLDOWN_MS) return;
        userCooldowns.set(sender, Date.now());

        messageQueue.push({ sock, from, command, input, msg, sender, isGroup });
        processQueue();

    } catch (err) {
        const remoteJid = msg?.key?.remoteJid;
        const messageId = msg?.key?.id;

        const msgStr = err?.message || '';
        const isDecryptionError = /decrypt|undecryptable|no session|senderkey/i.test(msgStr);

        if (isDecryptionError && remoteJid && messageId) {
            const previousAttempt = retryAttempts.get(messageId) || 0;

            if (previousAttempt < 1) {
                retryAttempts.set(messageId, previousAttempt + 1);
                logger.warn(`⚠️ First decryption attempt failed for ${messageId}. Waiting for retry...`);

                retryQueue.push({
                    sock,
                    from: remoteJid,
                    command: 'unknown',
                    input: '',
                    msg,
                    sender: msg.key.participant || msg.key.remoteJid,
                    isGroup: remoteJid.endsWith('@g.us'),
                    attempts: previousAttempt + 1
                });

                return;
            }

            retryAttempts.delete(messageId);

            const isAllowed =
                (isGroup && ALLOWED_GROUPS.includes(remoteJid)) ||
                (!isGroup && ALLOWED_USERS.includes(remoteJid));

            if (!isAllowed) return;

            const responseText = '⚠️ Could not decrypt your message. Please resend the command.';

            try {
                await sock.sendMessage(remoteJid, {
                    text: responseText,
                }, msg?.message ? { quoted: msg } : undefined);
            } catch (err) {
                if (/prekey|session/i.test(err.message)) {
                    logger.warn(`⚠️ Session error for ${remoteJid}, retrying...`);
                    await new Promise(res => setTimeout(res, 500));
                    try {
                        await sock.sendMessage(remoteJid, {
                            text: responseText,
                        }, msg?.message ? { quoted: msg } : undefined);
                    } catch (innerErr) {
                        logger.error({ err: innerErr }, '❌ Retry failed after session refresh.');
                    }
                } else {
                    logger.error({ err }, '❌ Failed to send decryption error message.');
                }
            }
            return;
        }

        logger.error({ err }, '❌ Unexpected error in handleIncomingMessages');
    }
}

module.exports = {
    handleIncomingMessages,
    setRestartCallback,
    setBotReady,
    isBotReady,
    processRetryQueue
};
