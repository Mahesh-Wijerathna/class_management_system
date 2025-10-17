-- Class Backend Database Initialization (Clean Version)
-- This contains only class and enrollment-related tables

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    teacher VARCHAR(100) NOT NULL,
    teacher_id VARCHAR(50),
    stream VARCHAR(50) NOT NULL,
    delivery_method ENUM('online', 'physical', 'hybrid1', 'hybrid2', 'hybrid3', 'hybrid4') NOT NULL,
    delivery_other VARCHAR(100),
    schedule_day VARCHAR(20),
    schedule_start_time TIME,
    schedule_end_time TIME,
    schedule_frequency ENUM('weekly', 'bi-weekly', 'monthly', 'no-schedule') NOT NULL DEFAULT 'weekly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_students INT NOT NULL DEFAULT 50,
    fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_tracking JSON,
    payment_tracking_free_days INT DEFAULT 7,
    zoom_link TEXT,
    video_url TEXT,
    description TEXT,
    course_type ENUM('theory', 'revision') NOT NULL DEFAULT 'theory',
    revision_discount_price DECIMAL(10,2) DEFAULT 0.00,
    related_theory_id INT,
    status ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
    current_students INT DEFAULT 0,
    enable_tute_collection BOOLEAN DEFAULT FALSE,
    tute_collection_type ENUM('speed_post', 'physical_class', 'both') DEFAULT 'speed_post',
    speed_post_fee DECIMAL(10,2) DEFAULT 300.00,
    class_medium ENUM('Sinhala', 'English', 'Both') DEFAULT 'Sinhala',
    enable_new_window_join BOOLEAN DEFAULT TRUE,
    enable_overlay_join BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_course_type (course_type),
    INDEX idx_delivery_method (delivery_method),
    INDEX idx_stream (stream),
    INDEX idx_teacher (teacher),
    INDEX idx_tute_collection (enable_tute_collection),
    INDEX idx_tute_collection_type (tute_collection_type),
    INDEX idx_class_medium (class_medium),
    FOREIGN KEY (related_theory_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL,
    class_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'completed', 'dropped', 'suspended') DEFAULT 'active',
    payment_status ENUM('pending', 'paid', 'partial', 'overdue') DEFAULT 'pending',
    total_fee DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    next_payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, class_id),
    INDEX idx_student (student_id),
    INDEX idx_class (class_id),
    INDEX idx_payment_status (payment_status)
);



