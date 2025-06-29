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
