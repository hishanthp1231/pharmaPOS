const db = require('../db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function runMigration() {
    try {
        // 1. Run the SQL Schema changes
        const sqlPath = path.join(__dirname, '../sql/init_user_management.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by statement (rough split for now, assuming ; at end of lines)
        // Actually, handling delimiters in JS is tricky. 
        // It's often better to just run the critical ALTERs / CREATEs directly using db.query
        // if the SQL file contains stored procedures.

        // Simplification: Let's execute the raw SQL file commands. 
        // Since mysql2 might not support multiple statements by default unless configured.
        // We will do it step by step in JS for reliability.

        console.log('--- 1. Creating/Updating Schema ---');

        await db.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        contact VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('Checked branches table');

        // Add columns to users_auth
        try {
            await db.query(`ALTER TABLE users_auth ADD COLUMN role ENUM('super_admin', 'branch_admin', 'branch_user') NOT NULL DEFAULT 'branch_user'`);
            console.log('Added role column');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('Role column check:', e.message);
        }

        try {
            await db.query(`ALTER TABLE users_auth ADD COLUMN branch_id INT`);
            await db.query(`ALTER TABLE users_auth ADD CONSTRAINT fk_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL`);
            console.log('Added branch_id column');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('Branch_id column check:', e.message);
        }

        // Add columns to workers if referenced
        // Note: The plan mentioned updating workers table.
        // If workers need to be linked to branches:
        try {
            await db.query(`ALTER TABLE workers ADD COLUMN branch_id INT`);
            await db.query(`ALTER TABLE workers ADD CONSTRAINT fk_worker_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL`);
            console.log('Added branch_id to workers');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('Worker branch_id check:', e.message);
        }


        console.log('--- 2. Seeding Data ---');

        // Insert Branches
        await db.query(`INSERT INTO branches (id, name, address, contact, code) VALUES 
      (1, 'Downtown Pharmacy', '123 Main St, Downtown', '555-0101', 'DOWNTOWN'),
      (2, 'Uptown Pharmacy', '456 High St, Uptown', '555-0102', 'UPTOWN')
      ON DUPLICATE KEY UPDATE name=VALUES(name), code=VALUES(code)`);
        console.log('Seeded Branches');

        // Hash Password
        const password = 'password123';
        const hash = await bcrypt.hash(password, 10);

        // 1. Super Admin
        await db.query(`INSERT INTO users_auth (username, email, password_hash, role, branch_id) 
      VALUES (?, ?, ?, 'super_admin', NULL) 
      ON DUPLICATE KEY UPDATE role='super_admin', password_hash=?`,
            ['superadmin', 'super@admin.com', hash, hash]);
        console.log('Seeded Super Admin (User: superadmin, Pass: password123)');

        // 2. Branch Admin 1 (Downtown)
        await db.query(`INSERT INTO users_auth (username, email, password_hash, role, branch_id) 
      VALUES (?, ?, ?, 'branch_admin', 1) 
      ON DUPLICATE KEY UPDATE role='branch_admin', branch_id=1, password_hash=?`,
            ['branch1_admin', 'admin@downtown.com', hash, hash]);
        console.log('Seeded Branch 1 Admin (User: branch1_admin, Pass: password123)');

        // 3. Branch User 1 (Downtown)
        await db.query(`INSERT INTO users_auth (username, email, password_hash, role, branch_id) 
      VALUES (?, ?, ?, 'branch_user', 1) 
      ON DUPLICATE KEY UPDATE role='branch_user', branch_id=1, password_hash=?`,
            ['branch1_user', 'user@downtown.com', hash, hash]);
        console.log('Seeded Branch 1 User (User: branch1_user, Pass: password123)');

        // 4. Branch Admin 2 (Uptown)
        await db.query(`INSERT INTO users_auth (username, email, password_hash, role, branch_id) 
      VALUES (?, ?, ?, 'branch_admin', 2) 
      ON DUPLICATE KEY UPDATE role='branch_admin', branch_id=2, password_hash=?`,
            ['branch2_admin', 'admin@uptown.com', hash, hash]);
        console.log('Seeded Branch 2 Admin (User: branch2_admin, Pass: password123)');

        // 5. Branch User 2 (Uptown)
        await db.query(`INSERT INTO users_auth (username, email, password_hash, role, branch_id) 
        VALUES (?, ?, ?, 'branch_user', 2) 
        ON DUPLICATE KEY UPDATE role='branch_user', branch_id=2, password_hash=?`,
            ['branch2_user', 'user@uptown.com', hash, hash]);
        console.log('Seeded Branch 2 User (User: branch2_user, Pass: password123)');


        // Make sure they exist in workers table too if that's required for login constraint
        // The current auth controller checks workers table for email.
        // So we must seed workers table too.
        console.log('--- 3. Seeding Workers ---');

        const workersData = [
            ['super@admin.com', 'Super Admin', 'super_admin', null],
            ['admin@downtown.com', 'Downtown Manager', 'branch_admin', 1],
            ['user@downtown.com', 'Downtown Staff', 'branch_user', 1],
            ['admin@uptown.com', 'Uptown Manager', 'branch_admin', 2],
            ['user@uptown.com', 'Uptown Staff', 'branch_user', 2]
        ];

        for (const [email, name, role, branchId] of workersData) {
            await db.query(`INSERT INTO workers (email, name, role, branchCode) 
            VALUES (?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE role=?, branchCode=?`,
                [email, name, role, branchId, role, branchId]);
        }
        console.log('Seeded Workers');

        console.log('Migration & Seeding Complete!');
        process.exit(0);

    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
}

runMigration();
