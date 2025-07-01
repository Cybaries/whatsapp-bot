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

    const senderId = msg.key.participant || msg.key.remoteJid;
    const name = msg.pushName || 'User';

    const stats = await getMessageStats(from, senderId);
    const messageCount = stats?.messageCount || 0;
    const rank = getRank(messageCount);

    let profilePicUrl = 'https://i.imgur.com/oJZ9qVf.png'; // fallback
    try {
        profilePicUrl = await sock.profilePictureUrl(senderId, 'image');
    } catch { }

    const imageBuffer = await createRankCard({ name, profilePicUrl });

    const caption = `🌟 *${name}'s Rank Card*\n\n🏅 Rank: ${rank.emoji} *${rank.title}*\n📊 Messages Sent: *${messageCount}*`;

    await sock.sendMessage(from, {
        image: imageBuffer,
        caption
    }, { quoted: msg });
};
