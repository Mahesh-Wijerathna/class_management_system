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

// $conn = new mysqli('localhost', 'teacher_db', 'password', 'teacher_db');
// if ($conn->connect_error) {
//     die("Connection failed: " . $conn->connect_error);
// }



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

// Create MySQL connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}