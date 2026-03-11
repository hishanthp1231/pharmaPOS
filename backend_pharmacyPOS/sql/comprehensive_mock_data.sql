-- COMPREHENSIVE MOCK DATA FOR ALL BRANCHES (1-8)
-- This script resets user, administrative, and operational data for a clean test environment.
-- Default Password for all accounts: password123
-- Password Hash (bcrypt): $2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE users_auth;
TRUNCATE TABLE workers;
TRUNCATE TABLE billing_settings;
TRUNCATE TABLE categories;
TRUNCATE TABLE suppliers;
TRUNCATE TABLE customers;
TRUNCATE TABLE medicines;
TRUNCATE TABLE expenses;
TRUNCATE TABLE sales_details;
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 1. USERS & WORKERS DATA (Schemas synchronized)
-- ==========================================

-- Super Admin
INSERT INTO workers (name, email, contact, role, branchCode, branch_id) 
VALUES ('Super Admin', 'superadmin@pharmacy.com', '+94 11 0000000', 'super_admin', NULL, NULL);

INSERT INTO users_auth (username, email, password_hash, role, branch_id)
VALUES ('superadmin', 'superadmin@pharmacy.com', '$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam', 'super_admin', NULL);

-- Branch 1: Main Branch (John Perera)
INSERT INTO workers (name, email, contact, role, branchCode, branch_id) 
VALUES ('John Perera', 'john.main@pharmacy.com', '+94 11 2345678', 'branch_admin', 1, 1),
       ('Branch 1 Pharmacist', 'user1@pharmacy.com', '+94 11 2345679', 'branch_user', 1, 1);
INSERT INTO users_auth (username, email, password_hash, role, branch_id)
VALUES ('admin_br1', 'john.main@pharmacy.com', '$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam', 'branch_admin', 1),
       ('user_br1', 'user1@pharmacy.com', '$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam', 'branch_user', 1);

-- Branch 2: Kandy Branch (Nimal Silva)
INSERT INTO workers (name, email, contact, role, branchCode, branch_id) 
VALUES ('Nimal Silva', 'nimal.kandy@pharmacy.com', '+94 81 2233445', 'branch_admin', 2, 2),
       ('Branch 2 Pharmacist', 'user2@pharmacy.com', '+94 81 2233446', 'branch_user', 2, 2);
INSERT INTO users_auth (username, email, password_hash, role, branch_id)
VALUES ('admin_br2', 'nimal.kandy@pharmacy.com', '$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam', 'branch_admin', 2),
       ('user_br2', 'user2@pharmacy.com', '$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam', 'branch_user', 2);

-- Branch 3: Galle Branch (Saman Kumara)
INSERT INTO workers (name, email, contact, role, branchCode, branch_id) 
VALUES ('Saman Kumara', 'saman.galle@pharmacy.com', '+94 91 2256789', 'branch_admin', 3, 3),
       ('Branch 3 Pharmacist', 'user3@pharmacy.com', '+94 91 2256790', 'branch_user', 3, 3);
INSERT INTO users_auth (username, email, password_hash, role, branch_id)
VALUES ('admin_br3', 'saman.galle@pharmacy.com', '$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam', 'branch_admin', 3),
       ('user_br3', 'user3@pharmacy.com', '$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam', 'branch_user', 3);

-- Branch 4: Negombo Branch (Ruwan Fernando)
INSERT INTO workers (name, email, contact, role, branchCode, branch_id) 
VALUES ('Ruwan Fernando', 'ruwan.negombo@pharmacy.com', '+94 31 2277889', 'branch_admin', 4, 4);
INSERT INTO users_auth (username, email, password_hash, role, branch_id)
VALUES ('admin_br4', 'ruwan.negombo@pharmacy.com', '$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam', 'branch_admin', 4);

-- Branch 5: Jaffna Branch (Thiru Sivarajah)
INSERT INTO workers (name, email, contact, role, branchCode, branch_id) 
VALUES ('Thiru Sivarajah', 'thiru.jaffna@pharmacy.com', '+94 21 2223344', 'branch_admin', 5, 5);
INSERT INTO users_auth (username, email, password_hash, role, branch_id)
VALUES ('admin_br5', 'thiru.jaffna@pharmacy.com', '$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam', 'branch_admin', 5);

-- Branch 6: Matara Branch (Kasun Jayasuriya)
INSERT INTO workers (name, email, contact, role, branchCode, branch_id) 
VALUES ('Kasun Jayasuriya', 'kasun.matara@pharmacy.com', '+94 41 2233445', 'branch_admin', 6, 6);
INSERT INTO users_auth (username, email, password_hash, role, branch_id)
VALUES ('admin_br6', 'kasun.matara@pharmacy.com', '$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam', 'branch_admin', 6);

