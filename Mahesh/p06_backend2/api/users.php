<?php
header("Content-Type: application/json");
require_once '../db_config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';

    if (!$name || !$email) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing name or email']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO users (name, email) VALUES (?, ?)");
    $stmt->execute([$name, $email]);

    echo json_encode(['message' => 'User added successfully']);
}
