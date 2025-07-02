const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { getAllRanks } = require('./rankUtils');
const backgroundsDir = path.join(__dirname, 'backgrounds');
const fallbackBgPath = path.join(backgroundsDir, 'default.jpg');
const rankBgPath = path.join(backgroundsDir, rank.bg || '')

registerFont(path.join(__dirname, 'fonts', 'royalfleur-regular.ttf'), { family: 'Roboto' });

async function createRankCard({ name, profilePicUrl, rank, xp }) {
    const width = 800;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    let backgroundLoaded = false;

    try {
        if (fs.existsSync(rankBgPath)) {
            const bgImage = await loadImage(rankBgPath);
            ctx.drawImage(bgImage, 0, 0, width, height);
            backgroundLoaded = true;
        } else if (fs.existsSync(fallbackBgPath)) {
            const fallbackImage = await loadImage(fallbackBgPath);
            ctx.drawImage(fallbackImage, 0, 0, width, height);
            backgroundLoaded = true;
        }
    } catch (e) {
        console.warn('⚠️ Failed to load background:', e.message);
    }

    if (!backgroundLoaded) {
        // ✨ Gradient fallback (purple to black)
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#2e0854'); // dark violet
        gradient.addColorStop(1, '#000000'); // black
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    // === Profile Picture ===
    try {
        const { data: buffer } = await axios.get(profilePicUrl, { responseType: 'arraybuffer' });
        const pfp = await loadImage(buffer);
        ctx.save();
        ctx.beginPath();
        ctx.arc(150, 150, 110, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(pfp, 40, 40, 220, 220);
        ctx.restore();
    } catch {
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(150, 150, 110, 0, 2 * Math.PI);
        ctx.fill();
    }

    // === Name ===
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Roboto';
    ctx.fillText(name, 280, 80);

    // === Rank Title ===
    ctx.fillStyle = '#ffe600';
    ctx.font = '30px Roboto';
    ctx.fillText(`${rank.emoji} ${rank.title}`, 280, 130);

    // === XP Progress Bar ===
    const ranks = getAllRanks();
    const currentTier = ranks[ rank.tier ];
    const nextTier = ranks[ rank.tier + 1 ] || { minXP: currentTier.minXP + 1000 };

    const currentXP = xp;
    const minXP = currentTier.minXP;
    const maxXP = nextTier.minXP;
    const progress = Math.max(0, Math.min((currentXP - minXP) / (maxXP - minXP), 1));

    const barX = 280;
    const barY = 180;
    const barWidth = 480;
    const barHeight = 25;

    ctx.fillStyle = '#444';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = '#00ff99';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    ctx.strokeStyle = '#000';
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Roboto';
    ctx.fillText(`${currentXP} / ${maxXP} XP`, barX + barWidth / 2 - 60, barY + 45);

    return canvas.toBuffer('image/png');
}

module.exports = { createRankCard };
