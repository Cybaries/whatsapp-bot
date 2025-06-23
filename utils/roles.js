const fs = require('fs');
const path = require('path');

const rolesPath = path.join(__dirname, '..', 'data', 'roles.json');

// Load current role data safely
function loadRoles() {
    if (!fs.existsSync(rolesPath)) return {};

    try {
        const content = fs.readFileSync(rolesPath, 'utf-8');
        return content.trim() ? JSON.parse(content) : {};
    } catch (err) {
        console.error('⚠️ Failed to parse roles.json. Returning empty object.');
        return {};
    }
}

// Save updated role data
function saveRoles(data) {
    fs.writeFileSync(rolesPath, JSON.stringify(data, null, 2));
}

// Get role for a user in a group
function getUserRole(groupId, userId) {
    const roles = loadRoles();
    return roles[ groupId ]?.[ userId ] || null;
}

// Assign a role to a user
function assignRole(groupId, userId, role) {
    const roles = loadRoles();

    if (!roles[ groupId ]) roles[ groupId ] = {};

    // Only one role per user
    roles[ groupId ][ userId ] = role;

    saveRoles(roles);
}

// Remove role
function removeRole(groupId, userId) {
    const roles = loadRoles();

    if (roles[ groupId ] && roles[ groupId ][ userId ]) {
        delete roles[ groupId ][ userId ];

        if (Object.keys(roles[ groupId ]).length === 0) {
            delete roles[ groupId ];
        }

        saveRoles(roles);
    }
}

// Get entire group role map
function getGroupRoles(groupId) {
    const roles = loadRoles();
    return roles[ groupId ] || {};
}

module.exports = {
    getUserRole,
    assignRole,
    removeRole,
    getGroupRoles,
    loadRoles
};
