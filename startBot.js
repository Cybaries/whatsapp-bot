const mongo = require('./utils/mongo');
const { createConnection } = require('./utils/connection');
const { logger } = require('./utils/logger');

async function startBot() {
    try {
        await createConnection(mongo, startBot); // 👈 pass the function itself
        logger.info('🤖 Bot started successfully.');
    } catch (e) {
        logger.error({ err: e }, '❌ Bot failed to start.');
    }
}

module.exports = { startBot };
