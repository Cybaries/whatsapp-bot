function getRank(xp = 0) {
    if (xp >= 50000) return { title: '👑 Celestial Sovereign', emoji: '👑', tier: 11, bg: 'celestial.jpg' };
    if (xp >= 30000) return { title: '🔥 Phoenix King', emoji: '🔥', tier: 10, bg: 'phoenix.jpg' };
    if (xp >= 20000) return { title: '🌀 Storm Regent', emoji: '🌀', tier: 9, bg: 'storm.jpg' };
    if (xp >= 12000) return { title: '🌌 Void Commander', emoji: '🌌', tier: 8, bg: 'void.jpg' };
    if (xp >= 8000) return { title: '🛡️ Arcane Archduke', emoji: '🛡️', tier: 7, bg: 'archduke.jpg' };
    if (xp >= 5000) return { title: '🔥 Eternal Champion', emoji: '🔥', tier: 6, bg: 'champion.jpg' };
    if (xp >= 3000) return { title: '🐉 Dragon Knight', emoji: '🐉', tier: 5, bg: 'knight.jpg' };
    if (xp >= 1500) return { title: '🦅 Skybound Baron', emoji: '🦅', tier: 4, bg: 'baron.jpg' };
    if (xp >= 800) return { title: '⚔️ Duelist Squire', emoji: '⚔️', tier: 3, bg: 'squire.jpg' };
    if (xp >= 400) return { title: '🐤 Loudmouth Page', emoji: '🐤', tier: 2, bg: 'page.jpg' };
    if (xp >= 200) return { title: '🌱 Whispering Herald', emoji: '🌱', tier: 1, bg: 'herald.jpg' };
    return { title: '🐣 Hatchling of the Realm', emoji: '🐣', tier: 0, bg: 'hatchling.jpg' };
}

module.exports = { getRank };



module.exports = { getRank };
