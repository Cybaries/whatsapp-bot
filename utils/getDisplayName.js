async function getDisplayName(sock, jid, fallbackName = null) {
    if (!jid) return fallbackName || 'Unknown';

    try {
        // 1. Try Baileys built-in name resolver
        const name = await sock.fetchName(jid);
        if (name) return name;
    } catch (err) {
        console.warn(`⚠️ Failed to fetch name for ${jid}:`, err.message);
    }

    // 2. Try from contacts object
    const contactInfo = sock.contacts?.[ jid ];
    if (contactInfo?.name) return contactInfo.name;
    if (contactInfo?.notify) return contactInfo.notify;

    // 3. Format as @user if nothing else is found
    const user = jid.split('@')[ 0 ];
    return `@${user}` || fallbackName || 'Unknown';
}

module.exports = { getDisplayName };
