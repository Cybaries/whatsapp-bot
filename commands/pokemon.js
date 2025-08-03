const { getDb } = require('../Handlers/mongo');
const { startPokemonSpawner, stopPokemonSpawner, isSpawnerRunning } = require('../utils/pokemonSpawner');

module.exports = {
    config: {
        command: 'pokemon',
        aliases: [],
        description: 'Enable or disable Pokémon game in group',
        usage: '!pokemon enable/disable',
        category: 'fun',
        dm: false
    },

    handler: async (sock, from, input, msg) => {
        try {
            const db = getDb();
            const settingsCol = db.collection('pokemon_settings');
            const args = input.trim().split(/\s+/);
            const subcommand = args[ 0 ];

            if (!msg?.key?.participant?.endsWith('@s.whatsapp.net')) return;

            if (subcommand === 'enable') {
                await settingsCol.updateOne(
                    { groupId: from },
                    { $set: { enabled: true } },
                    { upsert: true }
                );

                const enabledCount = await settingsCol.countDocuments({ enabled: true });

                if (!isSpawnerRunning() && enabledCount > 0) {
                    startPokemonSpawner(sock); // Don't await
                }

                return { text: '✅ Pokémon game enabled!' }
            }

            else if (subcommand === 'disable') {
                await settingsCol.updateOne(
                    { groupId: from },
                    { $set: { enabled: false } }
                );

                const enabledCount = await settingsCol.countDocuments({ enabled: true });

                if (enabledCount === 0) {
                    stopPokemonSpawner();
                }

                return { text: '❎ Pokémon game disabled.' };
            }

            else {
                return {
                    text: '❓ Usage: !pokemon enable OR !pokemon disable'
                };
            }
        } catch (err) {
            console.error('❌ Error in !pokemon command:', err);
            return {
                text: '❌ An error occurred while processing the command.'
            };
        }
    }
};
