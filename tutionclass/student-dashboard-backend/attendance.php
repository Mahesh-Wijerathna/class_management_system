<?php
require_once 'db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$student_code = $_GET['student_code'] ?? null;

if (!$student_code) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing student_code']);
    exit;
}

// Get student ID
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

$query = "
SELECT sub.name AS subject, cs.date, cs.time_start, cs.time_end, cs.hall, att.status
FROM attendance att
JOIN class_schedule cs ON att.class_schedule_id = cs.id
JOIN subjects sub ON cs.subject_id = sub.id
WHERE att.student_id = ?
ORDER BY cs.date DESC
";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

$records = [];
while ($row = $result->fetch_assoc()) {
    $records[] = $row;
}

echo json_encode(['success' => true, 'attendance' => $records]);
$conn->close();
?>
