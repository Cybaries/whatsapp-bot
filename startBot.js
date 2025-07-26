// startBot.js
const path = require('path');
const mongo = require('./utils/mongo');
const { createConnection } = require('./utils/connection');
const { logger } = require('./utils/logger');
const { loadCommands } = require('./utils/commandHandler');

async function startBot() {
    try {
        await createConnection(mongo, startBot);
        logger.info('🤖 Bot started successfully.');
    } catch (e) {
        logger.error({ err: e }, '❌ Bot failed to start.');
    }
    finally {
        loadCommands(path.join(__dirname, 'commands'));
    }
}

module.exports = { startBot };
