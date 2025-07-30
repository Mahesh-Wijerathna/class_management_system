<?php
require_once '../db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'];

// if ($method === 'GET') {
//     // 🟡 Check availability for a specific date
//     $date = $_GET['date'] ?? null;

//     if (!$date) {
//         echo json_encode(['success' => false, 'message' => 'Date is required']);
//         exit;
//     }

//     try {
//         $sql = "SELECT start_time, end_time, purpose FROM hall_bookings WHERE date = ?";
//         $stmt = $conn->prepare($sql);
//         $stmt->bind_param("s", $date);
//         $stmt->execute();
//         $result = $stmt->get_result();

//         $slots = [];
//         while ($row = $result->fetch_assoc()) {
//             $slots[] = $row;
//         }

//         echo json_encode(['success' => true, 'booked_slots' => $slots]);
//     } catch (Exception $e) {
//         echo json_encode(['success' => false, 'message' => 'Error fetching hall bookings']);
//     }
if ($method === 'GET') {
    // Check availability for specific date and time range
    $date = $_GET['date'] ?? null;
    $start_time = $_GET['start_time'] ?? null;
    $end_time = $_GET['end_time'] ?? null;

    if (!$date || !$start_time || !$end_time) {
        echo json_encode(['success' => false, 'message' => 'date, start_time and end_time are required']);
        exit;
    }

    try {
        $sql = "SELECT * FROM hall_bookings 
                WHERE date = ?
                  AND (
                      (start_time < ? AND end_time > ?) OR
                      (start_time < ? AND end_time > ?) OR
                      (start_time >= ? AND end_time <= ?)
                  )";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssssss", $date, $end_time, $start_time, $end_time, $start_time, $start_time, $end_time);
        $stmt->execute();
        $result = $stmt->get_result();

        $conflicts = [];
        while ($row = $result->fetch_assoc()) {
            $conflicts[] = $row;
        }

        if (count($conflicts) > 0) {
            echo json_encode(['success' => true, 'available' => false, 'conflicts' => $conflicts]);
        } else {
            echo json_encode(['success' => true, 'available' => true, 'message' => 'Time slot is available']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error checking availability', 'error' => $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    //  Book hall
    $data = json_decode(file_get_contents("php://input"), true);
    $teacher_id = $data['teacher_id'] ?? null;
    $date = $data['date'] ?? null;
    $start_time = $data['start_time'] ?? null;
    $end_time = $data['end_time'] ?? null;
    $purpose = $data['purpose'] ?? '';

    if (!$teacher_id || !$date || !$start_time || !$end_time) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    //  Prevent time overlap
    $sql = "SELECT COUNT(*) AS conflict FROM hall_bookings 
            WHERE date = ?
            AND (
                (start_time < ? AND end_time > ?) OR  -- overlaps beginning
                (start_time < ? AND end_time > ?) OR  -- overlaps end
                (start_time >= ? AND end_time <= ?)   -- inside requested range
            )";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssssss", $date, $end_time, $start_time, $end_time, $start_time, $start_time, $end_time);
    $stmt->execute();
    $conflict = $stmt->get_result()->fetch_assoc()['conflict'];

    if ($conflict > 0) {
        echo json_encode(['success' => false, 'message' => 'Time slot already booked']);
        exit;
    }

    // ✅ Insert booking
    $insert = "INSERT INTO hall_bookings (teacher_id, date, start_time, end_time, purpose)
               VALUES (?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($insert);
    $stmt->bind_param("issss", $teacher_id, $date, $start_time, $end_time, $purpose);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Hall booked successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error booking hall']);
    }

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
