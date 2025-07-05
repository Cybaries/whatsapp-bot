require('dotenv').config();
const express = require('express');
const path = require('path');
const qrcode = require('qrcode');
const { getLatestQR } = require('./utils/connection');
const { logger } = require('./utils/logger');
const { startBot } = require('./startBot'); // 👈 import it here

let fetch;
(async () => { fetch = (await import('node-fetch')).default; })();

const app = express();
const PORT = process.env.QR_PORT || 3000;

app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'views/qr.html')));
app.get('/qr', async (_, res) => {
    const qr = getLatestQR();
    if (!qr) return res.json({ image: null });
    res.json({ image: await qrcode.toDataURL(qr) });
});
app.listen(PORT, () => logger.info(`🧿 QR viewer: http://localhost:${PORT}`));

// 🔁 Start bot
startBot();

// 🌐 Keep-alive
setInterval(async () => {
    try {
        const res = await fetch(process.env.PING_URL);
        logger.info(`📡 Self-ping successful: ${res.status}`);
    } catch (e) {
        logger.error('Ping failed:', e);
    }
}, 8 * 60 * 1000);
