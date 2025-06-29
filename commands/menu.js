module.exports = async (sock, from) => {
    await sock.sendMessage(from, {
        text: "What do you want to do?",
        buttons: [
            { buttonId: "!ping", buttonText: { displayText: "Ping All" }, type: 1 },
            { buttonId: "!help", buttonText: { displayText: "Help" }, type: 1 }
        ],
        footer: "🤖 Cybaries Bot",
        headerType: 1
    });
};