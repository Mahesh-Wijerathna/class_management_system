<?php
require_once 'db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Optional filters
$grade = $_GET['grade'] ?? null;
$subject = $_GET['subject'] ?? null;

$sql = "SELECT * FROM tute_delivery_charges WHERE 1=1";
$params = [];
$types = "";

if ($grade) {
    $sql .= " AND grade = ?";
    $params[] = $grade;
    $types .= "s";
}
if ($subject) {
    $sql .= " AND subject = ?";
    $params[] = $subject;
    $types .= "s";
}

$stmt = $conn->prepare($sql);
if ($params) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$charges = [];
while ($row = $result->fetch_assoc()) {
    $charges[] = $row;
}

echo json_encode(['success' => true, 'tute_charges' => $charges]);
$conn->close();
?>
