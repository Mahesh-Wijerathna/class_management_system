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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 


CREATE TABLE IF NOT EXISTS hall_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hall_name VARCHAR(100) NOT NULL,
  subject VARCHAR(100),
  class_id INT,
  teacherId VARCHAR(10),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('booked', 'cancelled') DEFAULT 'booked',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hall_date_time (hall_name, date, start_time, end_time),
  INDEX idx_teacherId (teacherId),
  FOREIGN KEY (teacherId) REFERENCES teachers(teacherId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Materials table (core table for all materials)
CREATE TABLE IF NOT EXISTS materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  teacher_id VARCHAR(10) NOT NULL,
  teacher_name VARCHAR(200) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_type ENUM('pdf', 'video', 'document', 'link') DEFAULT 'pdf',
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  original_file_path VARCHAR(500) COMMENT 'Store original before processing',
  is_password_protected BOOLEAN DEFAULT TRUE,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
  is_free BOOLEAN DEFAULT FALSE COMMENT 'Free access without enrollment',
  category VARCHAR(50) DEFAULT 'notes' COMMENT 'notes, assignment, past_paper, video, other',
  download_count INT DEFAULT 0,
  INDEX idx_class (class_id),
  INDEX idx_teacher (teacher_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Material access log (track all student downloads/views)
CREATE TABLE IF NOT EXISTS material_access_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  material_id INT NOT NULL,
  student_id VARCHAR(10) NOT NULL,
  student_name VARCHAR(200),
  access_type ENUM('view', 'download') NOT NULL DEFAULT 'download',
  access_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  watermark_applied BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  INDEX idx_material (material_id),
  INDEX idx_student (student_id),
  INDEX idx_timestamp (access_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Material folders (optional organization)
CREATE TABLE IF NOT EXISTS material_folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  folder_name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_folder_id INT NULL COMMENT 'For nested folders',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_class (class_id),
  FOREIGN KEY (parent_folder_id) REFERENCES material_folders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Link materials to folders (many-to-many)
CREATE TABLE IF NOT EXISTS material_folder_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  material_id INT NOT NULL,
  folder_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES material_folders(id) ON DELETE CASCADE,
  UNIQUE KEY unique_material_folder (material_id, folder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recordings table (main table for all recordings)
CREATE TABLE IF NOT EXISTS recordings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  teacher_id VARCHAR(10) NOT NULL,
  teacher_name VARCHAR(200) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  recording_type ENUM('video', 'audio') DEFAULT 'video',
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT COMMENT 'File size in bytes',
  duration INT COMMENT 'Duration in seconds',
  thumbnail_path VARCHAR(500) COMMENT 'Path to video thumbnail',
  video_quality VARCHAR(20) DEFAULT 'HD' COMMENT '4K, HD, SD, etc',
  mime_type VARCHAR(100) COMMENT 'video/mp4, audio/mpeg, etc',
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('processing', 'ready', 'failed', 'archived', 'deleted') DEFAULT 'ready',
  is_public BOOLEAN DEFAULT FALSE COMMENT 'Public access without enrollment',
  category VARCHAR(50) DEFAULT 'lecture' COMMENT 'lecture, tutorial, lab, review, other',
  view_count INT DEFAULT 0,
  download_count INT DEFAULT 0,
  INDEX idx_class (class_id),
  INDEX idx_teacher (teacher_id),
  INDEX idx_status (status),
  INDEX idx_upload_date (upload_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recording access log (track all student views/downloads)
CREATE TABLE IF NOT EXISTS recording_access_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recording_id INT NOT NULL,
  student_id VARCHAR(10) NOT NULL,
  student_name VARCHAR(200),
  access_type ENUM('view', 'download', 'stream') NOT NULL DEFAULT 'view',
  watch_duration INT DEFAULT 0 COMMENT 'How many seconds watched',
  access_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50) COMMENT 'mobile, desktop, tablet',
  FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE,
  INDEX idx_recording (recording_id),
  INDEX idx_student (student_id),
  INDEX idx_timestamp (access_timestamp),
  INDEX idx_access_type (access_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recording chapters/timestamps (optional - for marking important parts)
CREATE TABLE IF NOT EXISTS recording_chapters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recording_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  timestamp INT NOT NULL COMMENT 'Timestamp in seconds',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE,
  INDEX idx_recording (recording_id),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recording comments/notes (students can add notes at specific timestamps)
CREATE TABLE IF NOT EXISTS recording_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recording_id INT NOT NULL,
  student_id VARCHAR(10) NOT NULL,
  timestamp INT NOT NULL COMMENT 'Timestamp in seconds where note was added',
  note TEXT NOT NULL,
  is_private BOOLEAN DEFAULT TRUE COMMENT 'Private notes vs shared with class',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE,
  INDEX idx_recording (recording_id),
  INDEX idx_student (student_id),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recording watch progress (track where each student stopped watching)
CREATE TABLE IF NOT EXISTS recording_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recording_id INT NOT NULL,
  student_id VARCHAR(10) NOT NULL,
  last_position INT DEFAULT 0 COMMENT 'Last watched position in seconds',
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  is_completed BOOLEAN DEFAULT FALSE,
  last_watched TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_recording (recording_id, student_id),
  FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE,
  INDEX idx_recording (recording_id),
  INDEX idx_student (student_id),
  INDEX idx_completion (completion_percentage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialization complete message
SELECT 'Teacher Database Initialization Complete! All tables created successfully.' AS status;