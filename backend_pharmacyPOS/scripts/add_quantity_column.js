const db = require('../db');

async function addQuantityColumn() {
    try {
        console.log('Checking if quantity column exists in medicines table...');
        const [columns] = await db.query("SHOW COLUMNS FROM medicines LIKE 'quantity'");

        if (columns.length === 0) {
            console.log('Adding quantity column...');
            // Adding quantity column, default 0
            await db.query("ALTER TABLE medicines ADD COLUMN quantity INT DEFAULT 0 AFTER expiry_date");
            console.log('Successfully added quantity column.');
        } else {
            console.log('quantity column already exists.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error altering table:', err);
        process.exit(1);
    }
}

addQuantityColumn();
