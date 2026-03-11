const db = require('../db');

async function verifyChanges() {
    try {
        console.log('--- Verifying Database Schema ---');
        const [columns] = await db.query("SHOW COLUMNS FROM medicines LIKE 'expiry_date'");
        if (columns.length > 0) {
            console.log('PASS: expiry_date column exists.');
        } else {
            console.error('FAIL: expiry_date column MISSING.');
        }

        console.log('\n--- Verifying Add Medicine Logic (Simulated) ---');
        // We can't easily fetch the controller without mocking req/res, 
        // but we can test the DB insert directly to ensure the schema accepts it.
        const testExpiry = '2025-12-31';

        // Clean up previous test
        await db.query("DELETE FROM medicines WHERE name = 'TEST_MED_EXPIRY'");

        const [result] = await db.query(
            `INSERT INTO medicines 
      (name, generic_name, category, default_mrp, variants, branch_id, expiry_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['TEST_MED_EXPIRY', 'Generic Test', 'Test Cat', 100.50, '[]', 1, testExpiry]
        );

        console.log('Inserted test medicine with ID:', result.insertId);

        const [rows] = await db.query('SELECT * FROM medicines WHERE id = ?', [result.insertId]);
        const med = rows[0];

        if (med) {
            // Check Expiry
            // med.expiry_date comes as a Date object from mysql driver
            const dbDate = med.expiry_date ? new Date(med.expiry_date).toISOString().split('T')[0] : null;
            if (dbDate === testExpiry) {
                console.log(`PASS: Expiry date saved correctly: ${dbDate}`);
            } else {
                console.error(`FAIL: Expiry date mismatch. Expected ${testExpiry}, got ${dbDate}`);
            }

            // Check "Price" logic mapping simulation
            // In controller we map default_mrp -> price. 
            // Here we just check if default_mrp is correct in DB.
            if (Number(med.default_mrp) === 100.50) {
                console.log(`PASS: Default MRP saved correctly: ${med.default_mrp}`);
            } else {
                console.error(`FAIL: Default MRP mismatch.`);
            }

        } else {
            console.error('FAIL: Could not retrieve inserted medicine.');
        }

        // Clean up
        await db.query('DELETE FROM medicines WHERE id = ?', [result.insertId]);
        console.log('Test data cleaned up.');

        process.exit(0);
    } catch (err) {
        console.error('Error during verification:', err);
        process.exit(1);
    }
}

verifyChanges();
