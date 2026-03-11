CREATE TABLE variant_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  branch_id INT NOT NULL,
  UNIQUE KEY unique_type_branch (name, branch_id)
);

CREATE TABLE variant_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  variant_type_id INT NOT NULL,
  branch_id INT NOT NULL,
  FOREIGN KEY (variant_type_id) REFERENCES variant_types(id) ON DELETE CASCADE
);
