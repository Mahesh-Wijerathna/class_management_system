<!-- View Grades & Reports -->

<?php
require_once '../db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$student_id = $_GET['student_id'] ?? null;

if (!$student_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing student_id']);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT s.name AS student_name, c.name AS class_name, g.subject, g.marks, g.grade
                            FROM grades g
                            JOIN students s ON g.student_id = s.id
                            JOIN classes c ON g.class_id = c.id
                            WHERE g.student_id = ?");
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $grades = [];

    while ($row = $result->fetch_assoc()) {
        $grades[] = $row;
    }

    echo json_encode([
        'success' => true,
        'student_id' => $student_id,
        'grades' => $grades
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error fetching grades', 'error' => $e->getMessage()]);
}

$conn->close();
