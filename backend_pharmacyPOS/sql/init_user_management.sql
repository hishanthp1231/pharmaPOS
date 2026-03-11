-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    contact VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add branch_id and role to users_auth table if they don't exist
-- We use a stored procedure to handle idempotent alter table which is not directly supported in standard SQL
DROP PROCEDURE IF EXISTS upgrade_users_auth;

DELIMITER //

CREATE PROCEDURE upgrade_users_auth()
BEGIN
    -- Add role column
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users_auth' 
        AND COLUMN_NAME = 'role'
    ) THEN
        ALTER TABLE users_auth ADD COLUMN role ENUM('super_admin', 'branch_admin', 'branch_user') NOT NULL DEFAULT 'branch_user';
    END IF;

    -- Add branch_id column
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users_auth' 
        AND COLUMN_NAME = 'branch_id'
    ) THEN
        ALTER TABLE users_auth ADD COLUMN branch_id INT;
        ALTER TABLE users_auth ADD CONSTRAINT fk_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
    END IF;
END //

DELIMITER ;

CALL upgrade_users_auth();
DROP PROCEDURE upgrade_users_auth;

-- Insert Mock Data

-- Clear existing data for clean slate (optional, but good for testing)
-- DELETE FROM users_auth;
-- DELETE FROM branches;
-- DELETE FROM workers;

-- 1. Create Branches
INSERT INTO branches (id, name, address, contact) VALUES 
(1, 'Downtown Pharmacy', '123 Main St, Downtown', '555-0101'),
(2, 'Uptown Pharmacy', '456 High St, Uptown', '555-0102')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Create Super Admin
-- Password will need to be hashed in application or we use a known hash here. 
-- For this script, we can't easily hash, so we will insert users via the app or updated scripts.
-- However, we can update existing users if any.

-- Let's pretend we have a hashed password for 'password123'
-- $2b$10$YourHashedPasswordHere (This is just a placeholder, you should generate real hash)
-- For the sake of this script, we will assume the application handles password hashing or we use a separate script to seed users with bcrypt.

-- But we can set roles for existing users if we know them.
-- Or insert if not exists (assuming we know the hash).

-- For now, let's just ensure the branches exist and the schema is correct.
-- The actual user creation with valid bcrypt hashes is best done via a Node script using the models.
