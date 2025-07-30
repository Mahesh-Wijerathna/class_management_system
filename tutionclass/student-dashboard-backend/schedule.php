<?php
require_once 'db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$student_code = $_GET['student_code'] ?? null;
$view = $_GET['view'] ?? 'daily'; 

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

$query = "SELECT sub.name AS subject, cs.date, cs.time_start, cs.time_end, cs.hall
          FROM class_schedule cs
          JOIN student_subject ss ON cs.subject_id = ss.subject_id
          JOIN subjects sub ON cs.subject_id = sub.id
          WHERE ss.student_id = ?";

if ($view === 'daily') {
    $query .= " AND cs.date = CURDATE()";
} elseif ($view === 'weekly') {
    $query .= " AND cs.date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)";
}

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

$schedules = [];
while ($row = $result->fetch_assoc()) {
    $schedules[] = $row;
}

echo json_encode(['success' => true, 'schedules' => $schedules]);
$conn->close();
?>
