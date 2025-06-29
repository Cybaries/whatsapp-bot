const { sendMessage } = require('@iamrony777/baileys');
const roles = {
    '🧑‍🎓 2nd Year': '2nd year',
    '🧑‍💻 3rd Year': '3rd year',
    '🎓 Final Year': 'final year',
    '🧑‍🏫 Alumni': 'alumni'
};

module.exports = async (sock, from) => {
    const buttons = Object.keys(roles).map(emoji => ({
        buttonId: `role_${roles[ emoji ]}`,
        buttonText: { displayText: `${emoji} ${roles[ emoji ]}` },
        type: 1
    }));

    const response = await sock.sendMessage(from, {
        text: '👥 *Select your role*\nChoose from the options below:',
        buttons,
        footer: 'Only one role can be active at a time',
        headerType: 1
    });

    // Track the message ID and map to roles (for reactionhandler.js to use)
    global.rolePromptMessageId = response.key.id;
    global.roleMap = roles;
};
