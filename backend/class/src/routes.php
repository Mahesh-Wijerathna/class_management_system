<?php

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: false');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'ClassController.php';

$method = $_SERVER['REQUEST_METHOD'];

// Normalize path
$scriptName = $_SERVER['SCRIPT_NAME']; // e.g., /routes.php
$path = str_replace($scriptName, '', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// DB connection
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

$controller = new ClassController($mysqli);

switch ($method) {
    case 'POST':
        if ($path === '/') {
            $data = json_decode(file_get_contents('php://input'), true);
            if ($data) {
                $result = $controller->createClass($data);
                if ($result) {
                    http_response_code(201);
                    echo json_encode(['success' => true, 'message' => 'Class created successfully']);
                } else {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Failed to create class']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid input data']);
            }
        }
        break;

    case 'GET':
        if ($path === '/get_class_by_id' && isset($_GET['id'])) {
            $classId = $_GET['id'];
            $class = $controller->getClassById($classId);
            if ($class) {
                echo json_encode(['success' => true, 'data' => $class]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Class not found']);
            }
        } else if ($path === '/get_all_classes') {
            $classes = $controller->getAllClasses();
            echo json_encode(['success' => true, 'data' => $classes]);
        } else if ($path === '/get_active_classes') {
            $classes = $controller->getActiveClasses();
            echo json_encode(['success' => true, 'data' => $classes]);
        } else if ($path === '/get_classes_by_type' && isset($_GET['type'])) {
            $courseType = $_GET['type'];
            $classes = $controller->getClassesByType($courseType);
            echo json_encode(['success' => true, 'data' => $classes]);
        } else if ($path === '/get_classes_by_delivery' && isset($_GET['method'])) {
            $deliveryMethod = $_GET['method'];
            $classes = $controller->getClassesByDeliveryMethod($deliveryMethod);
            echo json_encode(['success' => true, 'data' => $classes]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Not found', 'path' => $path]);
        }
        break;

    case 'PUT':
        if (preg_match('/\/classes\/(\d+)/', $path, $matches)) {
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->updateClass($matches[1], $data);
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Class updated successfully']);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Failed to update class']);
            }
        }
        break;

    case 'DELETE':
        if (preg_match('/\/classes\/(\d+)/', $path, $matches)) {
            $result = $controller->deleteClass($matches[1]);
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Class deleted successfully']);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Failed to delete class']);
            }
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
