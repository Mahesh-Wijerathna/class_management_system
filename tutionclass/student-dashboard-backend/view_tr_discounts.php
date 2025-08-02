<?php
require_once 'db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Filters
$grade = $_GET['grade'] ?? null;
$subject = $_GET['subject'] ?? null;
$today = date('Y-m-d');

$sql = "SELECT * FROM theory_revision_discounts WHERE valid_from <= ? AND valid_to >= ?";
$params = [$today, $today];
$types = "ss";

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
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$discounts = [];
while ($row = $result->fetch_assoc()) {
    $discounts[] = $row;
}

echo json_encode(['success' => true, 'tr_discounts' => $discounts]);
$conn->close();
?>
