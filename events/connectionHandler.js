const makeWASocket = require('@iamrony777/baileys').default;

let reconnectTimeout = null;

module.exports = (sock, setQR, restart) => {
    sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect, isNewLogin }) => {
        if (qr) {
            setQR(qr);
            console.log(`📸 Scan QR at: http://localhost:${process.env.QR_PORT || 3000}`);
        }

        if (connection === 'open') {
            console.log('✅ Connection opened!');
            global.isReady = false;
            setTimeout(() => {
                global.isReady = true;
                console.log('✅ Bot is ready.');
            }, 5000);
        }

        if (connection === 'close') {
            console.warn('❌ Disconnected:', lastDisconnect?.error?.message || lastDisconnect?.error);

            const shouldReconnect =
                !lastDisconnect?.error?.output?.statusCode || // Network drops
                lastDisconnect?.error?.output?.statusCode !== 401; // Invalid creds

            if (shouldReconnect) {
                console.log('♻️ Reconnecting in 5s...');
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(restart, 5000);
            } else {
                console.log('🛑 Session invalid. Manual QR scan required.');
            }
        }
    });
};
