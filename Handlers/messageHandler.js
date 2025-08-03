const { incrementMessageCount } = require('../utils/messageCounter');
const { logMessage, logger } = require('../utils/logger');
const { getCommand } = require('./commandHandler');
const { sendAndTrack } = require('./SyncHandler');

const PREFIX = '!';
const COOLDOWN_MS = parseInt(process.env.COOLDOWN_MS || '15000')
const ALLOWED_USERS = (process.env.ALLOWED_USERS || '').split(',').filter(Boolean);
const ALLOWED_GROUPS = (process.env.ALLOWED_GROUPS || '').split(',').filter(Boolean);

let botReady = false;
function setBotReady(status) { botReady = status; }
function isBotReady() { return botReady; }

let messageQueue = [];

function enqueue(messageData) {
    messageQueue.push(messageData);
}

// Periodically process the queue
setInterval(async () => {
    if (!isBotReady() || messageQueue.length === 0) return;

    const { sock, msg, from, sender, text, isGroup } = messageQueue.shift();

    const [ commandName, ...args ] = text.slice(PREFIX.length).trim().split(/\s+/);
    const commandModule = getCommand(commandName);
    if (!commandModule) {
        await sendAndTrack(sock, from, { text: `❌ Unknown command: ${commandName}` }, sender, msg);
        return;
    }

    const { config, handler } = commandModule;

    if (!config.dm && !isGroup) {
        await sendAndTrack(sock, from, { text: '❌ This command can only be used in groups.' }, sender, msg);
        return;
    }

    await incrementMessageCount(from, sender, sock, msg);
    logMessage({ from, isGroup, command: commandName, input: args.join(' '), userId: sender });

    try {
        const result = await handler(sock, from, args.join(' '), msg, { sender, isGroup, command: config.command });
        if (result && typeof result === 'object' && (result.text || result.image || result.document || result.video)) {
            await sendAndTrack(sock, from, result, sender, msg);
        }
    } catch (err) {
        logger.error({ err }, `❌ Error in command: ${commandName}`);
        await sendAndTrack(sock, from, { text: '⚠️ Error executing command.' }, sender, msg).catch(() => { });
    }

}, COOLDOWN_MS);

// Main handler that pushes messages to the queue
async function handleIncomingMessages(sock, messages) {
    if (!isBotReady()) return;
    const msg = messages[ 0 ];
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!msg?.message || sender.endsWith('@g.us')) return;

    const allowed = isGroup ? ALLOWED_GROUPS.includes(from) : ALLOWED_USERS.includes(from);
    if (!allowed) return;

    const text =
        msg.message.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        '';

    if (!text.startsWith(PREFIX)) return;

    enqueue({ sock, msg, from, sender, text, isGroup });
}

let restartCallback = () => { };
function setRestartCallback(cb) { restartCallback = cb; }

module.exports = {
    handleIncomingMessages,
    setBotReady,
    isBotReady,
    setRestartCallback
};
