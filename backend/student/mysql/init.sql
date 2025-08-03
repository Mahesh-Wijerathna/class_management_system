CREATE DATABASE IF NOT EXISTS student_db;
USE student_db;

CREATE TABLE IF NOT EXISTS students (
    user_id VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    nic VARCHAR(20) NOT NULL UNIQUE,
    mobile_number VARCHAR(15) NOT NULL,
    date_of_birth DATE NOT NULL,
    age INT NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    school VARCHAR(100),
    stream VARCHAR(50),
    address VARCHAR(255),
    district VARCHAR(50),
    parent_name VARCHAR(100),
    parent_mobile_number VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
