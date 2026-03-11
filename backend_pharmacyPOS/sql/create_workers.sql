CREATE TABLE IF NOT EXISTS workers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contact VARCHAR(50),
    role ENUM('super_admin', 'branch_admin', 'branch_user') DEFAULT 'branch_user',
    branchCode INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branchCode) REFERENCES branches(id) ON DELETE SET NULL
);
