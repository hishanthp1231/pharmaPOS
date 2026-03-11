CREATE TABLE IF NOT EXISTS billing_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  defaultPaymentMethod VARCHAR(32) NOT NULL DEFAULT 'Cash',
  invoicePrefix VARCHAR(32) NOT NULL DEFAULT 'INV-',
  defaultDiscount DECIMAL(5,2) NOT NULL DEFAULT 0,
  receiptFooter VARCHAR(255) NOT NULL DEFAULT 'Thank you for your business!',
  UNIQUE KEY unique_branch (branch_id)
);
