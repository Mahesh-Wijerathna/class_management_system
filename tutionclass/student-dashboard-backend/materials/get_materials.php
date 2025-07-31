<?php
require_once '../db.php';

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


$query = "
SELECT m.id, m.title, m.file_path, m.external_link, m.uploaded_at,
       cs.title AS class_name, t.name AS teacher_name
FROM materials m
JOIN class_schedule cs ON m.class_id = cs.id
JOIN teachers t ON m.teacher_id = t.id
JOIN student_classes sc ON cs.id = sc.class_schedule_id
WHERE sc.student_id = ?
ORDER BY m.uploaded_at DESC
";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

$materials = [];
while ($row = $result->fetch_assoc()) {
    
    if ($row['file_path']) {
        $row['file_url'] = "http://localhost/uploads/" . basename($row['file_path']);
    } else {
        $row['file_url'] = null;
    }
    $materials[] = $row;
}

echo json_encode([
    'success' => true,
    'materials' => $materials
]);

$conn->close();
?>
