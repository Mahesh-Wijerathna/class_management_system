<?php
require_once '../db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$teacher_id = $data['teacher_id'] ?? null;
$class_id = $data['class_id'] ?? null;
$student_id = $data['student_id'] ?? null; // Optional - if sending to specific student
$message = $data['message'] ?? null;
$type = $data['type'] ?? 'announcement'; // default type
$sent_at = date('Y-m-d H:i:s');

if (!$teacher_id || !$message || (!$class_id && !$student_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

try {
    $stmt = $conn->prepare("INSERT INTO messages (teacher_id, class_id, student_id, message, type, sent_at) 
                            VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("iiisss", $teacher_id, $class_id, $student_id, $message, $type, $sent_at);
    $stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Message sent successfully'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to send message', 'error' => $e->getMessage()]);
}

$conn->close();