-- Branch 7: Kurunegala Branch (Roshan Weerasinghe)
INSERT INTO workers (name, email, contact, role, branchCode, branch_id) 
VALUES ('Roshan Weerasinghe', 'roshan.kurunegala@pharmacy.com', '+94 37 2244556', 'branch_admin', 7, 7);
INSERT INTO users_auth (username, email, password_hash, role, branch_id)
VALUES ('admin_br7', 'roshan.kurunegala@pharmacy.com', '$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam', 'branch_admin', 7);

-- Branch 8: Batticaloa Branch (Mohan Raj)
INSERT INTO workers (name, email, contact, role, branchCode, branch_id) 
VALUES ('Mohan Raj', 'mohan.batticaloa@pharmacy.com', '+94 65 2228899', 'branch_admin', 8, 8),
       ('Batticaloa Pharmacist', 'batti.user@pharmacy.com', '+94 65 2228900', 'branch_user', 8, 8);
INSERT INTO users_auth (username, email, password_hash, role, branch_id)
VALUES ('battiAdmin1', 'mohan.batticaloa@pharmacy.com', '$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam', 'branch_admin', 8),
       ('battiUser1', 'batti.user@pharmacy.com', '$2b$10$Ee04JQo8WcfT7lTu9ObrGe4Sp0rkX23nqvx924azpWwU1DFLegqam', 'branch_user', 8);

-- ==========================================
-- 2. BILLING SETTINGS
-- ==========================================
INSERT INTO billing_settings (branch_id, defaultPaymentMethod, defaultDiscountType, defaultDiscountValue, taxPercentage, receiptFooter)
VALUES 
(1, 'Cash', 'Percentage', 0.00, 12.00, 'Main Branch - Serving your health!'),
(2, 'Cash', 'Percentage', 2.00, 5.00, 'Thank you for visiting Kandy Branch!'),
(3, 'Card', 'Fixed', 50.00, 8.00, 'Galle Branch - Seaside Wellness'),
(4, 'Cash', 'Percentage', 0.00, 0.00, 'Negombo Branch - Health First'),
(5, 'Cash', 'Percentage', 10.00, 15.00, 'Jaffna Branch - Quality Healthcare'),
(6, 'Card', 'Percentage', 5.00, 12.00, 'Matara Branch - Your Friendly Pharmacy'),
(7, 'Cash', 'Percentage', 0.00, 5.00, 'Kurunegala Branch - Caring for You'),
(8, 'Cash', 'Fixed', 100.00, 10.00, 'Batticaloa Branch - Recovery Together')
ON DUPLICATE KEY UPDATE branch_id=VALUES(branch_id);

-- ==========================================
-- 3. CATEGORIES
-- ==========================================
INSERT INTO categories (name, branch_id) VALUES 
('Pain Relief', 1), ('First Aid', 1), ('Skincare', 1),
('Pain Relief', 2), ('Vitamins', 2), ('First Aid', 2),
('Pain Relief', 3), ('Skincare', 3), ('Diabetes Care', 3),
('Personal Care', 4), ('Baby Care', 4), ('Cold & Flu', 4),
('Pain Relief', 5), ('Vitamins', 5), ('Ayurvedic', 5),
('Pain Relief', 6), ('Skincare', 6), ('Surgical', 6),
('Pain Relief', 7), ('Baby Care', 7), ('Supplements', 7),
('Pain Relief', 8), ('Personal Care', 8), ('Emergency', 8)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ==========================================
-- 4. SUPPLIERS
-- ==========================================
INSERT INTO suppliers (name, address, email, phone, branch_id) VALUES 
('Express Meds', 'Colombo 1', 'express@meds.com', '0112223300', 1),
('Lanka Pharma Suppliers', 'Colombo 10', 'lanka@pharma.com', '0112223344', 2),
('Hill Country Meds', 'Peradeniya Rd, Kandy', 'hill@meds.com', '0812223344', 2),
('Southern Healthcare', 'Matara Rd, Galle', 'south@health.com', '0912223344', 3),
('Negombo Distributing', 'Main St, Negombo', 'neg@dist.com', '0312223344', 4),
('Jaffna Medical Co', 'Palaly Rd, Jaffna', 'jaffna@med.com', '0212223344', 5),
('Matara Pharma', 'Station Rd, Matara', 'matara@pharma.com', '0412223344', 6),
('Kurunegala Meds', 'Lake Round, Kurunegala', 'kuru@meds.com', '0372223344', 7),
('East Coast Pharmacy Supplies', 'Trinco Rd, Batti', 'east@pharma.com', '0652223344', 8);

