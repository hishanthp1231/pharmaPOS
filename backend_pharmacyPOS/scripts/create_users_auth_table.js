const db = require('../db');

async function createUsersAuth() {
    try {
        console.log('Creating users_auth table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS users_auth (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('super_admin', 'branch_admin', 'branch_user') NOT NULL DEFAULT 'branch_user',
                branch_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
            )
        `);
        console.log('users_auth table created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating users_auth table:', error);
        process.exit(1);
    }
}

createUsersAuth();
