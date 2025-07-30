<?php
require_once '../db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$data = json_decode(file_get_contents("php://input"), true);

$student_code = $data['student_code'] ?? null;
$assessment_id = $data['assessment_id'] ?? null;
$answers = $data['answers'] ?? [];

if (!$student_code || !$assessment_id || empty($answers)) {
    echo json_encode(['success' => false, 'message' => 'Missing data']);
    exit;
}

// Get student ID
$stmt = $conn->prepare("SELECT id FROM students WHERE student_code = ?");
$stmt->bind_param("s", $student_code);
$stmt->execute();
$res = $stmt->get_result();
$student = $res->fetch_assoc();

if (!$student) {
    echo json_encode(['success' => false, 'message' => 'Invalid student']);
    exit;
}

$student_id = $student['id'];
$score = 0;

// Compare answers
foreach ($answers as $ans) {
    $qid = $ans['question_id'];
    $selected = $ans['selected_option'];

    $qstmt = $conn->prepare("SELECT correct_option FROM assessment_questions WHERE id = ?");
    $qstmt->bind_param("i", $qid);
    $qstmt->execute();
    $qres = $qstmt->get_result()->fetch_assoc();

    if ($qres && $qres['correct_option'] === $selected) {
        $score++;
    }
}

// Insert into assessment_submissions
$stmt = $conn->prepare("INSERT INTO assessment_submissions (student_id, assessment_id, score) VALUES (?, ?, ?)");
$stmt->bind_param("iii", $student_id, $assessment_id, $score);
$stmt->execute();
$submission_id = $conn->insert_id;

// Insert answers
foreach ($answers as $ans) {
    $qid = $ans['question_id'];
    $selected = $ans['selected_option'];

    $astmt = $conn->prepare("INSERT INTO assessment_answers (submission_id, question_id, selected_option) VALUES (?, ?, ?)");
    $astmt->bind_param("iis", $submission_id, $qid, $selected);
    $astmt->execute();
}

echo json_encode([
    'success' => true,
    'message' => 'Assessment submitted successfully',
    'score' => $score
]);

$conn->close();
?>
