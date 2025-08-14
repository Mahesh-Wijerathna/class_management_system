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

require_once 'PaymentController.php';
require_once 'PayHereController.php';
require_once 'DevPaymentHelper.php';

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

$paymentController = new PaymentController($mysqli);
$payHereController = new PayHereController($mysqli);
$devPaymentHelper = new DevPaymentHelper($mysqli);

// Test endpoint
if ($method === 'GET' && $path === '/test') {
    echo json_encode([
        'success' => true,
        'message' => 'Payment API is working!'
    ]);
    exit;
}

switch ($method) {
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if ($path === '/create_payhere_payment') {
            $result = $payHereController->createPayHerePayment($input);
            echo json_encode($result);
        } elseif ($path === '/payhere_notify') {
            $result = $payHereController->handlePayHereNotification($_POST);
            if ($result['status'] === 'success') {
                http_response_code(200);
                echo "OK";
            } else {
                http_response_code(400);
                echo $result['message'];
            }
        } elseif ($path === '/create_payment') {
            $result = $paymentController->createPayment($input);
            echo json_encode($result);
        } elseif ($path === '/process_payment') {
            $transactionId = $input['transactionId'];
            $result = $paymentController->processPayment($transactionId, $input);
            echo json_encode($result);
        } elseif ($path === '/delete_student_payments') {
            $email = $input['email'];
            $result = $paymentController->deleteStudentPayments($email);
            echo json_encode($result);
        } elseif ($path === '/dev/auto_complete_payment') {
            $orderId = $input['order_id'] ?? '';
            $result = $devPaymentHelper->autoCompletePayment($orderId);
            echo json_encode($result);
        } elseif ($path === '/dev/complete_all_pending_payments') {
            $result = $devPaymentHelper->completeAllPendingPayments();
            echo json_encode($result);
        } elseif ($path === '/dev/clear_all_payments') {
            $result = $devPaymentHelper->clearAllPayments();
            echo json_encode($result);
        } elseif ($path === '/dev/recover_failed_enrollments') {
            $result = $devPaymentHelper->recoverFailedEnrollments();
            echo json_encode($result);
        } elseif ($path === '/dev/process_pending_enrollments') {
            $result = $devPaymentHelper->processPendingEnrollments();
            echo json_encode($result);
        } elseif ($path === '/dev/simulate_payhere_confirmation') {
            $orderId = $input['order_id'] ?? '';
            $result = $devPaymentHelper->simulatePayHereConfirmation($orderId);
            echo json_encode($result);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
        break;
        
    case 'GET':
        if ($path === '/get_payment_status' && isset($_GET['order_id'])) {
            $orderId = $_GET['order_id'];
            $result = $payHereController->getPaymentStatus($orderId);
            echo json_encode(['success' => true, 'data' => $result]);
        } elseif ($path === '/get_student_payments' && isset($_GET['studentId'])) {
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
        } elseif ($path === '/dev/get_pending_payments') {
            $result = $devPaymentHelper->getPendingPayments();
            echo json_encode($result);
        } elseif ($path === '/dev/debug_enrollment' && isset($_GET['studentId']) && isset($_GET['classId'])) {
            $studentId = $_GET['studentId'];
            $classId = $_GET['classId'];
            $result = $devPaymentHelper->debugEnrollment($studentId, $classId);
            echo json_encode($result);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
