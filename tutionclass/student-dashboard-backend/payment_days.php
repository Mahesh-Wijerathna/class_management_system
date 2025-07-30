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

$query = "
SELECT c.title AS class_name, p.amount, p.due_date, p.status, p.paid_at
FROM payments p
JOIN class_schedule c ON p.class_id = c.id
WHERE p.student_id = ?
ORDER BY p.due_date ASC
";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

$payments = [];
while ($row = $result->fetch_assoc()) {
    
    if ($row['status'] === 'Pending' && strtotime($row['due_date']) < time()) {
        $row['status'] = 'Overdue';
    }
    $payments[] = $row;
}

echo json_encode(['success' => true, 'payments' => $payments]);
$conn->close();
?>
