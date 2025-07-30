<?php
require_once '../db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Authenticate teacher
$headers = apache_request_headers();
$authToken = $headers['Authorization'] ?? '';

if (!$authToken) {
    echo json_encode(['success' => false, 'message' => 'Missing authorization token']);
    exit;
}

// Verify token and get teacher_id
$teacherId = null;
$tokenQuery = $conn->prepare("SELECT id FROM teachers WHERE token = ?");
$tokenQuery->bind_param("s", $authToken);
$tokenQuery->execute();
$tokenQuery->bind_result($teacherId);
$tokenQuery->fetch();
$tokenQuery->close();

if (!$teacherId) {
    echo json_encode(['success' => false, 'message' => 'Invalid token']);
    exit;
}

// Get student data for classes taught by this teacher
$sql = "
    SELECT s.id, s.name, s.email, s.class, s.fee_status
    FROM students s
    INNER JOIN classes c ON s.class = c.class_name
    WHERE c.teacher_id = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $teacherId);
$stmt->execute();
$result = $stmt->get_result();

$students = [];
while ($row = $result->fetch_assoc()) {
    $students[] = $row;
}

echo json_encode([
    'success' => true,
    'teacher_id' => $teacherId,
    'students' => $students
]);
?>
