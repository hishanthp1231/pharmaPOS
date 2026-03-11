-- Pharma POS Complete Database Rebuild Script
-- Database: pharmacypos

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS pharmacypos;
USE pharmacypos;

-- 2. Drop existing tables in reverse order of dependencies (optional - uncomment if full reset needed)
-- DROP TABLE IF EXISTS roles;
-- DROP TABLE IF EXISTS pharmacy_returns_refunds;
-- DROP TABLE IF EXISTS pharmacy_payments;
-- DROP TABLE IF EXISTS pharmacy_pay_in_terms;
-- DROP TABLE IF EXISTS notification_templates;
-- DROP TABLE IF EXISTS variant_options;
-- DROP TABLE IF EXISTS variant_types;
-- DROP TABLE IF EXISTS expenses;
-- DROP TABLE IF EXISTS grn_items;
-- DROP TABLE IF EXISTS sales_details;
-- DROP TABLE IF EXISTS orders;
-- DROP TABLE IF EXISTS customers;
-- DROP TABLE IF EXISTS medicines;
-- DROP TABLE IF EXISTS suppliers;
-- DROP TABLE IF EXISTS categories;
-- DROP TABLE IF EXISTS billing_settings;
-- DROP TABLE IF EXISTS tables;
-- DROP TABLE IF EXISTS workers;
-- DROP TABLE IF EXISTS users_auth;
-- DROP TABLE IF EXISTS store_info;
-- DROP TABLE IF EXISTS branches;

-- 3. Create Tables

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  address text,
  contact varchar(50),
  code varchar(50) UNIQUE NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Store Info
