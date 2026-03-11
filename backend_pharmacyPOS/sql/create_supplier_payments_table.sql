CREATE TABLE supplier_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_name VARCHAR(255) NOT NULL,
  supplier_phone VARCHAR(50),
  amount DECIMAL(12,2) NOT NULL,
  total_due DECIMAL(12,2) DEFAULT 0,
  balance DECIMAL(12,2) DEFAULT 0,
  method VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  branch_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
