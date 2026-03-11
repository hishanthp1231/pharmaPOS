const db = require('../db');

async function dumpSchema() {
    try {
        const [usersAuth] = await db.query('DESCRIBE users_auth');
        console.log('=== users_auth ===');
        console.table(usersAuth);

        const [workers] = await db.query('DESCRIBE workers');
        console.log('=== workers ===');
        console.table(workers);

        try {
            const [branches] = await db.query('DESCRIBE branches');
            console.log('=== branches ===');
            console.table(branches);
        } catch (e) {
            console.log('branches table does not exist');
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

dumpSchema();
