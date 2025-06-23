const fs = require('fs');
const path = require('path');
const { assignRole, removeRole, getUserRole } = require('./roles');

const roleMessageMapPath = path.join(__dirname, 'data', 'roleMessageMap.json');

// Emoji to role mapping
const emojiRoleMap = {
    '2️⃣': '2nd year',
    '3️⃣': '3rd year',
    '4️⃣': 'final year',
    '🎓': 'alumni'
};

function loadRoleMessageMap() {
    if (!fs.existsSync(roleMessageMapPath)) return {};
    return JSON.parse(fs.readFileSync(roleMessageMapPath));
}

/**
 * Main reaction handler
 * @param {object} sock - Baileys socket
 * @param {object} reaction - The reaction object
 */
async function handleReaction(sock, reaction) {
    const { key, sender, reaction: emoji, remove } = reaction;
    const { remoteJid: groupId, id: messageId } = key;

    // Not a group or not a tracked message
    if (!groupId.endsWith('@g.us')) return;

    const roleMessages = loadRoleMessageMap();
    if (roleMessages[ groupId ] !== messageId) return;

    // Not a role emoji
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

        let msg = currentRole
            ? `🔁 @${sender.split('@')[ 0 ]}'s role changed from *${currentRole}* to *${role}*`
            : `✅ @${sender.split('@')[ 0 ]} assigned role: *${role}*`;

        await sock.sendMessage(groupId, {
            text: msg,
            mentions: [ sender ]
        });
    }
}

module.exports = handleReaction;
