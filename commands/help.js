module.exports = async (sock, from) => {
    const helpMessage = `
🛠️ *Bot Commands Available:*

1. *!animequote*  
 • Random anime quote (5/hour)  
 • \`!animequote <anime name>\`  
 • \`!animequote character <character name>\`

2. *!assignroles*  (Under Development)
 • Sets up role assignment message using emoji reactions.

3. *!myrole*  (Under Development)
 • Shows your assigned role in the group.

4. *!ping*  
 • Tags everyone in a role. Restricted to group admins.

5. *!weather <city>*  
 • Shows current weather for the given city.

6. *!help*  
 • Shows this help message.
`;

    await sock.sendMessage(from, { text: helpMessage });
};
