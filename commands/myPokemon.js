const { getDb } = require('../Handlers/mongo');
const { getImageBufferById } = require('../utils/pokemonImageService'); // assumed working
const axios = require('axios');

module.exports = {
    config: {
        command: 'myPokemon',
        aliases: [ 'mypokemon', 'mypkmn' ],
        description: 'View the Pokémon you’ve caught!',
        usage: '!myPokemon',
        category: 'fun',
        dm: false
    },

    handler: async (sock, from, input, msg) => {
        const userId = msg.key.participant || msg.key.remoteJid;
        const db = getDb();
        const pokedexCol = db.collection('pokedex');

        const userData = await pokedexCol.findOne({ groupId: from, caughtBy: userId });

        if (!userData || !Array.isArray(userData.caughtPokemon) || userData.caughtPokemon.length === 0) {
            return {
                text: '😢 You haven’t caught any Pokémon yet!\nUse *!catch <name>* when a wild Pokémon appears.'
            };
        }

        const caughtList = userData.caughtPokemon;
        const count = caughtList.length;
        const randomPokeId = caughtList[ Math.floor(Math.random() * count) ];
        const pokeId = parseInt(randomPokeId.replace('.png', ''), 10);

        try {
            // Fetch Pokémon name from API
            const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokeId}`);
            const pokeName = capitalize(data.name);

            const caption =
                `🎒 You’ve caught *${count} Pokémon*:\n\n` +
                (await Promise.all(caughtList.map(async (id, i) => {
                    const num = parseInt(id.replace('.png', ''), 10);
                    try {
                        const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${num}`);
                        return `${i + 1}. ${capitalize(data.name)}`;
                    } catch {
                        return `${i + 1}. Unknown`;
                    }
                }))).join('\n');

            const imageBuffer = await getImageBufferById(`${randomPokeId}`);
            if (!imageBuffer) throw new Error('Image not found');

            return {
                image: imageBuffer,
                caption
            };
        } catch (err) {
            console.error('⚠️ Failed to fetch image or Pokémon data:', err.message);
            return sock.sendMessage(from, {
                text: '📛 Error fetching your Pokémon data. Please try again later.'
            });
        }
    }
};

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
