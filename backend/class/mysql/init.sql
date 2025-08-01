
CREATE DATABASE IF NOT EXISTS class_db;
USE class_db;

-- DROP DATABASE IF EXISTS class_db;

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
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
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

-- Session schedules table for individual class sessions
CREATE TABLE IF NOT EXISTS session_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    teacher VARCHAR(100) NOT NULL,
    teacher_id VARCHAR(50) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    delivery_method ENUM('online', 'physical', 'hybrid', 'other') NOT NULL,
    delivery_other VARCHAR(100),
    zoom_link TEXT,
    hall VARCHAR(50),
    status ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    created_by VARCHAR(50) NOT NULL, -- teacher_id who created the session
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_session_date (session_date),
    INDEX idx_status (status),
    INDEX idx_class_id (class_id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

