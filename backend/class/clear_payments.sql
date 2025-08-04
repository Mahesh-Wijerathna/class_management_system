-- Clear all payment-related records
-- This will remove all financial records, enrollments, and payment history

-- Clear payment history
DELETE FROM payment_history;

-- Clear enrollments
DELETE FROM enrollments;

-- Clear financial records
DELETE FROM financial_records;

-- Reset auto-increment counters
ALTER TABLE payment_history AUTO_INCREMENT = 1;
ALTER TABLE enrollments AUTO_INCREMENT = 1;
ALTER TABLE financial_records AUTO_INCREMENT = 1;

-- Show confirmation
SELECT 'Payment records cleared successfully!' as message; 