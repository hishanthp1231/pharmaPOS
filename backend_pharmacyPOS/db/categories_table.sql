CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  branch_id INT NOT NULL,
  UNIQUE KEY unique_name_branch (name, branch_id)
);
