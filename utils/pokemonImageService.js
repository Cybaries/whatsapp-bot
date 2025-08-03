const path = require('path');
const fs = require('fs');

// Adjust this absolute path based on your system
const POKEMON_DIR = path.join(require('os').homedir(), 'Downloads', 'Pokemon');

function getImageBufferById(filename) {
    return new Promise((resolve, reject) => {
        const imagePath = path.join(POKEMON_DIR, filename);

        fs.readFile(imagePath, (err, data) => {
            if (err) {
                return reject(new Error(`Image "${filename}" not found at ${imagePath}`));
            }
            resolve(data);
        });
    });
}

module.exports = { getImageBufferById };
