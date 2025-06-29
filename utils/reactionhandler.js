const { updateRoleInDB } = require('./roleManager'); // Assuming you have DB role mgmt

module.exports = async (sock, reaction) => {
    const { key, reaction: emoji } = reaction;
    const msgId = key.id;
    const user = key.participant;

    if (msgId !== global.rolePromptMessageId) return;

    const matchedRole = Object.keys(global.roleMap).find(label => label.startsWith(emoji));
    if (!matchedRole) return;

    const role = global.roleMap[ matchedRole ];
    await updateRoleInDB(user, key.remoteJid, role);

    await sock.sendMessage(key.remoteJid, {
        text: `✅ *${user.split('@')[ 0 ]}* has been assigned the role: *${role}*`
    });
};
