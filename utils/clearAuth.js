const mongo = require('./mongo');

async function deleteStaleAuth() {
    try {
        const collection = mongo.getDb().collection('authState'); // ← direct collection
        const result = await collection.deleteMany({ id: { $regex: '^session-' } });
        console.log(`🧹 Deleted ${result.deletedCount} documents from authState.`);
    } catch (err) {
        console.error('❌ Failed to delete auth:', err);
    }
}

module.exports = { deleteStaleAuth };