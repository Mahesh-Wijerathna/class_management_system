-- Teacher Management Database Schema

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS teacher_db;
USE teacher_db;

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacherId VARCHAR(10) UNIQUE NOT NULL,
    designation VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    stream VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Teacher schedules table
CREATE TABLE IF NOT EXISTS teacher_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacherId VARCHAR(10) NOT NULL,
    classId INT,
    day VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    frequency ENUM('weekly', 'bi-weekly', 'monthly') DEFAULT 'weekly',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacherId) REFERENCES teachers(teacherId) ON DELETE CASCADE
);

-- Teacher hall assignments table
CREATE TABLE IF NOT EXISTS teacher_halls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacherId VARCHAR(10) NOT NULL,
    hallId VARCHAR(10) NOT NULL,
    hall_name VARCHAR(100) NOT NULL,
    capacity INT,
    assigned_date DATE NOT NULL,
    status ENUM('assigned', 'available', 'maintenance') DEFAULT 'assigned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacherId) REFERENCES teachers(teacherId) ON DELETE CASCADE
);

-- Insert sample teachers
INSERT INTO teachers (teacherId, designation, name, stream, email, phone, password, status) VALUES
('T001', 'Dr.', 'John Smith', 'A/L-Maths', 'john.smith@example.com', '0712345678', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('T002', 'Prof.', 'Sarah Johnson', 'A/L-Science', 'sarah.johnson@example.com', '0712345679', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('T003', 'Dr.', 'Michael Brown', 'A/L-Art', 'michael.brown@example.com', '0712345680', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('T004', 'Ms.', 'Emily Davis', 'O/L', 'emily.davis@example.com', '0712345681', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('T005', 'Mr.', 'David Wilson', 'A/L-Commerce', 'david.wilson@example.com', '0712345682', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('T006', 'Ms.', 'Lisa Chen', 'Primary', 'lisa.chen@example.com', '0712345683', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('T007', 'Prof.', 'Maria Rodriguez', 'A/L-Technology', 'maria.rodriguez@example.com', '0712345684', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('T008', 'Dr.', 'James Anderson', 'A/L-Maths', 'james.anderson@example.com', '0712345685', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('T009', 'Mr.', 'Alex Kumar', 'A/L-Science', 'alex.kumar@example.com', '0712345686', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('T010', 'Mrs.', 'Sarah Williams', 'O/L', 'sarah.williams@example.com', '0712345687', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('T011', 'Dr.', 'Robert Lee', 'A/L-Art', 'robert.lee@example.com', '0712345688', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('T012', 'Ms.', 'Emma Thompson', 'A/L-Commerce', 'emma.thompson@example.com', '0712345689', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inactive'),
('T013', 'Prof.', 'Thomas Wilson', 'A/L-Technology', 'thomas.wilson@example.com', '0712345690', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('T014', 'Dr.', 'Amanda Foster', 'Primary', 'amanda.foster@example.com', '0712345691', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'); 