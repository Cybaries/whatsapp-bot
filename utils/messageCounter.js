// utils/messageCounter.js
const mongo = require('./mongo');

async function incrementMessageCount(groupId, userId) {
    const db = mongo.getDb();
    const collection = db.collection('messageStats');

    await collection.updateOne(
        { groupId, userId },
        { $inc: { messageCount: 1 }, $set: { lastUpdated: new Date() } },
        { upsert: true }
    );
}

async function getMessageStats(groupId, userId) {
    const db = mongo.getDb();
    const collection = db.collection('messageStats');

    return await collection.findOne({ groupId, userId });
}

module.exports = { incrementMessageCount, getMessageStats };
