-- Rename joinedDate to dateOfBirth in customers table
ALTER TABLE customers 
CHANGE COLUMN joinedDate dateOfBirth DATE NOT NULL;
