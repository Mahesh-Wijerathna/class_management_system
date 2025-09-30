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


CREATE TABLE IF NOT EXISTS hall_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hall_name VARCHAR(100) NOT NULL,
  subject VARCHAR(100),
  class_id INT,
  teacherId VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('booked', 'cancelled') DEFAULT 'booked',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacherId) REFERENCES teachers(teacherId) ON DELETE SET NULL,
);