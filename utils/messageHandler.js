const { incrementMessageCount } = require('./messageCounter');
const { logMessage, logger } = require('./logger');
const { getCommand } = require('./commandHandler');

const PREFIX = '!';
const COOLDOWN_MS = parseInt(process.env.COOLDOWN_MS || '15000');
const ALLOWED_USERS = (process.env.ALLOWED_USERS || '').split(',').filter(Boolean);
const ALLOWED_GROUPS = (process.env.ALLOWED_GROUPS || '').split(',').filter(Boolean);

const userCooldowns = new Map();
const LAST_REPLY_TIMES = new Map();
let botReady = false;

function setBotReady(status) { botReady = status; }
function isBotReady() { return botReady; }

async function handleIncomingMessages(sock, messages) {
    // console.log([ ...require('./commandHandler').commandMap.keys() ]);
    if (!isBotReady()) return;

    const msg = messages[ 0 ];
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!msg?.message || sender.endsWith('@g.us')) return;

    const allowed = isGroup ? ALLOWED_GROUPS.includes(from) : ALLOWED_USERS.includes(from);
    if (!allowed) return;

    const text = msg.message.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || '';
    if (!text.startsWith(PREFIX)) return;

    const [ commandName, ...args ] = text.slice(PREFIX.length).trim().split(/\s+/);
    if (Date.now() - (userCooldowns.get(sender) || 0) < COOLDOWN_MS) return;
    userCooldowns.set(sender, Date.now());

    const commandModule = getCommand(commandName);
    if (!commandModule) {
        await sock.sendMessage(from, { text: `❌ Unknown command: ${commandName}` });
        return;
    }

    const { config, handler } = commandModule;
    if (!config.dm && !isGroup) {
        await sock.sendMessage(from, { text: '❌ This command can only be used in groups.' });
        return;
    }

    await incrementMessageCount(from, sender, sock, msg);
    logMessage({ from, isGroup, command: commandName, input: args.join(' '), userId: sender });

    const now = Date.now();
    // if last sent message was older than 5 minutes, encryption keys sync again
    // 5 * 60 * 1000 = 300000
    if (now - (LAST_REPLY_TIMES.get(sender) || 0) > 300000) {
        try {
            const dummyMsg = await sock.sendMessage(BOT_ID, { text: '.' });
            await new Promise(r => setTimeout(r, 4000));
            await sock.sendMessage(from, {
                delete: {
                    remoteJid: from,
                    fromMe: true,
                    id: dummyMsg.key.id,
                    participant: dummyMsg.key.participant || undefined
                }
            });
        } catch (err) {
            logger.warn({ err }, `⚠️ Failed refresh encryption for ${sender}`);
        }
    }
    try {
        await handler(sock, from, args.join(' '), msg, { sender, isGroup, command: config.command });
    } catch (err) {
        logger.error({ err }, `❌ Error in command: ${commandName}`);
        await sock.sendMessage(from, { text: '⚠️ Error executing command.' }).catch(() => { });
    }

    LAST_REPLY_TIMES.set(sender, now);
}

let restartCallback = () => { };

function setRestartCallback(cb) {
    restartCallback = cb;
}

module.exports = {
    handleIncomingMessages,
    setBotReady,
    isBotReady,
    setRestartCallback
};
