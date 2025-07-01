const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const path = require('path');

// Optional: Register a nicer font
registerFont(path.join(__dirname, 'fonts', 'royalfleur-regular.ttf'), { family: 'Roboto' });

async function createRankCard({ name, profilePicUrl, messageCount, rank }) {
    const width = 800;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Load and draw profile picture
    try {
        const { data: buffer } = await axios.get(profilePicUrl, { responseType: 'arraybuffer' });
        const pfp = await loadImage(buffer);
        ctx.drawImage(pfp, 40, 40, 220, 220);
    } catch {
        // fallback circle if no pfp
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(150, 150, 110, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Roboto';
    ctx.fillText(name, 280, 80);

    // Rank
    ctx.font = '28px Roboto';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`${rank.emoji} ${rank.title}`, 280, 140);

    // Message Count
    ctx.font = '24px Roboto';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`Messages Sent: ${messageCount}`, 280, 200);

    return canvas.toBuffer('image/png');
}

module.exports = { createRankCard };
