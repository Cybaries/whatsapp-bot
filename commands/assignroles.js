const fs = require('fs');
const path = require('path');

// Emoji → Role mapping
const emojiRoleMap = {
  '2️⃣': '2nd year',
  '3️⃣': '3rd year',
  '4️⃣': 'final year',
  '🎓': 'alumni'
};

const roleMessageMapPath = path.join(__dirname, '..', 'data', 'roleMessageMap.json');

function saveRoleMessageId(groupId, messageId) {
  let map = {};

  try {
    if (fs.existsSync(roleMessageMapPath)) {
      const content = fs.readFileSync(roleMessageMapPath, 'utf-8');
      map = content.trim() ? JSON.parse(content) : {};
    }
  } catch (err) {
    console.warn('⚠️ Failed to read/parse roleMessageMap.json. Using empty map.');
    map = {};
  }

  map[ groupId ] = messageId;
  fs.writeFileSync(roleMessageMapPath, JSON.stringify(map, null, 2));
}

module.exports = async (sock, from, _, msg) => {
  if (!from.endsWith('@g.us')) {
    return sock.sendMessage(from, {
      text: '❌ This command can only be used in group chats.'
    });
  }

  const messageText =
    `📌 React to this message to get your role:\n\n` +
    Object.entries(emojiRoleMap)
      .map(([ emoji, role ]) => `${emoji} - ${role}`)
      .join('\n') +
    `\n\n🔁 React again with a new emoji to change your role.\n❌ Removing your reaction removes your role.`;

  const sentMsg = await sock.sendMessage(from, { text: messageText });

  // Save the message ID for this group
  saveRoleMessageId(from, sentMsg.key.id);

  await sock.sendMessage(from, {
    text: '✅ Role assignment message sent. React to it to choose your role.',
    quoted: sentMsg
  });

  console.log(`✅ Role message sent in group ${from} with ID ${sentMsg.key.id}`);
};
