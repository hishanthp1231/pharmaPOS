const db = require('../db');

async function addExpiryDateColumn() {
    try {
        console.log('Checking if expiry_date column exists in medicines table...');
        const [columns] = await db.query("SHOW COLUMNS FROM medicines LIKE 'expiry_date'");

        if (columns.length === 0) {
            console.log('Adding expiry_date column...');
            await db.query("ALTER TABLE medicines ADD COLUMN expiry_date DATE DEFAULT NULL AFTER variants");
            console.log('Successfully added expiry_date column.');
        } else {
            console.log('expiry_date column already exists.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error altering table:', err);
        process.exit(1);
    }
}

addExpiryDateColumn();
