<?php
require_once '../db.php';
require 'vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$data = json_decode(file_get_contents("php://input"), true);

$reportType = $data['type'] ?? null; // 'academic' or 'fee'
$studentId = $data['student_id'] ?? null;
$fromDate = $data['from_date'] ?? null;
$toDate = $data['to_date'] ?? null;

if (!$reportType || !$studentId) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

if ($reportType === 'academic') {
    // Fetch academic report (marks)
    $sql = "SELECT subject, mark, term, year FROM marks WHERE student_id = ?";
    $params = [$studentId];

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();

    $marks = [];
    while ($row = $result->fetch_assoc()) {
        $marks[] = $row;
    }

    echo json_encode([
        'success' => true,
        'type' => 'academic',
        'student_id' => $studentId,
        'marks' => $marks
    ]);

} elseif ($reportType === 'fee') {
    // Fetch fee report
    $sql = "SELECT amount, date, type FROM payments WHERE student_id = ?";
    $params = [$studentId];

    if ($fromDate && $toDate) {
        $sql .= " AND date BETWEEN ? AND ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iss", $studentId, $fromDate, $toDate);
    } else {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $studentId);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $payments = [];
    while ($row = $result->fetch_assoc()) {
        $payments[] = $row;
    }

    echo json_encode([
        'success' => true,
        'type' => 'fee',
        'student_id' => $studentId,
        'payments' => $payments
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid report type']);
}
?>
