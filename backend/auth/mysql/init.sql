-- Create users table
CREATE TABLE IF NOT EXISTS users (
    userid VARCHAR(10) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin', 'cashier') NOT NULL,
    name VARCHAR(255) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(15) DEFAULT NULL,
    otp VARCHAR(6) DEFAULT NULL,
    otp_created_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userid VARCHAR(10) NOT NULL,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    nic VARCHAR(20),
    gender ENUM('Male', 'Female'),
    age INT,
    email VARCHAR(255),
    mobile VARCHAR(15) NOT NULL,
    parentName VARCHAR(200),
    parentMobile VARCHAR(15),
    stream VARCHAR(50),
    dateOfBirth DATE,
    school VARCHAR(200),
    address TEXT,
    district VARCHAR(100),
    dateJoined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
);



-- Create refresh_tokens table for secure token management
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userid VARCHAR(10) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);

-- Create login_attempts table for rate limiting and security
CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userid VARCHAR(10) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT 0,
    ip_address VARCHAR(45) NOT NULL,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    INDEX idx_userid_time (userid, attempt_time),
    INDEX idx_ip_time (ip_address, attempt_time)
);

-- Create barcodes table for storing barcode information
CREATE TABLE IF NOT EXISTS barcodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userid VARCHAR(10) NOT NULL UNIQUE,
    barcode_data VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    INDEX idx_userid (userid),
    INDEX idx_created_at (created_at)
);
