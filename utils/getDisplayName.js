async function getDisplayName(sock, jid, fallbackName = null) {
    if (!jid) return fallbackName || 'Unknown';

    // Try contacts cache
    const contactInfo = sock.contacts?.[ jid ];
    if (contactInfo?.name) return contactInfo.name;
    if (contactInfo?.notify) return contactInfo.notify;

    // Try onWhatsApp if not in cache
    try {
        const result = await sock.onWhatsApp(jid);
        if (result?.[ 0 ]?.notify) return result[ 0 ].notify;
    } catch { }

    // Fallback to number
    return fallbackName || jid.split('@')[ 0 ];
}

module.exports = { getDisplayName };
