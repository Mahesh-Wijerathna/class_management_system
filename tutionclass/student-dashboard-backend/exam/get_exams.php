<?php
require_once '../db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

$student_code = $_GET['student_code'] ?? null;

if (!$student_code) {
    echo json_encode(['success' => false, 'message' => 'Missing student_code']);
    exit;
}


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
SELECT e.id, e.title, e.exam_date, e.start_time, e.end_time, e.location, cs.title AS class_name
FROM exams e
JOIN class_schedule cs ON e.class_schedule_id = cs.id
JOIN student_classes sc ON cs.id = sc.class_schedule_id
WHERE sc.student_id = ?
ORDER BY e.exam_date ASC";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

$exams = [];
while ($row = $result->fetch_assoc()) {
    $exams[] = $row;
}

echo json_encode(['success' => true, 'exams' => $exams]);
?>
