-- Update the role ENUM to include 'cashier'
ALTER TABLE users MODIFY COLUMN role ENUM('student', 'teacher', 'admin', 'cashier') NOT NULL; 