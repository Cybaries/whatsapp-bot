const mongo = require('./mongo');

const COLLECTION_NAME = process.env.ROLE_COLLECTION || 'roles';

async function updateRoleInDB(user, group, newRole) {
    const db = mongo.getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Remove existing role for user in group
    await collection.deleteMany({ user, group });

    // Insert new role
    await collection.insertOne({
        user,
        group,
        role: newRole,
        emoji: Object.keys(global.roleMap).find(k => global.roleMap[ k ] === newRole) || '🎭',
        updatedAt: new Date()
    });
}

async function getUserRole(user, group) {
    const db = mongo.getDb();
    const collection = db.collection(COLLECTION_NAME);
    return await collection.findOne({ user, group });
}

module.exports = { updateRoleInDB, getUserRole };
