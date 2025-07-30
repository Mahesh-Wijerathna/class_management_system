<?php
require_once '../db.php';

$studentId = $_GET['student_id'] ?? null;
$reportType = $_GET['type'] ?? 'academic';

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="report.csv"');

$output = fopen("php://output", "w");

if ($reportType === 'academic') {
    fputcsv($output, ['Subject', 'Mark', 'Term', 'Year']);
    $stmt = $conn->prepare("SELECT subject, mark, term, year FROM marks WHERE student_id = ?");
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        fputcsv($output, $row);
    }
}

fclose($output);
?>
