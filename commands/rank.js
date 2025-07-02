const { getMessageStats } = require('../utils/messageCounter');
const { createRankCard } = require('../utils/rankCard');

function getRank(messageCount = 0) {
    if (messageCount >= 1000) return { title: '👑🌌 Celestial Paragon', emoji: '👑🌌' };
    if (messageCount >= 500) return { title: '🔥🕊️ Eternal Phoenix', emoji: '🔥🕊️' };
    if (messageCount >= 250) return { title: '🐲 Stormborne Vanguard', emoji: '🐲' };
    if (messageCount >= 120) return { title: '🦅 Windswept Ascendant', emoji: '🦅' };
    if (messageCount >= 50) return { title: '🐤 Chatter Adept', emoji: '🐤' };
    if (messageCount >= 20) return { title: '🐛 Burgeoning Whisperer', emoji: '🐛' };
    return { title: '🐣 Novice Hatchling', emoji: '🐣' };
}

module.exports = async (sock, from, input, msg) => {
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(from, { text: '❌ This command only works in groups.' });
        return;
    }

    // STEP 1: Try to get mentioned user
    let targetId;
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

    if (contextInfo?.mentionedJid?.length > 0) {
        // Case: !rank @someone
        targetId = contextInfo?.mentionedJid?.[ 0 ];
    } else if (contextInfo?.participant && contextInfo?.quotedMessage) {
        // Case: !rank used while replying to someone
        targetId = contextInfo.participant;
    } else {
        // Case: !rank (self)
        targetId = msg.key.participant || msg.key.remoteJid;
    }

    // Get display name
    let displayName = targetId.split('@')[ 0 ]; // fallback

    if (targetId === (msg.key.participant || msg.key.remoteJid)) {
        // Self (caller)
        displayName = msg.pushName || displayName;
    } else {
        // Someone else
        console.log(msg.key);
        const contactInfo = sock.contacts?.[ targetId ];
        if (contactInfo?.name) displayName = contactInfo.name;
        else if (contactInfo?.notify) displayName = contactInfo.notify;
    }

    const stats = await getMessageStats(from, targetId);
    const messageCount = stats?.messageCount || 0;
    const rank = getRank(messageCount);

    // Profile picture
    let profilePicUrl = 'https://i.imgur.com/oJZ9qVf.png';
    try {
        profilePicUrl = await sock.profilePictureUrl(targetId, 'image');
    } catch { }

    const imageBuffer = await createRankCard({ name: displayName, profilePicUrl });

    const caption = `🌟 *${displayName}'s Rank Card*\n\n🏅 Rank: ${rank.emoji} *${rank.title}*\n📊 Messages Sent: *${messageCount}*`;

    await sock.sendMessage(from, {
        image: imageBuffer,
        caption,
        mentions: [ targetId ],
    }, { quoted: msg });
};
