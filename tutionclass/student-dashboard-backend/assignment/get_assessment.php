<?php
require_once '../db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$assessment_id = $_GET['assessment_id'] ?? null;

if (!$assessment_id) {
    echo json_encode(['success' => false, 'message' => 'Missing assessment_id']);
    exit;
}

$query = "
SELECT a.title, a.subject_id, q.id AS question_id, q.question_text,
       q.option_a, q.option_b, q.option_c, q.option_d
FROM assessments a
JOIN assessment_questions q ON a.id = q.assessment_id
WHERE a.id = ?
";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $assessment_id);
$stmt->execute();
$result = $stmt->get_result();

$questions = [];

while ($row = $result->fetch_assoc()) {
    $questions[] = $row;
}

echo json_encode([
    'success' => true,
    'assessment_id' => $assessment_id,
    'questions' => $questions
]);

$conn->close();
?>