CREATE TABLE IF NOT EXISTS store_info (
  id int(11) NOT NULL DEFAULT 1,
  name varchar(255) NOT NULL,
  code varchar(50) NOT NULL,
  email varchar(255),
  businessType varchar(100),
  logo varchar(512),
  activeBranchId int(11),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  can_view tinyint(1) DEFAULT 0,
  can_edit tinyint(1) DEFAULT 0,
  can_delete tinyint(1) DEFAULT 0,
  pages text, -- JSON array
  is_admin tinyint(1) DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Workers
CREATE TABLE IF NOT EXISTS workers (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  contact varchar(50),
  role varchar(100),
  branchCode int(11),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Auth
CREATE TABLE IF NOT EXISTS users_auth (
  id int(11) NOT NULL AUTO_INCREMENT,
  username varchar(100) UNIQUE NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  role varchar(100),
  branch_id varchar(255), -- Changed to varchar to support multiple branch JSON if needed
  role_id int(11),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  branch_id int(11) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  address text,
  email varchar(255),
  phone varchar(50),
  status varchar(50) DEFAULT 'Active',
  branch_id int(11),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Medicines
CREATE TABLE IF NOT EXISTS medicines (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  generic_name varchar(255),
  category varchar(255),
  default_mrp decimal(10,2) DEFAULT 0.00,
  image varchar(512),
  variants text, -- JSON array
  barcode varchar(100),
  branch_id int(11) NOT NULL,
  expiry_date date,
  quantity int(11) DEFAULT 0,
  suppliers text,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  phone varchar(50) NOT NULL,
  address text,
  dob date,
  email varchar(255),
  whatsapp tinyint(1) DEFAULT 0,
  viber tinyint(1) DEFAULT 0,
  paid decimal(10,2) DEFAULT 0.00,
  due decimal(10,2) DEFAULT 0.00,
  credit decimal(10,2) DEFAULT 0.00,
  status varchar(50) DEFAULT 'Active',
  purchases text, -- JSON array
  branch_id int(11),
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tables
CREATE TABLE IF NOT EXISTS tables (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  branch_id int(11) NOT NULL,
  status varchar(50) DEFAULT 'available',
  order_id int(11),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id int(11) NOT NULL AUTO_INCREMENT,
  customer_name varchar(255),
  customer_phone varchar(50),
  num_persons int(11) DEFAULT 1,
  order_type varchar(50),
  branch_id int(11) NOT NULL,
  table_id int(11),
  status varchar(50) DEFAULT 'pending',
  date date,
  cart text, -- JSON array
  payment_method varchar(100),
  subtotal decimal(10,2) DEFAULT 0.00,
  discount text, -- JSON string or array
  tax text, -- JSON string or array
  total decimal(10,2) DEFAULT 0.00,
  paid_amount decimal(10,2) DEFAULT 0.00,
  future_credit decimal(10,2) DEFAULT 0.00,
  customer_id int(11),
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sales Details
CREATE TABLE IF NOT EXISTS sales_details (
  id int(11) NOT NULL AUTO_INCREMENT,
  date date NOT NULL,
  customer varchar(255),
  customer_phone varchar(50),
  items text, -- JSON array
  total decimal(10,2) NOT NULL,
  branch_id int(11) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- GRN Items
CREATE TABLE IF NOT EXISTS grn_items (
  id int(11) NOT NULL AUTO_INCREMENT,
  grn_id int(11) NOT NULL,
  branch_id int(11) NOT NULL,
  medicine_id int(11) NOT NULL,
  quantity int(11) NOT NULL,
  unit varchar(50),
  mrp decimal(10,2) DEFAULT 0.00,
  retail decimal(10,2) DEFAULT 0.00,
  wholesale decimal(10,2) DEFAULT 0.00,
  expiry date,
  supplier varchar(255),
  date date NOT NULL,
  invoice varchar(100),
  total decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id int(11) NOT NULL AUTO_INCREMENT,
  date date NOT NULL,
  expense varchar(255) NOT NULL,
  amount decimal(10,2) NOT NULL,
  paymentMethod varchar(100),
  paidTo varchar(255),
  status varchar(50) DEFAULT 'Paid',
  remark text,
  balance decimal(10,2),
  receipt varchar(512),
  branch_id int(11) NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Variant Types
CREATE TABLE IF NOT EXISTS variant_types (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  branch_id int(11) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Variant Options
CREATE TABLE IF NOT EXISTS variant_options (
  id int(11) NOT NULL AUTO_INCREMENT,
  type_id int(11) NOT NULL,
  name varchar(255) NOT NULL,
  price_adjustment decimal(10,2) DEFAULT 0.00,
  branch_id int(11) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  type varchar(50), -- SMS, Email
  trigger_event varchar(100),
  template_text text,
  is_active tinyint(1) DEFAULT 1,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Billing Settings
CREATE TABLE IF NOT EXISTS billing_settings (
  id int(11) NOT NULL AUTO_INCREMENT,
  branch_id int(11) UNIQUE NOT NULL,
  defaultPaymentMethod varchar(100),
  defaultDiscountType varchar(50),
  defaultDiscountValue decimal(10,2),
  taxPercentage decimal(5,2),
  receiptFooter text,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pharmacy Pay In Terms
CREATE TABLE IF NOT EXISTS pharmacy_pay_in_terms (
  id int(11) NOT NULL AUTO_INCREMENT,
  branch_id int(11) NOT NULL,
  title varchar(255),
  total_amount decimal(10,2),
  paid_amount decimal(10,2) DEFAULT 0.00,
  balance_amount decimal(10,2),
  status varchar(50),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pharmacy Payments
CREATE TABLE IF NOT EXISTS pharmacy_payments (
  id int(11) NOT NULL AUTO_INCREMENT,
  pay_in_terms_id int(11) NOT NULL,
  amount decimal(10,2) NOT NULL,
  date datetime DEFAULT CURRENT_TIMESTAMP,
  branch_id int(11) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pharmacy Returns Refunds
CREATE TABLE IF NOT EXISTS pharmacy_returns_refunds (
  id int(11) NOT NULL AUTO_INCREMENT,
  branch_id int(11) NOT NULL,
  order_id int(11),
  product_id int(11),
  quantity int(11),
  reason text,
  amount decimal(10,2),
  date datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Profile Settings
CREATE TABLE IF NOT EXISTS profile_settings (
  id int(11) NOT NULL DEFAULT 1,
  name varchar(255),
  email varchar(255),
  phone varchar(50),
  role varchar(100),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Discounts
CREATE TABLE IF NOT EXISTS discounts (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  type varchar(50), -- percentage, fixed
  value decimal(10,2) NOT NULL,
  items text, -- JSON or string
  startDate date,
  endDate date,
  status varchar(50),
  branch_id int(11),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Mock Data Population (Idempotent)

-- Store Info
INSERT INTO store_info (id, name, code, email, businessType, logo) 
VALUES (1, 'PharmaCare Solutions', 'PCS-MAIN', 'info@pharmacare.com', 'Pharmacy', 'logo.png')
ON DUPLICATE KEY UPDATE name=VALUES(name), code=VALUES(code);

-- Branches
INSERT INTO branches (id, name, address, contact, code) VALUES
(1, 'Colombo Main Branch', '123 Galle Road, Colombo 03', '0112345678', 'BR-001'),
(2, 'Kandy Branch', '45 Peradeniya Road, Kandy', '0812345678', 'BR-002'),
(3, 'Galle branch', '78 Matara Road, Galle', '0912345678', 'BR-003'),
(4, 'Batticaloa Branch', 'No 15, Main St, Batticaloa', '0652345678', 'BR-004')
ON DUPLICATE KEY UPDATE name=VALUES(name), code=VALUES(code);

-- Roles
INSERT INTO roles (id, name, can_view, can_edit, can_delete, pages, is_admin) VALUES
(1, 'Super Admin', 1, 1, 1, '["dashboard", "inventory", "sales", "expenses", "users", "settings"]', 1),
(2, 'Branch Admin', 1, 1, 1, '["dashboard", "inventory", "sales", "expenses", "users"]', 0),
(3, 'Pharmacist', 1, 1, 0, '["dashboard", "inventory", "sales"]', 0),
(4, 'Cashier', 1, 0, 0, '["sales"]', 0)
ON DUPLICATE KEY UPDATE name=VALUES(name), pages=VALUES(pages);

-- Workers
INSERT INTO workers (id, name, email, contact, role, branchCode) VALUES
(1, 'John Doe', 'john@pharmacare.com', '0771234567', 'super_admin', 1),
(2, 'Jane Smith', 'jane@pharmacare.com', '0772345678', 'branch_admin', 1),
(3, 'Alice Perera', 'alice@pharmacare.com', '0773456789', 'branch_user', 2),
(4, 'Saman Silva', 'saman@pharmacare.com', '0775556667', 'branch_admin', 4)
ON DUPLICATE KEY UPDATE name=VALUES(name), contact=VALUES(contact), role=VALUES(role), branchCode=VALUES(branchCode);

-- 6. User Auth (Passwords are 'password123' hashed with bcrypt, round 12)
INSERT INTO users_auth (id, username, email, password_hash, role, branch_id, role_id) VALUES
(1, 'superadmin', 'john@pharmacare.com', '$2a$12$nIdFwgaIeOBNe4FHuyWEte4WbndRyu6pxK0bbg0jXud/c/d4VStRa', 'super_admin', '1', 1),
(2, 'jane_admin', 'jane@pharmacare.com', '$2a$12$nIdFwgaIeOBNe4FHuyWEte4WbndRyu6pxK0bbg0jXud/c/d4VStRa', 'branch_admin', '1', 2),
(3, 'batticaloa_admin', 'saman@pharmacare.com', '$2a$12$nIdFwgaIeOBNe4FHuyWEte4WbndRyu6pxK0bbg0jXud/c/d4VStRa', 'branch_admin', '4', 2),
(4, 'super admin', 'admin@pharmacare.com', '$2a$12$nIdFwgaIeOBNe4FHuyWEte4WbndRyu6pxK0bbg0jXud/c/d4VStRa', 'super_admin', '1', 1)
ON DUPLICATE KEY UPDATE username=VALUES(username), email=VALUES(email), password_hash=VALUES(password_hash), role=VALUES(role), branch_id=VALUES(branch_id), role_id=VALUES(role_id);

-- Billing Settings
INSERT INTO billing_settings (id, branch_id, defaultPaymentMethod, defaultDiscountType, defaultDiscountValue, taxPercentage, receiptFooter) VALUES
(1, 1, 'Cash', 'percentage', 0, 15, 'Thank you for shopping at PharmaCare Colombo!'),
(2, 2, 'Card', 'percentage', 5, 15, 'Thank you for shopping at PharmaCare Kandy!'),
(3, 4, 'Cash', 'percentage', 0, 15, 'Thank you for shopping at PharmaCare Batticaloa!')
ON DUPLICATE KEY UPDATE defaultPaymentMethod=VALUES(defaultPaymentMethod), defaultDiscountType=VALUES(defaultDiscountType), defaultDiscountValue=VALUES(defaultDiscountValue), taxPercentage=VALUES(taxPercentage), receiptFooter=VALUES(receiptFooter);

-- Categories
INSERT INTO categories (id, name, branch_id) VALUES
(1, 'Antibiotics', 1),
(2, 'Painkillers', 1),
(3, 'Vitamins', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Suppliers
INSERT INTO suppliers (id, name, address, email, phone, status, branch_id) VALUES
(1, 'State Pharmaceuticals', 'Colombo 10', 'spc@gov.lk', '0115551234', 'Active', 1),
(2, 'Lanka Drug House', 'Kandy Road', 'info@ldh.lk', '0115555678', 'Active', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Medicines
INSERT INTO medicines (id, name, generic_name, category, default_mrp, barcode, branch_id, quantity) VALUES
(1, 'Amoxicillin 500mg', 'Amoxicillin', 'Antibiotics', 25.50, '00000001', 1, 500),
(2, 'Panadol Advance', 'Paracetamol', 'Painkillers', 5.00, '00000002', 1, 1000)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);

-- Customers
INSERT INTO customers (id, name, phone, address, status, branch_id) VALUES
(1, 'Kamal Perera', '0711111111', 'No 5, Flower Rd, Colombo', 'Active', 1),
(2, 'Walk-in Customer', '0000000000', 'N/A', 'Active', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Tables
INSERT INTO tables (id, name, branch_id, status) VALUES
(1, 'Consultation 1', 1, 'available'),
(2, 'Consultation 2', 1, 'available')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Expenses
INSERT INTO expenses (id, date, expense, amount, paymentMethod, paidTo, branch_id) VALUES
(1, '2026-02-01', 'Rent', 50000.00, 'Bank Transfer', 'Property Owner', 1)
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- Notification Templates
INSERT INTO notification_templates (id, name, type, trigger_event, template_text) VALUES
(1, 'Welcome SMS', 'SMS', 'customer_registration', 'Welcome {{name}} to PharmaCare!')
ON DUPLICATE KEY UPDATE template_text=VALUES(template_text);
