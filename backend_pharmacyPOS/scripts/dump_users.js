const db = require('../db');

async function dumpUsers() {
    try {
        const [users] = await db.query('DESCRIBE users');
        console.log('=== users ===');
        console.table(users);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

dumpUsers();
