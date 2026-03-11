const db = require('../db');

async function dumpWorkers() {
    try {
        const [workers] = await db.query('DESCRIBE workers');
        console.log('=== workers ===');
        console.table(workers);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

dumpWorkers();
