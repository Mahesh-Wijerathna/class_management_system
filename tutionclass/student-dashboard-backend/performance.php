<?php
require_once 'db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$student_code = $_GET['student_code'] ?? null;

if (!$student_code) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing student_code'
    ]);
    exit;
}


$stmt = $conn->prepare("SELECT id FROM students WHERE student_code = ?");
$stmt->bind_param("s", $student_code);
$stmt->execute();
$result = $stmt->get_result();
$student = $result->fetch_assoc();

if (!$student) {
    echo json_encode([
        'success' => false,
        'message' => 'Student not found'
    ]);
    exit;
}

$student_id = $student['id'];


$query = "
SELECT 
    sub.name AS subject,
    p.exam_name,
    p.exam_date,
    p.marks_obtained,
    p.total_marks,
    p.grade,
    p.remarks
FROM performance p
JOIN subjects sub ON p.subject_id = sub.id
WHERE p.student_id = ?
ORDER BY p.exam_date DESC
";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

$performance = [];

while ($row = $result->fetch_assoc()) {
    $row['percentage'] = ($row['total_marks'] > 0) ? round(($row['marks_obtained'] / $row['total_marks']) * 100, 2) : 0;
    $performance[] = $row;
}

echo json_encode([
    'success' => true,
    'student_code' => $student_code,
    'performance' => $performance
]);

$conn->close();
?>
