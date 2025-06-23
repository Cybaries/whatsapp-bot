module.exports = async (sock, from, input) => {
    const message = `🛠️ *Available Commands:*
!help - Show this message
!weather <city> - Get weather info
!play <song> - Simulate music play`;

    await sock.sendMessage(from, { text: message });
};
