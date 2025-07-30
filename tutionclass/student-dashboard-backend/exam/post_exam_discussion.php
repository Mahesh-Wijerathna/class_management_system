<?php
require_once '../db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

$data = json_decode(file_get_contents("php://input"), true);

$exam_id = $data['exam_id'] ?? null;
$student_code = $data['student_code'] ?? null;
$message = $data['message'] ?? null;

if (!$exam_id || !$student_code || !$message) {
    echo json_encode(['success' => false, 'message' => 'Missing fields']);
    exit;
}

// Get student_id
$stmt = $conn->prepare("SELECT id FROM students WHERE student_code = ?");
$stmt->bind_param("s", $student_code);
$stmt->execute();
$result = $stmt->get_result();
$student = $result->fetch_assoc();

if (!$student) {
    echo json_encode(['success' => false, 'message' => 'Student not found']);
    exit;
}
$student_id = $student['id'];

// Insert discussion
$stmt = $conn->prepare("INSERT INTO exam_discussions (exam_id, student_id, message) VALUES (?, ?, ?)");
$stmt->bind_param("iis", $exam_id, $student_id, $message);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Discussion posted successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to post message']);
}
?>
