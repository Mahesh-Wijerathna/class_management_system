<?php
require_once '../db.php';


header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, PUT');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}

$student_id = $input['student_id'] ?? null;
$class_id = $input['class_id'] ?? null;
$date = $input['date'] ?? date('Y-m-d');
$status = $input['status'] ?? null; // 'present', 'absent', 'late'

if (!$student_id || !$class_id || !$status) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Required fields: student_id, class_id, status']);
    exit;
}

try {
    if ($method === 'POST') {
        // Insert new attendance
        $stmt = $conn->prepare("INSERT INTO attendance (student_id, class_id, date, status)
                                VALUES (?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE status = VALUES(status)");
        $stmt->bind_param("iiss", $student_id, $class_id, $date, $status);
        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Attendance marked/updated']);
    } elseif ($method === 'PUT') {
        // Update existing attendance
        $stmt = $conn->prepare("UPDATE attendance SET status = ? WHERE student_id = ? AND class_id = ? AND date = ?");
        $stmt->bind_param("siis", $status, $student_id, $class_id, $date);
        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Attendance updated']);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}

$conn->close();
