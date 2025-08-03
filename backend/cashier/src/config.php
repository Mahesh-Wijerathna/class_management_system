<?php
// src/config.php
$host = getenv('DB_HOST') ?: 'localhost';
$db   = getenv('DB_NAME') ?: 'cashier_db';
$user = getenv('DB_USER') ?: 'cashieruser';
$pass = getenv('DB_PASSWORD') ?: 'cashierpass';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}
?> 