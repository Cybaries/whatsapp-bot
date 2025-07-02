const ranks = [
    { tier: 0, title: '🐣 Hatchling of the Realm', emoji: '🐣', minXP: 0, maxXP: 199, bg: 'hatchling.jpg' },
    { tier: 1, title: '🌱 Whispering Herald', emoji: '🌱', minXP: 200, maxXP: 499, bg: 'herald.jpg' },
    { tier: 2, title: '🛡️ Squire of Echoes', emoji: '🛡️', minXP: 500, maxXP: 999, bg: 'squire.jpg' },
    { tier: 3, title: '⚔️ Knight of Dawnfire', emoji: '⚔️', minXP: 1000, maxXP: 1999, bg: 'knight.jpg' },
    { tier: 4, title: '🦅 Skyborne Champion', emoji: '🦅', minXP: 2000, maxXP: 3499, bg: 'champion.jpg' },
    { tier: 5, title: '🐉 Dragon’s Vanguard', emoji: '🐉', minXP: 3500, maxXP: 5499, bg: 'vanguard.jpg' },
    { tier: 6, title: '🔥 Phoenix Ascendant', emoji: '🔥', minXP: 5500, maxXP: 7999, bg: 'phoenix.jpg' },
    { tier: 7, title: '💫 Arcane Luminary', emoji: '💫', minXP: 8000, maxXP: 10999, bg: 'luminary.jpg' },
    { tier: 8, title: '🪄 Mystic Warden', emoji: '🪄', minXP: 11000, maxXP: 14999, bg: 'warden.jpg' },
    { tier: 9, title: '🌌 Cosmic Arbiter', emoji: '🌌', minXP: 15000, maxXP: 19999, bg: 'arbiter.jpg' },
    { tier: 10, title: '👑 Royal Paragon', emoji: '👑', minXP: 20000, maxXP: 49999, bg: 'paragon.jpg' },
    { tier: 11, title: '🌠 Celestial Sovereign', emoji: '🌠', minXP: 50000, maxXP: Infinity, bg: 'celestial.jpg' }
];


function getRank(xp = 0) {
    return ranks.slice().reverse().find(rank => xp >= rank.minXP);
}

function getAllRanks() {
    return ranks;
}

module.exports = { getRank, getAllRanks };


