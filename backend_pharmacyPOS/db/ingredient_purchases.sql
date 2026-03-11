CREATE TABLE ingredient_purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grn_id INT NOT NULL,
  ingredient_name VARCHAR(100) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  supplier VARCHAR(100) NOT NULL,
  invoice VARCHAR(50) NOT NULL,
  purchase_date DATE NOT NULL,
  expiry_date DATE,
  branch_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by grn_id
CREATE INDEX idx_ingredient_purchases_grn_id ON ingredient_purchases(grn_id);
