-- Payment Backend Database Initialization
-- This contains only payment-related tables

-- PayHere Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'LKR',
    status ENUM('pending', 'paid', 'cancelled', 'failed') DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'payhere',
    payhere_payment_id VARCHAR(100) NULL,
    student_id VARCHAR(50) NOT NULL,
    class_id INT NOT NULL,
    enrollment_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_status (status)
);

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    class_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_student_id (student_id),
    INDEX idx_payment_date (payment_date)
);

-- Financial records table (updated to match PaymentController expectations)
CREATE TABLE IF NOT EXISTS financial_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    person_name VARCHAR(100) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    person_role VARCHAR(50) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    class_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'cancelled', 'failed') DEFAULT 'pending',
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    notes TEXT,
    delivery_status ENUM('pending', 'processing', 'delivered') DEFAULT 'pending',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_user_id (user_id),
    INDEX idx_class_id (class_id),
    INDEX idx_status (status),
    INDEX idx_delivery_status (delivery_status)
);

-- Class Earnings Configuration Table
-- Stores per-class earnings configuration including teacher dashboard access and revenue split settings
CREATE TABLE IF NOT EXISTS class_earnings_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    show_detailed_view BOOLEAN DEFAULT FALSE,
    earnings_mode BOOLEAN DEFAULT FALSE,
    enable_teacher_dashboard BOOLEAN DEFAULT FALSE,
    hall_rent_percentage DECIMAL(5,2) DEFAULT 30.00,
    payhere_percentage DECIMAL(5,2) DEFAULT 3.00,
    other_expenses JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_class (class_id),
    INDEX idx_class_id (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores per-class earnings configuration including teacher dashboard access and revenue split settings';
