module.exports = async (sock, from) => {
    const commands = [
        {
            title: '!ping',
            description: 'Tag all users (admin only)',
            syntax: '!ping [optional message]'
        },
        {
            title: '!rank',
            description: 'View user\'s rank',
            syntax: '!rank'
        },
        {
            title: '!leaderboard',
            description: 'View the top 10 interaction leaders in the group',
            syntax: '!leaderboard'
        },
        {
            title: '!promote',
            description: 'Promote a tagged user to admin (admin-only).',
            syntax: '!promte <mention>'
        },
        {
            title: '!demote',
            description: 'Demote a tagged user to admin (admin-only).',
            syntax: '!demote <mention>'
        },
        {
            title: '!weather',
            description: 'Shows current weather for the given city.',
            syntax: '!weather <city>'
        },
        {
            title: '!help',
            description: 'Display this help menu',
            syntax: '!help'
        }
    ];

    const text = `🛠️ *Command Menu*\n\n` + commands.map(cmd =>
        `🔹 *${cmd.title}*\n${cmd.description}\n🧾 _Usage:_ \`${cmd.syntax}\`\n`
    ).join('\n');

    await sock.sendMessage(from, {
        text,
        footer: 'Bot by Cybaries'
    });
};
