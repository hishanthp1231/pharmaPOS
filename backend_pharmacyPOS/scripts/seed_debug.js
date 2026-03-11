const db = require('../db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function runMigration() {
    const logFile = path.join(__dirname, 'seed_error.log');

    try {
        console.log('Starting migration...');

        // 1. Branches
        try {
            console.log('Inserting Branches...');
            await db.query(`INSERT INTO branches (id, name, address, contact) VALUES 
          (1, 'Downtown Pharmacy', '123 Main St, Downtown', '555-0101'),
          (2, 'Uptown Pharmacy', '456 High St, Uptown', '555-0102')
          ON DUPLICATE KEY UPDATE name=VALUES(name)`);
            console.log('Branches inserted.');
        } catch (e) {
            throw new Error(`Branches error: ${e.message}`);
        }

        // Hash Password
        const password = 'password123';
        const hash = await bcrypt.hash(password, 10);

        // 2. Users Auth
        try {
            console.log('Inserting Super Admin...');
            await db.query(`INSERT INTO users_auth (username, email, password_hash, role, branch_id) 
          VALUES (?, ?, ?, 'super_admin', NULL) 
          ON DUPLICATE KEY UPDATE role='super_admin', password_hash=?`,
                ['superadmin', 'super@admin.com', hash, hash]);
            console.log('Super Admin inserted.');
        } catch (e) {
            throw new Error(`Super Admin error: ${e.message}`);
        }

        // 3. Workers
        try {
            console.log('Inserting Workers...');
            const workersData = [
                ['super@admin.com', 'Super Admin', 'super_admin', null],
                ['admin@downtown.com', 'Downtown Manager', 'branch_admin', 1]
            ];

            for (const [email, name, role, branchId] of workersData) {
                await db.query(`INSERT INTO workers (email, name, role, branchCode) 
              VALUES (?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE role=?, branchCode=?`,
                    [email, name, role, branchId, role, branchId]);
            }
            console.log('Workers inserted.');
        } catch (e) {
            throw new Error(`Workers error: ${e.message}`);
        }

        console.log('Migration Complete!');
        process.exit(0);

    } catch (error) {
        console.error('Migration Failed:', error.message);
        fs.writeFileSync(logFile, error.message);
        process.exit(1);
    }
}

runMigration();
