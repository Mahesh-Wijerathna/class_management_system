-- Create cashier_db database
CREATE DATABASE IF NOT EXISTS `cashier_db`;
USE `cashier_db`;

-- Create payments table
CREATE TABLE IF NOT EXISTS `payments` (
    `id` int NOT NULL AUTO_INCREMENT,
    `payment_id` varchar(20) NOT NULL UNIQUE,
    `student_id` varchar(10) NOT NULL,
    `student_name` varchar(200) NOT NULL,
    `class_id` varchar(10) NOT NULL,
    `class_name` varchar(200) NOT NULL,
    `amount` decimal(10,2) NOT NULL,
    `payment_type` enum('class_fee','study_pack','other') NOT NULL,
    `payment_method` enum('cash','card','bank_transfer','online') NOT NULL,
    `status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
    `receipt_number` varchar(20) NOT NULL UNIQUE,
    `cashier_id` varchar(10) NOT NULL,
    `cashier_name` varchar(200) NOT NULL,
    `notes` text,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_student_id` (`student_id`),
    KEY `idx_class_id` (`class_id`),
    KEY `idx_cashier_id` (`cashier_id`),
    KEY `idx_payment_date` (`created_at`),
    KEY `idx_status` (`status`)
);

-- Create financial_records table
CREATE TABLE IF NOT EXISTS `financial_records` (
    `id` int NOT NULL AUTO_INCREMENT,
    `record_id` varchar(20) NOT NULL UNIQUE,
    `type` enum('income','expense','refund') NOT NULL,
    `category` varchar(100) NOT NULL,
    `description` text NOT NULL,
    `amount` decimal(10,2) NOT NULL,
    `cashier_id` varchar(10) NOT NULL,
    `cashier_name` varchar(200) NOT NULL,
    `reference_id` varchar(20),
    `reference_type` varchar(50),
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_cashier_id` (`cashier_id`),
    KEY `idx_type` (`type`),
    KEY `idx_category` (`category`),
    KEY `idx_date` (`created_at`)
);

-- Create student_records table (for cashier's view)
CREATE TABLE IF NOT EXISTS `student_records` (
    `id` int NOT NULL AUTO_INCREMENT,
    `student_id` varchar(10) NOT NULL UNIQUE,
    `name` varchar(200) NOT NULL,
    `email` varchar(255),
    `phone` varchar(15),
    `address` text,
    `emergency_contact` varchar(15),
    `emergency_contact_name` varchar(200),
    `total_payments` decimal(10,2) DEFAULT 0.00,
    `total_classes` int DEFAULT 0,
    `last_payment_date` timestamp NULL,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_email` (`email`),
    KEY `idx_phone` (`phone`)
);

-- Create cashier_sessions table
CREATE TABLE IF NOT EXISTS `cashier_sessions` (
    `id` int NOT NULL AUTO_INCREMENT,
    `session_id` varchar(50) NOT NULL UNIQUE,
    `cashier_id` varchar(10) NOT NULL,
    `cashier_name` varchar(200) NOT NULL,
    `login_time` timestamp DEFAULT CURRENT_TIMESTAMP,
    `logout_time` timestamp NULL,
    `total_transactions` int DEFAULT 0,
    `total_amount` decimal(10,2) DEFAULT 0.00,
    `status` enum('active','ended') DEFAULT 'active',
    PRIMARY KEY (`id`),
    KEY `idx_cashier_id` (`cashier_id`),
    KEY `idx_session_id` (`session_id`),
    KEY `idx_status` (`status`)
);

 