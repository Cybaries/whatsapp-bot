const { getMessageStats } = require('../utils/messageCounter');
const { createRankCard } = require('../utils/rankCard');
const { getDisplayName } = require('../utils/getDisplayName');
const { getRank } = require('../utils/rankUtils');


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
        targetId = msg.key.participant;
        if (!targetId || targetId.endsWith('@g.us')) {
            // fallback to msg.sender in case participant missing or group ID leaked
            targetId = msg.sender || msg.key.remoteJid;
        }
    }

    // Get display name
    const isSelf = targetId === (msg.key.participant || msg.key.remoteJid);
    const displayName = await getDisplayName(sock, targetId, isSelf ? msg.pushName : null);

    const stats = await getMessageStats(from, targetId);
    const xp = stats?.xp || 0;
    const messageCount = stats?.messageCount || 0;

    const rank = getRank(xp);


    // Profile picture
    let profilePicUrl = 'https://i.imgur.com/oJZ9qVf.png';
    try {
        profilePicUrl = await sock.profilePictureUrl(targetId, 'image');
    } catch { }

    const imageBuffer = await createRankCard({ name: displayName, profilePicUrl });

    const caption = `🌟 *${displayName}'s Rank Card*\n\n🏅 Rank: ${rank.emoji} *${rank.title}*\n📊 XP: *${xp}* • Messages: *${messageCount}*`;


    await sock.sendMessage(from, {
        image: imageBuffer,
        caption,
        mentions: [ targetId ],
    }, { quoted: msg });
};