-- ==========================================
-- 5. CUSTOMERS
-- ==========================================
INSERT INTO customers (name, phone, email, address, branch_id, status) VALUES 
('Test Customer', '0770000000', 'test@test.com', 'Colombo', 1, 'Active'),
('Kamal Perera', '0771234567', 'kamal@gmail.com', 'Kandy central', 2, 'Active'),
('Nirosha Silva', '0772345678', 'niro@gmail.com', 'Galle Fort', 3, 'Active'),
('Mohamed Azwer', '0773456789', 'azwer@gmail.com', 'Negombo beach', 4, 'Active'),
('S. Vijay', '0774567890', 'vijay@gmail.com', 'Jaffna town', 5, 'Active'),
('Anjali Peris', '0775678901', 'anjali@gmail.com', 'Matara city', 6, 'Active'),
('Dilan Fernando', '0776789012', 'dilan@gmail.com', 'Kurunegala round', 7, 'Active'),
('R. Thiru', '0777890123', 'thiru@gmail.com', 'Batticaloa shore', 8, 'Active');

-- ==========================================
-- 6. MEDICINES
-- ==========================================
INSERT INTO medicines (name, generic_name, category, default_mrp, barcode, branch_id) VALUES 
('Paracetamol 500mg', 'Acetaminophen', 'Pain Relief', 5.00, '10000001', 1),
('Panadol 500mg', 'Paracetamol', 'Pain Relief', 10.00, '20000001', 2),
('Amoxil', 'Amoxicillin', 'Cold & Flu', 450.00, '20000002', 3),
('Zyrtec', 'Cetirizine', 'Cold & Flu', 30.00, '20000003', 4),
('Gaviscon', 'Sodium Alginate', 'First Aid', 1200.00, '20000004', 5),
('Centrum', 'Multivitamins', 'Vitamins', 2500.00, '20000005', 6),
('Betadine', 'Povidone-iodine', 'First Aid', 350.00, '20000006', 7),
('Dettol', 'Chloroxylenol', 'Personal Care', 180.00, '20000007', 8);

-- ==========================================
-- 7. EXPENSES
-- ==========================================
INSERT INTO expenses (expense, paidTo, date, amount, paymentMethod, branch_id, remark) VALUES 
('Office Rent', 'Landlord', CURDATE(), 50000.00, 'Cash', 1, 'Monthly HQ rent'),
('Electricity Bill', 'CEB', CURDATE(), 4500.00, 'Cash', 2, 'Monthly power bill'),
('Water Bill', 'Water Board', CURDATE(), 1200.00, 'Cash', 3, 'Monthly water bill'),
('Staff Tea', 'Cargills', CURDATE(), 3000.00, 'Card', 4, 'Office pantry supplies'),
('Security Guard', 'Certis', CURDATE(), 15000.00, 'Cash', 5, 'Night shift guard'),
('Internet', 'SLT', CURDATE(), 2500.00, 'Online', 6, 'Fiber connection'),
('Cleaning', 'Direct Cleaners', CURDATE(), 5000.00, 'Cash', 7, 'Deep cleaning service'),
('Printing', 'Print Shop', CURDATE(), 800.00, 'Cash', 8, 'Flyer printing');

-- ==========================================
-- 8. SALES DETAILS
-- ==========================================
INSERT INTO sales_details (date, customer, items, total, branch_id) VALUES 
(CURDATE(), 'Test Customer', '[{"name": "Paracetamol 500mg", "quantity": 10, "price": 5}]', 50.00, 1),
(CURDATE(), 'Kamal Perera', '[{"name": "Panadol", "quantity": 10, "price": 10}]', 100.00, 2),
(CURDATE(), 'Nirosha Silva', '[{"name": "Amoxil", "quantity": 1, "price": 450}]', 450.00, 3),
(CURDATE(), 'Mohamed Azwer', '[{"name": "Zyrtec", "quantity": 5, "price": 30}]', 150.00, 4),
(CURDATE(), 'S. Vijay', '[{"name": "Gaviscon", "quantity": 1, "price": 1200}]', 1200.00, 5),
(CURDATE(), 'Anjali Peris', '[{"name": "Centrum", "quantity": 1, "price": 2500}]', 2500.00, 6),
(CURDATE(), 'Dilan Fernando', '[{"name": "Betadine", "quantity": 2, "price": 350}]', 700.00, 7),
(CURDATE(), 'R. Thiru', '[{"name": "Dettol", "quantity": 3, "price": 180}]', 540.00, 8);
