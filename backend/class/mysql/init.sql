-- PayHere Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'LKR',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Sri Lanka',
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'payhere',
    payhere_payment_id VARCHAR(100) NULL,
    payhere_status_code VARCHAR(10) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    teacher VARCHAR(100) NOT NULL,
    teacher_id VARCHAR(50),
    stream VARCHAR(50) NOT NULL,
    delivery_method ENUM('online', 'physical', 'hybrid', 'other') NOT NULL,
    delivery_other VARCHAR(100),
    schedule_day VARCHAR(20) NOT NULL,
    schedule_start_time TIME NOT NULL,
    schedule_end_time TIME NOT NULL,
    schedule_frequency ENUM('weekly', 'bi-weekly', 'monthly') NOT NULL DEFAULT 'weekly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_students INT NOT NULL DEFAULT 50,
    fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_tracking JSON,
    payment_tracking_free_days INT DEFAULT 7,
    zoom_link TEXT,
    description TEXT,
    course_type ENUM('theory', 'revision') NOT NULL DEFAULT 'theory',
    revision_discount_price DECIMAL(10,2) DEFAULT 0.00,
    related_theory_id INT,
    status ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
    current_students INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_course_type (course_type),
    INDEX idx_delivery_method (delivery_method),
    INDEX idx_stream (stream),
    INDEX idx_teacher (teacher),
    FOREIGN KEY (related_theory_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- Add PayHere specific columns to existing financial_records table if needed
ALTER TABLE financial_records 
ADD COLUMN IF NOT EXISTS payhere_order_id VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS payhere_payment_id VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS payhere_status VARCHAR(20) NULL;

-- Add indexes for better performance
ALTER TABLE financial_records 
ADD INDEX IF NOT EXISTS idx_payhere_order_id (payhere_order_id),
ADD INDEX IF NOT EXISTS idx_payhere_payment_id (payhere_payment_id); 