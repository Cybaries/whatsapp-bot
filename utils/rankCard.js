const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const path = require('path');

registerFont(path.join(__dirname, 'fonts', 'royalfleur-regular.ttf'), { family: 'Roboto' });

async function createRankCard({ name, profilePicUrl }) {
    const width = 800;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    // Draw profile picture
    try {
        const { data: buffer } = await axios.get(profilePicUrl, { responseType: 'arraybuffer' });
        const pfp = await loadImage(buffer);
        ctx.drawImage(pfp, 40, 40, 220, 220);
    } catch {
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(150, 150, 110, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Roboto';
    ctx.fillText(name, 280, 160);

    return canvas.toBuffer('image/png');
}

module.exports = { createRankCard };
