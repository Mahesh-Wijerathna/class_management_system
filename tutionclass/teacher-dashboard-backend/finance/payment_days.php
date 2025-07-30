<?php
require_once '../db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$teacher_id = $_GET['teacher_id'] ?? null;

if (!$teacher_id) {
    echo json_encode(['success' => false, 'message' => 'Teacher ID is required']);
    exit;
}

try {
    $sql = "SELECT p.id, s.name AS student_name, c.name AS class_name, p.due_date, p.amount, p.status
            FROM payments p
            JOIN students s ON p.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            WHERE c.teacher_id = ? AND p.status != 'Paid'
            ORDER BY p.due_date ASC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $teacher_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode(['success' => true, 'payments' => $data]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error fetching payment due dates']);
}
?>
