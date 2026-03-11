-- Add category column to expenses table
ALTER TABLE expenses
ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'Other' AFTER expense,
ADD CONSTRAINT fk_expense_branch
    FOREIGN KEY (branch_id)
    REFERENCES branches(id)
    ON DELETE CASCADE;

-- Create expense_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories if they don't exist
INSERT IGNORE INTO expense_categories (name, description) VALUES
('Rent', 'Office/store rent payments'),
('Utilities', 'Electricity, water, internet, etc.'),
('Salaries', 'Employee salaries and wages'),
('Marketing', 'Advertising and promotional expenses'),
('Office Supplies', 'Stationery and office materials'),
('Maintenance', 'Equipment and facility maintenance'),
('Travel', 'Business travel expenses'),
('Insurance', 'Business insurance payments'),
('Taxes', 'Business taxes and fees'),
('Other', 'Miscellaneous expenses');
