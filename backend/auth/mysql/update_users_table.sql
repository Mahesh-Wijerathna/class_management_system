-- Add name, email, and phone columns to users table
ALTER TABLE users ADD COLUMN name VARCHAR(255) DEFAULT NULL AFTER role;
ALTER TABLE users ADD COLUMN email VARCHAR(255) DEFAULT NULL AFTER name;
ALTER TABLE users ADD COLUMN phone VARCHAR(15) DEFAULT NULL AFTER email; 