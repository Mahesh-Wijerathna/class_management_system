<?php
require_once 'db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
   
    $data = json_decode(file_get_contents("php://input"), true);
    $student_code = $data['student_code'] ?? null;
    $reason = $data['reason'] ?? null;

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

   
    $stmt = $conn->prepare("INSERT INTO forget_card_requests (student_id, reason) VALUES (?, ?)");
    $stmt->bind_param("is", $student_id, $reason);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Request submitted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to submit request']);
    }

} elseif ($method === 'GET') {
    
    $student_code = $_GET['student_code'] ?? null;

    if (!$student_code) {
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

 
    $stmt = $conn->prepare("SELECT id, reason, status, request_date, processed_date FROM forget_card_requests WHERE student_id = ? ORDER BY request_date DESC");
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $requests = [];
    while ($row = $result->fetch_assoc()) {
        $requests[] = $row;
    }

    echo json_encode(['success' => true, 'requests' => $requests]);

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

$conn->close();
?>
