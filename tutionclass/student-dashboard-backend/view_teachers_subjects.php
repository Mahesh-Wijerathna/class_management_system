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

// Fetch subjects and teachers linked to student's classes
$query = "
SELECT DISTINCT s.name AS subject_name, t.name AS teacher_name, t.email, t.mobile,
       cs.title AS class_title, cs.date, cs.start_time, cs.end_time
FROM student_classes sc
JOIN class_schedule cs ON sc.class_schedule_id = cs.id
JOIN subjects s ON cs.class_id = s.id
JOIN teachers t ON t.subject_id = s.id
WHERE sc.student_id = ?
ORDER BY s.name
";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode(['success' => true, 'teachers_subjects' => $data]);
$conn->close();
?>
