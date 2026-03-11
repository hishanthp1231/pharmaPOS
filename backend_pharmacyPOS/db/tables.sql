CREATE TABLE tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  branch_id INT NOT NULL,
  status ENUM('available', 'booked', 'reserved') DEFAULT 'available',
  order_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
