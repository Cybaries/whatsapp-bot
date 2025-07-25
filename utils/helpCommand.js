module.exports = {
    general: [
        {
            title: '!ping',
            description: 'Tag all users or a specific role (admin only)',
            syntax: '!ping [optional message] or !ping <RoleName>'
        },
        {
            title: '!weather',
            description: 'Show current weather for a city',
            syntax: '!weather <city>'
        },
        {
            title: '!help',
            description: 'Display the help menu',
            syntax: '!help [category]'
        }
    ],
    admin: [
        {
            title: '!assign',
            description: 'Assign a role to mentioned users (admin only)',
            syntax: '!assign <RoleName> <@mention1> <@mention2> ...'
        },
        {
            title: '!listRole',
            description: 'List all roles or users in a specific role',
            syntax: '!listRole [optional <RoleName>]'
        },
        {
            title: '!promote',
            description: 'Promote a tagged user to admin (admin only)',
            syntax: '!promote <@mention>'
        },
        {
            title: '!demote',
            description: 'Demote a tagged user from admin (admin only)',
            syntax: '!demote <@mention>'
        }
    ],
    stats: [
        {
            title: '!rank',
            description: 'View your XP and rank in the group',
            syntax: '!rank'
        },
        {
            title: '!leaderboard',
            description: 'Show top 10 active members in the group',
            syntax: '!leaderboard'
        }
    ]
};
