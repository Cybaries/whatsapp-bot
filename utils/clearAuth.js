const mongo = require('./mongo');

async function deleteStaleAuth() {
    try {
        const collection = mongo.getDb().collection(process.env.MONGO_COLLECTION || 'whatsapp');
        const result = await collection.deleteMany({ type: 'authState' }); // 🛡️ only auth-related docs
        console.log(`🧹 Deleted ${result.deletedCount} authState documents.`);
    } catch (err) {
        console.error('❌ Failed to delete auth:', err);
    }
}

module.exports = { deleteStaleAuth };
