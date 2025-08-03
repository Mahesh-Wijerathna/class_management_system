<?php
// src/CashierController.php
require_once 'config.php';
require_once 'CashierModel.php';

class CashierController {
    private $model;

    public function __construct($db) {
        $this->model = new CashierModel($db);
    }

    public function getAllPayments() {
        $payments = $this->model->getAllPayments();
        
        if ($payments !== false) {
            return json_encode(['success' => true, 'payments' => $payments]);
        } else {
            http_response_code(500);
            return json_encode(['error' => 'Failed to fetch payments']);
        }
    }

    public function createPayment($data) {
        // Validate required fields
        $required = ['student_id', 'student_name', 'class_id', 'class_name', 'amount', 'payment_type', 'payment_method'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Missing required field: $field"]);
                exit;
            }
        }

        // Generate unique IDs using model
        $payment_id = $this->model->generatePaymentId();
        $receipt_number = $this->model->generateReceiptNumber();

        // Prepare data for model
        $paymentData = [
            'payment_id' => $payment_id,
            'student_id' => $data['student_id'],
            'student_name' => $data['student_name'],
            'class_id' => $data['class_id'],
            'class_name' => $data['class_name'],
            'amount' => $data['amount'],
            'payment_type' => $data['payment_type'],
            'payment_method' => $data['payment_method'],
            'receipt_number' => $receipt_number,
            'cashier_id' => $data['cashier_id'] ?? 'C001',
            'cashier_name' => $data['cashier_name'] ?? 'Default Cashier'
        ];

        if ($this->model->createPayment($paymentData)) {
            echo json_encode(['success' => true, 'payment_id' => $payment_id, 'receipt_number' => $receipt_number]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create payment']);
        }
    }

    public function getPaymentById($payment_id) {
        $payment = $this->model->getPaymentById($payment_id);
        
        if ($payment) {
            return json_encode(['success' => true, 'payment' => $payment]);
        } else {
            http_response_code(404);
            return json_encode(['error' => 'Payment not found']);
        }
    }

    public function updatePayment($payment_id, $data) {
        if ($this->model->updatePayment($payment_id, $data)) {
            echo json_encode(['success' => true, 'message' => 'Payment updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update payment']);
        }
    }

    public function deletePayment($payment_id) {
        if ($this->model->deletePayment($payment_id)) {
            echo json_encode(['success' => true, 'message' => 'Payment deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete payment']);
        }
    }

    public function getPaymentsByStudent($student_id) {
        $payments = $this->model->getPaymentsByStudent($student_id);
        
        if ($payments !== false) {
            return json_encode(['success' => true, 'payments' => $payments]);
        } else {
            http_response_code(500);
            return json_encode(['error' => 'Failed to fetch payments']);
        }
    }

    public function getPaymentsByStatus($status) {
        $payments = $this->model->getPaymentsByStatus($status);
        
        if ($payments !== false) {
            return json_encode(['success' => true, 'payments' => $payments]);
        } else {
            http_response_code(500);
            return json_encode(['error' => 'Failed to fetch payments']);
        }
    }
} 