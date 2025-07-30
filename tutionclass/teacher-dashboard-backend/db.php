<?php
$servername = "127.0.0.1:3307";
$username = "root";
$password = "";
$dbname = "tuition_center_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database error']));
}
?>
