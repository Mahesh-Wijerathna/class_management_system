
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

-- Insert sample data
INSERT INTO classes (
    class_name, subject, teacher, teacher_id, stream, delivery_method, 
    schedule_day, schedule_start_time, schedule_end_time, schedule_frequency,
    start_date, end_date, max_students, fee, zoom_link, description, 
    course_type, status, current_students
) VALUES
('Advanced Mathematics', 'Mathematics', 'Dr. John Smith', 'T001', 'A/L-Maths', 'online', 
 'monday', '10:00:00', '12:00:00', 'weekly',
 '2024-01-15', '2024-06-30', 30, 8000.00, 'https://zoom.us/j/123456789', 'Advanced mathematics course covering calculus and algebra', 
 'theory', 'active', 15),

('Physics Fundamentals', 'Physics', 'Prof. Sarah Johnson', 'T002', 'A/L-Science', 'hybrid', 
 'tuesday', '14:00:00', '16:00:00', 'weekly',
 '2024-01-20', '2024-07-15', 25, 7500.00, 'https://zoom.us/j/987654321', 'Comprehensive physics course with practical experiments', 
 'theory', 'active', 12),

('Chemistry Lab', 'Chemistry', 'Dr. Michael Brown', 'T003', 'A/L-Science', 'physical', 
 'wednesday', '09:00:00', '11:00:00', 'bi-weekly',
 '2024-02-01', '2024-08-31', 20, 6000.00, NULL, 'Hands-on chemistry laboratory sessions', 
 'theory', 'active', 8),

('English Literature', 'English', 'Ms. Emily Davis', 'T004', 'A/L-Art', 'online', 
 'thursday', '13:00:00', '15:00:00', 'weekly',
 '2024-01-25', '2024-06-20', 35, 5000.00, 'https://zoom.us/j/456789123', 'Classic literature analysis and creative writing', 
 'theory', 'active', 22),

('Mathematics Revision', 'Mathematics', 'Dr. John Smith', 'T001', 'A/L-Maths', 'online', 
 'friday', '16:00:00', '18:00:00', 'weekly',
 '2024-03-01', '2024-05-31', 40, 4000.00, 'https://zoom.us/j/789123456', 'Revision sessions for mathematics exam preparation', 
 'revision', 'active', 18),

('Physics Revision', 'Physics', 'Prof. Sarah Johnson', 'T002', 'A/L-Science', 'hybrid', 
 'saturday', '10:00:00', '12:00:00', 'bi-weekly',
 '2024-03-15', '2024-06-30', 30, 3500.00, 'https://zoom.us/j/321654987', 'Intensive physics revision for final exams', 
 'revision', 'active', 15);
