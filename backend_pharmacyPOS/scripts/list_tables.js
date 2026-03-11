const db = require('../db');

async function listTables() {
    try {
        const [tables] = await db.query('SHOW TABLES');
        console.log('=== TABLES ===');
        console.table(tables);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listTables();
