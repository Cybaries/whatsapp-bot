const mongo = require('./mongo');

async function logMessage({ from, isGroup, command, input, userId }) {
    try {
        const db = mongo.getDb();
        const logs = db.collection('commandLogs');

        await logs.insertOne({
            timestamp: new Date(),
            from,
            userId: userId || from, // optional field
            type: isGroup ? 'group' : 'private',
            command,
            input: input || null,
        });
    } catch (err) {
        console.error('❌ Failed to log command to MongoDB:', err);
    }
}

module.exports = { logMessage };
