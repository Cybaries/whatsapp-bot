function calculateXP(msg) {
    let xp = 10; // base XP

    const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        '';

    if (text.length > 100) xp += 5;
    if (text.length > 250) xp += 10;

    const isReply = !!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (isReply) xp += 5;

    const hasMedia =
        msg.message?.imageMessage ||
        msg.message?.videoMessage ||
        msg.message?.audioMessage ||
        msg.message?.documentMessage;
    if (hasMedia) xp += 5;

    return xp;
}
