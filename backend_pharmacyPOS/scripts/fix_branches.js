const db = require('../db');

async function fixBranches() {
    try {
        console.log('Fixing branches table...');

        // Add contact column if it doesn't exist
        try {
            await db.query(`ALTER TABLE branches ADD COLUMN contact VARCHAR(50)`);
            console.log('Added contact column to branches');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('Contact column check:', e.message);
        }

        // Add address column if it doesn't exist (just in case)
        try {
            await db.query(`ALTER TABLE branches ADD COLUMN address VARCHAR(255)`);
            console.log('Added address column to branches');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('Address column check:', e.message);
        }

        console.log('Branches table fixed.');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing branches table:', error);
        process.exit(1);
    }
}

fixBranches();
