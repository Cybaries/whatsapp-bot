const { getDb } = require('../Handlers/mongo');
const axios = require('axios');

module.exports = {
    config: {
        command: 'catch',
        aliases: [],
        description: 'Catch the currently active Pokémon',
        usage: '!catch <pokemon name>',
        category: 'fun',
        dm: false
    },

    handler: async (sock, from, input, msg) => {
        const db = getDb();
        const activeCol = db.collection('pokemon_active');
        const pokedexCol = db.collection('pokedex');

        const sender = msg.key.participant || msg.key.remoteJid;
        const args = input.trim().split(/\s+/);
        const guessedName = args.join(' ').toLowerCase().replace(/\s+/g, ' ').trim();

        if (!guessedName) {
            return { text: '❓ Usage: !catch <pokemon name>' };
        }

        const active = await activeCol.findOne({ groupId: from });
        if (!active) {
            return { text: '❌ No active Pokémon to catch right now!' };
        }

        const idRaw = active.pokemonId.replace('.png', '');
        const id = parseInt(idRaw, 10);

        try {
            const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
            const officialName = data.name.toLowerCase().replace(/-/g, ' ').trim();

            if (officialName !== guessedName) {
                return { text: `❌ Wrong! It's not "${guessedName}". Try again!` };
            }

            // Only first correct guess wins
            const alreadyCaughtByAnyone = await pokedexCol.findOne({
                groupId: from,
                caughtPokemon: active.pokemonId
            });

            if (alreadyCaughtByAnyone) {
                return {
                    text: `⏱️ Too late! Someone already caught this Pokémon.`
                };
            }

            // Update or create user's Pokédex entry
            await pokedexCol.updateOne(
                { groupId: from, caughtBy: sender },
                {
                    $addToSet: { caughtPokemon: active.pokemonId },
                    $setOnInsert: { createdAt: new Date() }
                },
                { upsert: true }
            );

            return {
                text: `🎉 @${sender.split('@')[ 0 ]} caught *${officialName.toUpperCase()}*! Gotta catch 'em all!`,
                mentions: [ sender ]
            };

        } catch (err) {
            console.error('❌ Error in !catch:', err);
            return { text: '❌ Failed to validate Pokémon. Try again.' };
        }
    }
};
