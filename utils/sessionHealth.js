const fs = require('fs');
const path = require('path');

function isSessionHealthy(creds) {
    return creds &&
        typeof creds === 'object' &&
        creds.me?.id &&
        creds.account &&
        creds.registrationId;
}

module.exports = { isSessionHealthy };
