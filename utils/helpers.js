function getSenderId(msg) {
    return msg.key.fromMe
        ? global.BOT_ID.split(':')[ 0 ] + '@s.whatsapp.net'
        : msg.key.participant || msg.key.remoteJid;
}

function extractMentions(text) {
    const mentionPattern = /@(\d{5,})/g;
    const matches = [ ...text.matchAll(mentionPattern) ];
    return matches.map(match => `${match[ 1 ]}@s.whatsapp.net`);
}

module.exports = { extractMentions, getSenderId };
