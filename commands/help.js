module.exports = async (sock, from) => {
    const commands = [
        {
            title: '!ping',
            description: 'Tag all users or a specific role (admin only)',
            syntax: '!ping [optional message] or !ping <RoleName>'
        },
        {
            title: '!assign',
            description: 'Assign a role to one or more mentioned users (admin-only)',
            syntax: '!assign <RoleName> <@mention1> <@mention2> ...'
        },
        {
            title: '!rank',
            description: 'View your rank and XP in the group',
            syntax: '!rank'
        },
        {
            title: '!leaderboard',
            description: 'View the top 10 most active members in the group',
            syntax: '!leaderboard'
        },
        {
            title: '!promote',
            description: 'Promote a tagged user to admin (admin-only)',
            syntax: '!promote <@mention>'
        },
        {
            title: '!demote',
            description: 'Demote a tagged user from admin (admin-only)',
            syntax: '!demote <@mention>'
        },
        {
            title: '!weather',
            description: 'Shows current weather for the given city',
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
    ).join('\n') + `\n\n🤖 *_Bot by Cybaries_*`;

    await sock.sendMessage(from, {
        text
    });
};
