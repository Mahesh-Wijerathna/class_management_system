<?php

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