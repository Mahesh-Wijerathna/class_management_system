<?php
$host = 'db';
$db   = 'myapp';
$user = 'myuser';
$pass = 'mypass';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
