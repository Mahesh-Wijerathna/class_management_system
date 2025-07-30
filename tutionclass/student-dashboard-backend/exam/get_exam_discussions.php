<?php
require_once '../db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

$exam_id = $_GET['exam_id'] ?? null;

if (!$exam_id) {
    echo json_encode(['success' => false, 'message' => 'Missing exam_id']);
    exit;
}

$stmt = $conn->prepare("
SELECT ed.id, s.name AS student_name, ed.message, ed.created_at
FROM exam_discussions ed
JOIN students s ON ed.student_id = s.id
WHERE ed.exam_id = ?
ORDER BY ed.created_at ASC
");
$stmt->bind_param("i", $exam_id);
$stmt->execute();
$result = $stmt->get_result();

$discussions = [];
while ($row = $result->fetch_assoc()) {
    $discussions[] = $row;
}

echo json_encode(['success' => true, 'discussions' => $discussions]);
?>
