<?php

// // Database configuration
// define('DB_HOST', 'teacher-mysql');
// define('DB_USER', 'root');
// define('DB_PASS', 'password');
// define('DB_NAME', 'teacher_db');

// // JWT configuration
// define('JWT_SECRET', 'your-secret-key-here');
// define('JWT_ALGORITHM', 'HS256');
// define('JWT_EXPIRY', 3600); // 1 hour

// // CORS configuration
// define('ALLOWED_ORIGINS', ['http://localhost:3000', 'http://127.0.0.1:3000']); 


// Database configuration
define('DB_HOST', 'teacher-mysql'); 
define('DB_USER', 'root');
define('DB_PASS', 'password');
define('DB_NAME', 'teacher_db');

// JWT configuration
define('JWT_SECRET', 'your-secret-key-here');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRY', 3600); // 1 hour

// CORS configuration
define('ALLOWED_ORIGINS', ['http://localhost:3000', 'http://127.0.0.1:3000']); 

// Error reporting - enable while debugging local 500s. Remove or set to 0 in production.
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// Also log PHP errors to a file for investigation
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_error.log');

// Create MySQL connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}