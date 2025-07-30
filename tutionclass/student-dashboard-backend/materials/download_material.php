<?php

$material_id = $_GET['id'] ?? null;

if (!$material_id) {
    http_response_code(400);
    echo "Missing material_id";
    exit;
}

require_once '../db.php';


$stmt = $conn->prepare("SELECT file_path FROM materials WHERE id = ?");
$stmt->bind_param("i", $material_id);
$stmt->execute();
$result = $stmt->get_result();
$material = $result->fetch_assoc();

if (!$material || !$material['file_path']) {
    http_response_code(404);
    echo "File not found!";
    exit;
}

$file_path = $material['file_path'];

if (!file_exists($file_path)) {
    http_response_code(404);
    echo "File not found on server!";
    exit;
}


header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . basename($file_path) . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . filesize($file_path));
readfile($file_path);
exit;
?>
