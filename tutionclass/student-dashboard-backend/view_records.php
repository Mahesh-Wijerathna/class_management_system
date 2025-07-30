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


$query_att = "
SELECT cs.title AS class_title, cs.date, cs.start_time, cs.end_time, att.status
FROM attendance att
JOIN class_schedule cs ON att.class_schedule_id = cs.id
WHERE att.student_id = ?
ORDER BY cs.date DESC
";
$stmt_att = $conn->prepare($query_att);
$stmt_att->bind_param("i", $student_id);
$stmt_att->execute();
$res_att = $stmt_att->get_result();
$attendance = [];
while ($row = $res_att->fetch_assoc()) {
    $attendance[] = $row;
}


$query_perf = "
SELECT sub.name AS subject_name, p.exam_name, p.exam_date, p.marks_obtained, p.total_marks, p.grade
FROM performance p
JOIN subjects sub ON p.subject_id = sub.id
WHERE p.student_id = ?
ORDER BY p.exam_date DESC
";
$stmt_perf = $conn->prepare($query_perf);
$stmt_perf->bind_param("i", $student_id);
$stmt_perf->execute();
$res_perf = $stmt_perf->get_result();
$performance = [];
while ($row = $res_perf->fetch_assoc()) {
    $row['percentage'] = ($row['total_marks'] > 0) ? round(($row['marks_obtained'] / $row['total_marks']) * 100, 2) : 0;
    $performance[] = $row;
}


echo json_encode([
    'success' => true,
    'student_code' => $student_code,
    'attendance_records' => $attendance,
    'performance_records' => $performance
]);

$conn->close();
?>
