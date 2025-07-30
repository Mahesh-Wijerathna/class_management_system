<?php
require_once '../db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$uploadDir = 'uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$teacher_id = $_POST['teacher_id'] ?? null;
$class_id = $_POST['class_id'] ?? null;
$title = $_POST['title'] ?? null;
$link = $_POST['link'] ?? null;

if (!$teacher_id || !$class_id || !$title) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$filepath = null;

try {
    // File upload
    if (!empty($_FILES['file']['name'])) {
        $filename = basename($_FILES['file']['name']);
        $targetPath = $uploadDir . time() . "_" . $filename;

        if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
            $filepath = $targetPath;
        } else {
            throw new Exception("Failed to upload file");
        }
    }

    // Save to DB
    $stmt = $conn->prepare("INSERT INTO materials (teacher_id, class_id, title, file_path, external_link, uploaded_at)
                            VALUES (?, ?, ?, ?, ?, NOW())");
    $stmt->bind_param("iisss", $teacher_id, $class_id, $title, $filepath, $link);
    $stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Material uploaded successfully',
        'data' => [
            'id' => $stmt->insert_id,
            'file_path' => $filepath,
            'external_link' => $link
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Upload failed', 'error' => $e->getMessage()]);
}

$conn->close();
