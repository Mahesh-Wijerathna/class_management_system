<?php
require_once 'db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    
    $student_code = $_GET['student_code'] ?? null;
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

    
    $query = "
    SELECT p.id, cs.title AS class_name, p.amount, p.due_date, p.status
    FROM payments p
    JOIN class_schedule cs ON p.class_id = cs.id
    WHERE p.student_id = ? AND (p.status='Overdue' OR (p.status='Pending' AND p.due_date < CURDATE()))
    ORDER BY p.due_date ASC";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $late_payments = [];
    while ($row = $result->fetch_assoc()) {
        
        if ($row['status'] === 'Pending' && strtotime($row['due_date']) < time()) {
            $row['status'] = 'Overdue';
        }
        $late_payments[] = $row;
    }

    echo json_encode(['success' => true, 'late_payments' => $late_payments]);

} elseif ($method === 'POST') {
    
    $data = json_decode(file_get_contents("php://input"), true);
    $payment_id = $data['id'] ?? null;

    if (!$payment_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing id']);
        exit;
    }

    $stmt = $conn->prepare("UPDATE payments SET status='Paid', paid_at=NOW() WHERE id = ?");
    $stmt->bind_param("i", $payment_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Payment marked as paid']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update payment']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

$conn->close();
?>
