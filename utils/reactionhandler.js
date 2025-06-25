const fs = require('fs');
const path = require('path');
const { assignRole, removeRole, getUserRole } = require('./roles');

const roleMessageMapPath = path.join(__dirname, 'data', 'roleMessageMap.json');

const emojiRoleMap = {
    '2️⃣': '2nd year',
    '3️⃣': '3rd year',
    '4️⃣': 'final year',
    '🎓': 'alumni'
};

function loadRoleMessageMap() {
    if (!fs.existsSync(roleMessageMapPath)) return {};
    try {
        const content = fs.readFileSync(roleMessageMapPath, 'utf-8');
        return content.trim() ? JSON.parse(content) : {};
    } catch (err) {
        console.warn('⚠️ Failed to parse roleMessageMap.json. Using empty map.');
        return {};
    }
}

async function handleReaction(sock, reaction) {
    const { key, sender, reaction: emoji, remove } = reaction;
    const { remoteJid: groupId, id: messageId } = key;

    if (!groupId.endsWith('@g.us')) return;

    const roleMessages = loadRoleMessageMap();
    const expectedMessageId = roleMessages[ groupId ];

    console.log(`📩 Reaction in ${groupId} by ${sender} | Emoji: ${emoji} | Msg ID: ${messageId} | Expected: ${expectedMessageId} | Remove: ${remove}`);

    if (!expectedMessageId || expectedMessageId !== messageId) return;
    if (!emojiRoleMap.hasOwnProperty(emoji)) return;

    const role = emojiRoleMap[ emoji ];

    if (remove) {
        removeRole(groupId, sender);
        console.log(`❌ Removed role from ${sender} in ${groupId}`);
        await sock.sendMessage(groupId, {
            text: `❌ @${sender.split('@')[ 0 ]} removed from role: *${role}*`,
            mentions: [ sender ]
        });
    } else {
        const currentRole = getUserRole(groupId, sender);
        assignRole(groupId, sender, role);
        console.log(`✅ Assigned role "${role}" to ${sender} in ${groupId}`);

        const msg = currentRole
            ? `🔁 @${sender.split('@')[ 0 ]}'s role changed from *${currentRole}* to *${role}*`
            : `✅ @${sender.split('@')[ 0 ]} assigned role: *${role}*`;

        await sock.sendMessage(groupId, {
            text: msg,
            mentions: [ sender ]
        });
    }
}

module.exports = handleReaction;
