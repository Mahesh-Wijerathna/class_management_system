<?php
require_once __DIR__ . '/CashierController.php';

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

$controller = new CashierController($mysqli);

// Router test
if ($method === 'GET' && $path === '/routes.php/test') {
    echo json_encode([
        'success' => true,
        'message' => 'Cashier service is working!'
    ]);
    exit;
}

// Get all payments
if ($method === 'GET' && $path === '/routes.php/payments') {
    $payments = $controller->getAllPayments();
    echo $payments;
    exit;
}

// Get payment by ID
if ($method === 'GET' && preg_match('#^/routes.php/payment/([A-Za-z0-9]+)$#', $path, $matches)) {
    $payment_id = $matches[1];
    $payment = $controller->getPaymentById($payment_id);
    echo $payment;
    exit;
}

// Create payment
if ($method === 'POST' && $path === '/routes.php/payment') {
    $data = json_decode(file_get_contents('php://input'), true);
    $controller->createPayment($data);
    exit;
}

// Update payment
if ($method === 'PUT' && preg_match('#^/routes.php/payment/([A-Za-z0-9]+)$#', $path, $matches)) {
    $payment_id = $matches[1];
    $data = json_decode(file_get_contents('php://input'), true);
    $controller->updatePayment($payment_id, $data);
    exit;
}

// Delete payment
if ($method === 'DELETE' && preg_match('#^/routes.php/payment/([A-Za-z0-9]+)$#', $path, $matches)) {
    $payment_id = $matches[1];
    $controller->deletePayment($payment_id);
    exit;
}

// Get payments by student ID
if ($method === 'GET' && preg_match('#^/routes.php/payments/student/([A-Za-z0-9]+)$#', $path, $matches)) {
    $student_id = $matches[1];
    $payments = $controller->getPaymentsByStudent($student_id);
    echo $payments;
    exit;
}

// Get payments by status
if ($method === 'GET' && preg_match('#^/routes.php/payments/status/([A-Za-z]+)$#', $path, $matches)) {
    $status = $matches[1];
    $payments = $controller->getPaymentsByStatus($status);
    echo $payments;
    exit;
} 