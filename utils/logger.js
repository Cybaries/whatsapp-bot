const fs = require('fs');
const path = require('path');

function logMessage({ from, isGroup, command, input }) {
    const logPath = path.join(__dirname, '../logs/messages.log');
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const type = isGroup ? 'group' : 'private';

    const logEntry = `[${timestamp}] from=${from} (${type})\ncommand=${command} | input=${input || '(none)'}\n\n`;

    fs.appendFileSync(logPath, logEntry);
}

module.exports = { logMessage };
