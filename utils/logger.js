const pino = require('pino');
const mongo = require('../Handlers/mongo');

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || (isProd ? 'warn' : 'info'),
    transport: isProd ? undefined : {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    }
});

/**
 * Logs a user command to MongoDB and console.
 * 
 * @param {Object} logData 
 * @param {string} logData.from - JID of message origin
 * @param {boolean} logData.isGroup - Whether it's from a group
 * @param {string} logData.command - The command issued
 * @param {string} logData.input - The input args (if any)
 * @param {string} logData.userId - JID of the sender (optional)
 */
async function logMessage({ from, isGroup, command, input, userId }) {
    try {
        const db = mongo.getDb();
        const logs = db.collection('commandLogs');

        const logEntry = {
            timestamp: new Date(),
            from,
            userId: userId || from,
            type: isGroup ? 'group' : 'private',
            command,
            input: input || null
        };

        await logs.insertOne(logEntry);

        logger.info({ ...logEntry, mongo: true }, `📥 ${isGroup ? 'Group' : 'DM'} command: !${command}`);
    } catch (err) {
        logger.error({ err }, '❌ Failed to log command to MongoDB');
    }
}

module.exports = {
    logMessage,
    logger
};
