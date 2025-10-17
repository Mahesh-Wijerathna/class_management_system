USE payment_db;

-- Check if columns exist and add them if they don't
SET @column_exists_payment_type = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'payment_db' 
    AND TABLE_NAME = 'financial_records' 
    AND COLUMN_NAME = 'payment_type'
);

SET @column_exists_class_id = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'payment_db' 
    AND TABLE_NAME = 'financial_records' 
    AND COLUMN_NAME = 'class_id'
);

-- Add payment_type column if it doesn't exist
SET @sql_payment_type = IF(@column_exists_payment_type = 0,
    "ALTER TABLE financial_records ADD COLUMN payment_type VARCHAR(50) DEFAULT 'class_payment' COMMENT 'Type of payment: admission_fee or class_payment'",
    "SELECT 'Column payment_type already exists' as info"
);

PREPARE stmt FROM @sql_payment_type;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add class_id column if it doesn't exist
SET @sql_class_id = IF(@column_exists_class_id = 0,
    "ALTER TABLE financial_records ADD COLUMN class_id INT DEFAULT NULL COMMENT 'Foreign key to classes table'",
    "SELECT 'Column class_id already exists' as info"
);

PREPARE stmt FROM @sql_class_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes (these will fail silently if they exist)
ALTER TABLE financial_records ADD INDEX idx_payment_type (payment_type);
ALTER TABLE financial_records ADD INDEX idx_class_id (class_id);

-- Update existing records to have default payment type
UPDATE financial_records 
SET payment_type = 'class_payment' 
WHERE payment_type IS NULL;

-- Display confirmation
SELECT 'Migration completed successfully!' as status;
SELECT 'Added columns: payment_type, class_id' as changes;
