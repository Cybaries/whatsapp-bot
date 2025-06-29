// utils/clearAuth.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function dropAuth() {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db(process.env.MONGO_DB || 'whatsapp');
    await db.collection(process.env.MONGO_COLLECTION || 'auth').drop();
    console.log('✅ Dropped old auth credentials.');
    process.exit();
}

dropAuth();