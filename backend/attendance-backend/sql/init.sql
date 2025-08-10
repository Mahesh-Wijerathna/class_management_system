CREATE DATABASE attendance_system;

USE attendance_system;

CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    time_stamp DATETIME NOT NULL,
    INDEX idx_user_class_time (user_id, class_id, time_stamp)
);