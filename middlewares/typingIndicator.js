module.exports = async (sock, jid, actionFn) => {
    try {
        await sock.sendPresenceUpdate('composing', jid);
        await actionFn();
    } finally {
        await sock.sendPresenceUpdate('paused', jid);
    }
};
