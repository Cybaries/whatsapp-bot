const totalRequests = { count: 0 };
const userCounts = new Map();

module.exports = {
    incrementTotal: () => totalRequests.count++,
    incrementUser: (user) => {
        userCounts.set(user, (userCounts.get(user) || 0) + 1);
    },
    getUserCount: (user) => userCounts.get(user) || 0,
    getTotal: () => totalRequests.count,
};
