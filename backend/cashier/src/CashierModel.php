<?php
// src/CashierModel.php
class CashierModel {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    // Get all payments
    public function getAllPayments() {
        $sql = "SELECT * FROM payments ORDER BY created_at DESC";
        $result = $this->conn->query($sql);
        
        if ($result) {
            $payments = [];
            while ($row = $result->fetch_assoc()) {
                $payments[] = $row;
            }
            return $payments;
        }
        return false;
    }

    // Get payment by ID
    public function getPaymentById($payment_id) {
        $sql = "SELECT * FROM payments WHERE payment_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('s', $payment_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $payment = $result->fetch_assoc();
        $stmt->close();
        return $payment;
    }

    // Create payment
    public function createPayment($data) {
        $sql = "INSERT INTO payments (payment_id, student_id, student_name, class_id, class_name, amount, payment_type, payment_method, status, receipt_number, cashier_id, cashier_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("sssssdssss", 
            $data['payment_id'],
            $data['student_id'],
            $data['student_name'],
            $data['class_id'],
            $data['class_name'],
            $data['amount'],
            $data['payment_type'],
            $data['payment_method'],
            $data['receipt_number'],
            $data['cashier_id'],
            $data['cashier_name']
        );
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }

    // Update payment
    public function updatePayment($payment_id, $data) {
        $sql = "UPDATE payments SET student_id=?, student_name=?, class_id=?, class_name=?, amount=?, payment_type=?, payment_method=?, status=?, notes=? WHERE payment_id=?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ssssdsssss",
            $data['student_id'],
            $data['student_name'],
            $data['class_id'],
            $data['class_name'],
            $data['amount'],
            $data['payment_type'],
            $data['payment_method'],
            $data['status'],
            $data['notes'],
            $payment_id
        );
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }

    // Delete payment
    public function deletePayment($payment_id) {
        $sql = "DELETE FROM payments WHERE payment_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('s', $payment_id);
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }

    // Get payments by student ID
    public function getPaymentsByStudent($student_id) {
        $sql = "SELECT * FROM payments WHERE student_id = ? ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('s', $student_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $payments = [];
        while ($row = $result->fetch_assoc()) {
            $payments[] = $row;
        }
        $stmt->close();
        return $payments;
    }

    // Get payments by status
    public function getPaymentsByStatus($status) {
        $sql = "SELECT * FROM payments WHERE status = ? ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('s', $status);
        $stmt->execute();
        $result = $stmt->get_result();
        $payments = [];
        while ($row = $result->fetch_assoc()) {
            $payments[] = $row;
        }
        $stmt->close();
        return $payments;
    }

    // Generate unique payment ID
    public function generatePaymentId() {
        do {
            $payment_id = 'PAY' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
            $sql = "SELECT COUNT(*) as count FROM payments WHERE payment_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param('s', $payment_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();
        } while ($row['count'] > 0);
        
        return $payment_id;
    }

    // Generate unique receipt number
    public function generateReceiptNumber() {
        do {
            $receipt_number = 'RCP' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
            $sql = "SELECT COUNT(*) as count FROM payments WHERE receipt_number = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param('s', $receipt_number);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();
        } while ($row['count'] > 0);
        
        return $receipt_number;
    }
}
?> 