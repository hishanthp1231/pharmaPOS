const fs = require('fs');
const path = require('path');
const db = require('../db');

async function dumpBranches() {
    try {
        const [branches] = await db.query('DESCRIBE branches');
        fs.writeFileSync(path.join(__dirname, 'branches_schema.json'), JSON.stringify(branches, null, 2));
        console.log('Dumped to branches_schema.json');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

dumpBranches();
