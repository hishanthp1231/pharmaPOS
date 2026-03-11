const db = require('../db');

async function verifySupplierQuantity() {
    try {
        console.log('--- Verifying Database Schema ---');
        const [qCols] = await db.query("SHOW COLUMNS FROM medicines LIKE 'quantity'");
        if (qCols.length > 0) console.log('PASS: quantity column exists.');
        else console.error('FAIL: quantity column MISSING.');

        const [sCols] = await db.query("SHOW COLUMNS FROM medicines LIKE 'suppliers'");
        if (sCols.length > 0) console.log('PASS: suppliers column exists.');
        else console.error('FAIL: suppliers column MISSING.');


        console.log('\n--- Verifying Add Medicine with Supplier & Quantity ---');
        // Clean up previous test
        await db.query("DELETE FROM medicines WHERE name = 'TEST_MED_SUPP_QTY'");

        const testQuantity = 150;
        const testSupplier = 'Test Pharma Distributors';

        const [result] = await db.query(
            `INSERT INTO medicines 
      (name, generic_name, category, default_mrp, variants, branch_id, quantity, suppliers) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['TEST_MED_SUPP_QTY', 'Generic Test', 'Test Cat', 100.50, '[]', 1, testQuantity, testSupplier]
        );

        console.log('Inserted test medicine with ID:', result.insertId);

        const [rows] = await db.query('SELECT * FROM medicines WHERE id = ?', [result.insertId]);
        const med = rows[0];

        if (med) {
            if (med.quantity === testQuantity) {
                console.log(`PASS: Quantity saved correctly: ${med.quantity}`);
            } else {
                console.error(`FAIL: Quantity mismatch. Expected ${testQuantity}, got ${med.quantity}`);
            }

            if (med.suppliers === testSupplier) {
                console.log(`PASS: Supplier saved correctly: ${med.suppliers}`);
            } else {
                console.error(`FAIL: Supplier mismatch. Expected ${testSupplier}, got ${med.suppliers}`);
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

verifySupplierQuantity();
