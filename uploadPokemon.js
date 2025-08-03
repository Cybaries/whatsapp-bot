// uploadPokemonImages.js
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { MongoClient, GridFSBucket } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI; // e.g. mongodb+srv://...
const DB_NAME = process.env.MONGO_DB;
const IMAGE_DIR = path.join(require('os').homedir(), 'Downloads', 'Pokemon');

async function uploadImages() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const bucket = new GridFSBucket(db, { bucketName: 'pokemonImages' });

        const files = fs.readdirSync(IMAGE_DIR)
            .filter(f => f.match(/^\d{3,4}\.png$/));

        console.log(`📦 Found ${files.length} Pokémon images to upload.`);

        for (const fileName of files) {
            const filePath = path.join(IMAGE_DIR, fileName);

            // Check if already exists
            const exists = await db.collection('pokemonImages.files').findOne({ filename: fileName });
            if (exists) {
                console.log(`⚠️ Skipping ${fileName} (already uploaded)`);
                continue;
            }

            const uploadStream = bucket.openUploadStream(fileName);
            const readStream = fs.createReadStream(filePath);

            await new Promise((resolve, reject) => {
                readStream.pipe(uploadStream)
                    .on('error', reject)
                    .on('finish', resolve);
            });

            console.log(`✅ Uploaded ${fileName}`);
        }

    } catch (err) {
        console.error('❌ Upload failed:', err);
    } finally {
        await client.close();
    }
}

uploadImages();
