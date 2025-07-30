<?php
include 'db.php';

$student_id = $_GET['student_id']; 

$sql = "SELECT cs.id, cs.title, cs.is_online, cs.date, cs.start_time, cs.end_time,
               cs.location, cs.online_link, c.name AS class_name
        FROM class_schedule cs
        JOIN classes c ON cs.class_id = c.id
        ORDER BY cs.date ASC";

$result = $conn->query($sql);

$response = [];
while ($row = $result->fetch_assoc()) {
    $response[] = $row;
}

echo json_encode([
    'status' => 'success',
    'data' => $response
]);
?>
