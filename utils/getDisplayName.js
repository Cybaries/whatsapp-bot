async function getDisplayName(sock, jid, fallbackName = null) {
    if (!jid) return fallbackName || 'Unknown';

    try {
        // Try Baileys built-in name resolver
        const name = await sock.fetchName(jid);
        if (name) return name;
    } catch (err) {
        console.warn(`⚠️ Failed to fetch name for ${jid}:`, err.message);
    }

    // Fallbacks
    const contactInfo = sock.contacts?.[ jid ];
    if (contactInfo?.name) return contactInfo.name;
    if (contactInfo?.notify) return contactInfo.notify;

    return fallbackName || jid.split('@')[ 0 ];
}

module.exports = { getDisplayName };
