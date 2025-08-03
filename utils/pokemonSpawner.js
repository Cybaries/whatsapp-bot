const fs = require('fs');
const path = require('path');
const { getDb } = require('../Handlers/mongo');

const { sendAndTrack } = require('../Handlers/SyncHandler');

let sock;
let isRunning = false;
let spawnerLoop;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

async function startPokemonSpawner(_sock) {
    if (isRunning) return;
    sock = _sock;
    isRunning = true;
    console.log('🟢 Pokémon Spawner started');
    spawnerLoop = loop();
}

async function stopPokemonSpawner() {
    isRunning = false;
    console.log('🔴 Pokémon Spawner stopped');
}

async function loop() {
    const db = getDb();
    const settingsCol = db.collection('pokemon_settings');
    const activeCol = db.collection('pokemon_active');

    const pokemonFolder = path.join(__dirname, '..', 'Pokemon_Game_Resources');
    const allFiles = fs.readdirSync(pokemonFolder).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));

    if (allFiles.length === 0) {
        console.log("❌ No Pokémon images found in the folder.");
        await stopPokemonSpawner();
        return;
    }

    while (isRunning) {
        try {
            const enabledGroups = await settingsCol.find({ enabled: true }).toArray();

            if (enabledGroups.length === 0) {
                await stopPokemonSpawner();
                break;
            }

            const randomFile = allFiles[ getRandomInt(0, allFiles.length - 1) ];
            const imagePath = path.join(pokemonFolder, randomFile);
            const imageBuffer = fs.readFileSync(imagePath);

            if (!imageBuffer || imageBuffer.length < 100) {
                console.log(`[ERROR] Invalid image: ${randomFile}`);
                continue;
            }

            const caption = `🌟 A wild Pokémon has appeared!\nType *!catch <name>* to catch it!\n🏞️ Be the fastest trainer!`;

            for (const group of enabledGroups) {
                await sendAndTrack(sock, group.groupId, {
                    image: imageBuffer,
                    caption,
                });

                await activeCol.updateOne(
                    { groupId: group.groupId },
                    {
                        $set: {
                            pokemonId: randomFile,
                            timestamp: new Date(),
                        },
                    },
                    { upsert: true }
                );
            }

            const delayMs = getRandomInt(1 * 60 * 1000, 3 * 60 * 1000); // 1–3 min
            console.log(`⏱️ Waiting ${Math.round(delayMs / 1000)} seconds before next spawn`);
            await delay(delayMs);
        } catch (err) {
            console.error('❌ Pokémon Spawner Error:', err);
            await delay(60 * 1000);
        }
    }
}

module.exports = {
    startPokemonSpawner,
    stopPokemonSpawner,
    isSpawnerRunning: () => isRunning
};
