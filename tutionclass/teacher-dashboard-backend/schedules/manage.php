<?php
require_once '../db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $result = $conn->query("SELECT * FROM class_schedules");
        $schedules = [];
        while ($row = $result->fetch_assoc()) {
            $schedules[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $schedules]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $teacher_id = $data['teacher_id'];
        $class = $data['class'];
        $subject = $data['subject'];
        $date = $data['date'];
        $time = $data['time'];
        $link = $data['link'];

        $stmt = $conn->prepare("INSERT INTO class_schedules (teacher_id, class, subject, date, time, link) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("isssss", $teacher_id, $class, $subject, $date, $time, $link);
        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Schedule created']);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID is required for update']);
            exit;
        }

        $id = $data['id'];
        $teacher_id = $data['teacher_id'];
        $class = $data['class'];
        $subject = $data['subject'];
        $date = $data['date'];
        $time = $data['time'];
        $link = $data['link'];

        $stmt = $conn->prepare("UPDATE class_schedules SET teacher_id = ?, class = ?, subject = ?, date = ?, time = ?, link = ? WHERE id = ?");
        $stmt->bind_param("isssssi", $teacher_id, $class, $subject, $date, $time, $link, $id);
        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Schedule updated']);
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID is required for deletion']);
            exit;
        }

        $id = $data['id'];
        $stmt = $conn->prepare("DELETE FROM class_schedules WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Schedule deleted']);
        break;
}
?>
