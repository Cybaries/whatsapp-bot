const { MongoClient } = require('mongodb');

let client;
let db;

module.exports = {
    init: async () => {
        if (!client) {
            client = new MongoClient(process.env.MONGO_URI);
            await client.connect();
            db = client.db(process.env.MONGO_DB || 'whatsapp');
            console.log('✅ MongoDB connected');
        }
    },

    getDb: () => {
        if (!db) {
            throw new Error('❌ MongoDB not initialized. Call init() first.');
        }
        return db;
    },

    close: async () => {
        if (client) {
            await client.close();
            client = null;
            db = null;
            console.log('❎ MongoDB connection closed');
        }
    }
};
