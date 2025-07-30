<?php
session_start();
header('Content-Type: application/json');

require 'db_connect.php'; // Your database connection file

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? null;

if ($token) {
    $stmt = $conn->prepare("SELECT id, fullname, email, role FROM users WHERE remember_token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['email'];
        $_SESSION['fullname'] = $user['fullname'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['logged_in'] = true;
        
        echo json_encode([
            'success' => true,
            'redirect' => $user['role'] === 'admin' ? 'admin_dashboard.php' : 'dashboard.php'
        ]);
        exit;
    }
}

echo json_encode(['success' => false]);
?>