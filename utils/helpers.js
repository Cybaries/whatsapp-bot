function getSenderId(msg) {
    return msg.key.fromMe
        ? global.BOT_ID.split(':')[ 0 ] + '@s.whatsapp.net'
        : msg.key.participant || msg.key.remoteJid;
}

module.exports = { getSenderId };
