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
require_once 'PaymentController.php';
require_once 'EnrollmentController.php';

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
$paymentController = new PaymentController($mysqli);
$enrollmentController = new EnrollmentController($mysqli);

switch ($method) {
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if ($path === '/create_class') {
            $result = $controller->createClass($input);
            echo json_encode($result);
        } elseif ($path === '/update_class') {
            $id = $input['id'];
            unset($input['id']); // Remove id from data array
            $result = $controller->updateClass($id, $input);
            echo json_encode(['success' => $result]);
        } elseif ($path === '/create_payment') {
            $result = $paymentController->createPayment($input);
            echo json_encode($result);
        } elseif ($path === '/process_payment') {
            $transactionId = $input['transactionId'];
            // Remove the nested paymentData expectation - use the input directly
            $result = $paymentController->processPayment($transactionId, $input);
            echo json_encode($result);
        } elseif ($path === '/create_enrollment') {
            $result = $enrollmentController->createEnrollment($input);
            echo json_encode($result);
        } elseif ($path === '/mark_attendance') {
            $classId = $input['classId'];
            $studentId = $input['studentId'];
            $attendanceData = $input['attendanceData'];
            $result = $enrollmentController->markAttendance($classId, $studentId, $attendanceData);
            echo json_encode($result);
        } elseif ($path === '/request_forget_card') {
            $classId = $input['classId'];
            $studentId = $input['studentId'];
            $result = $enrollmentController->requestForgetCard($classId, $studentId);
            echo json_encode($result);
        } elseif ($path === '/request_late_payment') {
            $classId = $input['classId'];
            $studentId = $input['studentId'];
            $result = $enrollmentController->requestLatePayment($classId, $studentId);
            echo json_encode($result);
        } elseif ($path === '/create_session_schedule') {
            $result = $controller->createSessionSchedule($input);
            echo json_encode($result);
                } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
        break;

    case 'GET':
        if ($path === '/get_student_payments' && isset($_GET['studentId'])) {
            $studentId = $_GET['studentId'];
            $result = $paymentController->getStudentPayments($studentId);
            echo json_encode($result);
        } elseif ($path === '/get_payment_by_transaction' && isset($_GET['transactionId'])) {
            $transactionId = $_GET['transactionId'];
            $result = $paymentController->getPaymentByTransactionId($transactionId);
            echo json_encode($result);
        } elseif ($path === '/get_payment_stats') {
            $result = $paymentController->getPaymentStats();
            echo json_encode($result);
        } elseif ($path === '/generate_invoice' && isset($_GET['transactionId'])) {
            $transactionId = $_GET['transactionId'];
            $result = $paymentController->generateInvoice($transactionId);
            echo json_encode($result);
        } elseif ($path === '/get_student_enrollments' && isset($_GET['studentId'])) {
            $studentId = $_GET['studentId'];
            $result = $enrollmentController->getStudentEnrollments($studentId);
            echo json_encode($result);
        } elseif ($path === '/get_all_classes') {
            $classes = $controller->getAllClasses();
            echo json_encode(['success' => true, 'data' => $classes]);
        } elseif ($path === '/get_active_classes') {
            $classes = $controller->getActiveClasses();
            echo json_encode(['success' => true, 'data' => $classes]);
        } elseif ($path === '/get_class_by_id' && isset($_GET['id'])) {
            $classId = $_GET['id'];
            $class = $controller->getClassById($classId);
            if ($class) {
                echo json_encode(['success' => true, 'data' => $class]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Class not found']);
            }
        } elseif ($path === '/get_classes_by_type' && isset($_GET['courseType'])) {
            $courseType = $_GET['courseType'];
            $classes = $controller->getClassesByType($courseType);
            echo json_encode(['success' => true, 'data' => $classes]);
        } elseif ($path === '/get_classes_by_delivery' && isset($_GET['deliveryMethod'])) {
            $deliveryMethod = $_GET['deliveryMethod'];
            $classes = $controller->getClassesByDeliveryMethod($deliveryMethod);
            echo json_encode(['success' => true, 'data' => $classes]);
        } elseif ($path === '/get_classes_by_teacher' && isset($_GET['teacherId'])) {
            $teacherId = $_GET['teacherId'];
            $classes = $controller->getClassesByTeacher($teacherId);
            echo json_encode(['success' => true, 'data' => $classes]);
        } elseif ($path === '/get_session_schedules_by_teacher' && isset($_GET['teacherId'])) {
            $teacherId = $_GET['teacherId'];
            $schedules = $controller->getSessionSchedulesByTeacher($teacherId);
            echo json_encode(['success' => true, 'data' => $schedules]);
        } elseif ($path === '/get_all_session_schedules') {
            $schedules = $controller->getAllSessionSchedules();
            echo json_encode(['success' => true, 'data' => $schedules]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
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
        } else if (preg_match('/\/session_schedules\/(\d+)/', $path, $matches)) {
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->updateSessionSchedule($matches[1], $data);
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Session schedule updated successfully']);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Failed to update session schedule']);
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
        } else if (preg_match('/\/session_schedules\/(\d+)/', $path, $matches)) {
            $result = $controller->deleteSessionSchedule($matches[1]);
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Session schedule deleted successfully']);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Failed to delete session schedule']);
            }
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
