// utils/getDisplayName.js

async function getDisplayName(sock, jid, fallbackName = null) {
    if (!jid) return fallbackName || 'Unknown';

    try {
        // 1. Try from contacts object
        const contact = sock.contacts?.[ jid ];
        if (contact?.name) return contact.name;
        if (contact?.notify) return contact.notify;

        // 2. If user is in a group, fetch name from group participants
        const userJid = jid;
        if (userJid && userJid.includes('@s.whatsapp.net')) {
            const groups = await sock.groupFetchAllParticipating();
            for (const group of Object.values(groups)) {
                const participant = group?.participants?.find(p => p.id === userJid);
                if (participant?.name) return participant.name;
            }
        }

    } catch (err) {
        console.warn(`⚠️ Failed to fetch name for ${jid}:`, err.message);
    }

    // 3. Fallback: @number
    const user = jid.split('@')[ 0 ];
    return `@${user}` || fallbackName || 'Unknown';
}

module.exports = { getDisplayName };
