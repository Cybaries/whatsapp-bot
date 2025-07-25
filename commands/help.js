const groupedCommands = require('../utils/helpCommand');

module.exports = async (sock, from, input = '', msg) => {
    const category = input.trim().toLowerCase(); // "general", "admin", etc.

    if (!category || !groupedCommands[ category ]) {
        // Show the main help menu
        const helpText = `🛠️ *Help Menu*\n\nType one of the following commands to get help:\n\n` +
            `📋 *!help general* – _General commands_\n` +
            `⚙️ *!help admin* – _Admin-only commands_\n` +
            `📊 *!help stats* – _XP and ranking commands_\n\n` +
            `🤖 Bot by Cybaries`;

        return await sock.sendMessage(from, { text: helpText });
    }

    // Show help for the specified category
    const section = groupedCommands[ category ];
    const helpDetails = `📚 *${capitalize(category)} Commands*\n\n` +
        section.map(cmd =>
            `🔹 *${cmd.title}*\n${cmd.description}\n🧾 _Usage:_ \`${cmd.syntax}\`\n`
        ).join('\n');

    await sock.sendMessage(from, { text: helpDetails });
};

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
