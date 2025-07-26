const fs = require('fs');
const path = require('path');

const commandMap = new Map();
const aliasMap = new Map();

function loadCommands(commandsDir) {
    const files = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

    for (const file of files) {
        const filePath = path.join(commandsDir, file);
        const commandModule = require(filePath);

        if (!commandModule?.config?.command || typeof commandModule.handler !== 'function') {
            console.warn(`❌ Invalid command file skipped: ${file}`);
            continue;
        }

        const { command, aliases = [] } = commandModule.config;

        commandMap.set(command.toLowerCase(), commandModule);
        aliases.forEach(alias => aliasMap.set(alias.toLowerCase(), commandModule));
    }

    console.log(`✅ Loaded ${commandMap.size} commands.`);
}

function getCommand(name) {
    const key = name.toLowerCase();
    return commandMap.get(key) || aliasMap.get(key);
}

module.exports = {
    loadCommands,
    getCommand,
    commandMap
};
