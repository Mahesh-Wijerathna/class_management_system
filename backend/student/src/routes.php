<?php
require_once __DIR__ . '/StudentController.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$mysqli = new mysqli(
    getenv('DB_HOST'),
    getenv('DB_USER'),
    getenv('DB_PASSWORD'),
    getenv('DB_NAME')
);

if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$controller = new StudentController($mysqli);

// Router test
if ($method === 'GET' && $path === '/routes.php/test') {
    echo json_encode([
        'success' => true,
        'message' => 'Test route works!'
    ]);
    exit;
}

// CREATE student
if ($method === 'POST' && $path === '/routes.php/student') {
    $data = json_decode(file_get_contents('php://input'), true);
    $controller->createStudent($data);
    exit;
}
// Get all students
if ($method === 'GET' && $path === '/routes.php/getAllStudents') {
    $students = $controller->getAllStudents();
    echo $students;
    exit;
}
// Get student by ID
if ($method === 'GET' && preg_match('#^\/routes.php\/get_with_id\/([A-Za-z0-9]+)$#', $path, $matches)) {
    $user_id = $matches[1];
    // echo json_encode(["user_id" => $user_id]);
    $student = $controller->getStudentById($user_id);
    if ($student) {
        echo json_encode($student);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Student not found', 'user_id' => $user_id]);
    }
    exit;
}