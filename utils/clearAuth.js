const mongo = require('./mongo');

async function deleteStaleAuth() {
    try {
        const collection = mongo.getDb().collection(process.env.MONGO_COLLECTION || 'authState');
        const result = await collection.deleteMany({});
        console.log(`🧹 Deleted ${result.deletedCount} documents from auth state.`);
    } catch (err) {
        console.error('❌ Failed to delete auth:', err);
    }
}

module.exports = { deleteStaleAuth };

// Run when file is executed directly
if (require.main === module) {
    require('dotenv').config();
    (async () => {
        await mongo.init();
        await deleteStaleAuth();
        process.exit(0);
    })();
}
