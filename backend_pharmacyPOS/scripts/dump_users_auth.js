const db = require('../db');

async function dumpUsersAuth() {
    try {
        const [users] = await db.query('DESCRIBE users_auth');
        console.log('=== users_auth ===');
        console.table(users);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

dumpUsersAuth();
