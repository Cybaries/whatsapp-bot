module.exports = async (sock, from) => {
    const helpMessage = `
🛠️ *Bot Commands Available:*

1. *!animequote*  
 • Random anime quote (5/hour)  
 • \`!animequote <anime name>\`  
 • \`!animequote character <character name>\`

2. *!ping*  
 • Tags everyone in a role. Restricted to group admins.

3. *!weather <city>*  
 • Shows current weather for the given city.

4. *!help*  
 • Shows this help message.
`;

    await sock.sendMessage(from, { text: helpMessage });
};

module.exports = async (sock, from) => {
    const commands = [
        {
            title: '!ping',
            description: 'Tag all users (admin only)',
            syntax: '!ping [optional message]'
        },
        {
            title: '!roles',
            description: 'Pick a role via emoji',
            syntax: '!roles'
        },
        {
            title: '!stats',
            description: 'View usage stats',
            syntax: '!stats'
        },
        {
            title: '!help',
            description: 'Display this help menu',
            syntax: '!help'
        }
    ];

    const text = `📖 *Command Menu*\n\n` + commands.map(cmd =>
        `🔹 *${cmd.title}*\n${cmd.description}\n🧾 _Usage:_ \`${cmd.syntax}\`\n`
    ).join('\n');

    await sock.sendMessage(from, {
        text,
        footer: 'Bot by Cybaries'
    });
};
