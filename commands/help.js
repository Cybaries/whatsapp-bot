const { commandMap, aliasMap } = require('../utils/commandHandler');

module.exports = {
    config: {
        command: 'help',
        description: 'Displays the help menu or shows info about a command or category',
        usage: '!help [command|category]',
        category: 'general',
        aliases: [ 'h' ],
        dm: true
    },

    handler: async (sock, from, input, msg, meta) => {
        const query = input?.trim().toLowerCase();

        if (!query) {
            // Show all commands grouped by category
            const categories = {};
            for (const cmd of commandMap.values()) {
                const cat = cmd.config.category || 'uncategorized';
                if (!categories[ cat ]) categories[ cat ] = [];
                categories[ cat ].push(cmd);
            }

            const emojis = [ '🌀', '🎴', '🔮', '👑', '🎈', '⚙️', '🍀', '📁' ];
            const catNames = Object.keys(categories);
            let text = `🎫 *Help Menu*\n\n📚 *Available Categories:*\n\n`;

            for (let i = 0; i < catNames.length; i++) {
                const key = catNames[ i ];
                const emoji = emojis[ i % emojis.length ];
                const cmds = categories[ key ];
                text += `${emoji} *${capitalize(key)}*\n❐ \`\`\`${cmds.map(c => c.config.command).join(', ')}\`\`\`\n\n`;
            }

            text += `🗃️ *Tip:* Use \`!help <command>\` for more info.`;
            return sock.sendMessage(from, { text });
        }

        // First try finding command
        const cmd = commandMap.get(query) || aliasMap.get(query);
        if (cmd) {
            const { command, description, usage, aliases = [], category, dm } = cmd.config;
            const helpText =
                `🎫 *Command:* ${capitalize(command)}\n` +
                `🎀 *Description:* ${description || 'No description'}\n` +
                `🃏 *Category:* ${capitalize(category || 'uncategorized')}\n` +
                `🧾 *Usage:* \`${usage || 'No usage info'}\`\n` +
                `🍥 *Aliases:* ${aliases.length ? aliases.map(capitalize).join(', ') : 'None'}\n` +
                `📬 *DM Allowed:* ${dm ? 'Yes' : 'No'}`;

            return sock.sendMessage(from, { text: helpText });
        }

        // Check if it's a category
        const matchedCmds = Array.from(commandMap.values()).filter(c =>
            (c.config.category || '').toLowerCase() === query
        );

        if (matchedCmds.length) {
            let text = `📚 *${capitalize(query)} Commands*\n\n`;
            for (const c of matchedCmds) {
                text += `🔹 *${c.config.command}* – ${c.config.description}\n🧾 _Usage:_ \`${c.config.usage}\`\n\n`;
            }
            return sock.sendMessage(from, { text });
        }

        return sock.sendMessage(from, {
            text: `❌ No command or category named "${query}" found.`
        });
    }
};

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
