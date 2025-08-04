<?php
require_once __DIR__ . '/config.php';

class DevPaymentHelper {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Auto-complete any pending payment for development
    public function autoCompletePayment($orderId) {
        try {
            // Check if payment exists in payments table
            $stmt = $this->db->prepare("SELECT * FROM payments WHERE order_id = ?");
            $stmt->bind_param("s", $orderId);
            $stmt->execute();
            $result = $stmt->get_result();
            $payment = $result->fetch_assoc();

            if (!$payment) {
                return [
                    'success' => false,
                    'message' => 'Payment not found in payments table'
                ];
            }

            // Update payments table
            $stmt = $this->db->prepare("
                UPDATE payments 
                SET status = 'completed', 
                    payhere_status_code = '2',
                    updated_at = NOW()
                WHERE order_id = ?
            ");
            $stmt->bind_param("s", $orderId);
            $stmt->execute();

            // Update financial_records table
            $stmt = $this->db->prepare("
                UPDATE financial_records 
                SET status = 'paid', 
                    updated_at = NOW()
                WHERE transaction_id = ?
            ");
            $stmt->bind_param("s", $orderId);
            $stmt->execute();

            // Check if enrollment already exists
            $stmt = $this->db->prepare("SELECT * FROM enrollments WHERE transaction_id = ?");
            $stmt->bind_param("s", $orderId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows == 0) {
                // Get financial record for enrollment data
                $stmt = $this->db->prepare("SELECT * FROM financial_records WHERE transaction_id = ?");
                $stmt->bind_param("s", $orderId);
                $stmt->execute();
                $result = $stmt->get_result();
                $financial = $result->fetch_assoc();

                if ($financial) {
                    // Create enrollment record
                    $nextPaymentDate = date('Y-m-01', strtotime('+1 month'));
                    $paymentHistory = json_encode([[
                        'date' => date('Y-m-d'),
                        'amount' => $financial['amount'],
                        'method' => $financial['payment_method'],
                        'status' => 'completed',
                        'transactionId' => $orderId,
                        'referenceNumber' => $orderId,
                        'paymentTrackingEnabled' => false,
                        'freeDays' => 7,
                        'nextPaymentDate' => $nextPaymentDate
                    ]]);

                    $stmt = $this->db->prepare("
                        INSERT INTO enrollments (
                            student_id, class_id, enrollment_date, fee_amount, payment_status, 
                            payment_method, transaction_id, next_payment_date, payment_history, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    ");

                    $enrollmentStatus = 'paid';
                    $enrollmentDate = date('Y-m-d');
                    
                    $stmt->bind_param("sisdsssss", 
                        $financial['user_id'], $financial['class_id'], $enrollmentDate, $financial['amount'], $enrollmentStatus, 
                        $financial['payment_method'], $orderId, $nextPaymentDate, $paymentHistory
                    );
                    $stmt->execute();
                }
            } else {
                // Update existing enrollment
                $stmt = $this->db->prepare("
                    UPDATE enrollments 
                    SET payment_status = 'paid',
                        updated_at = NOW()
                    WHERE transaction_id = ?
                ");
                $stmt->bind_param("s", $orderId);
                $stmt->execute();
            }

            return [
                'success' => true,
                'message' => 'Payment auto-completed successfully for development',
                'data' => [
                    'orderId' => $orderId,
                    'status' => 'completed'
                ]
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error auto-completing payment: ' . $e->getMessage()
            ];
        }
    }

    // Get all pending payments for development
    public function getPendingPayments() {
        try {
            $stmt = $this->db->prepare("
                SELECT p.order_id, p.amount, p.created_at, f.class_name, f.user_id
                FROM payments p
                LEFT JOIN financial_records f ON p.order_id = f.transaction_id
                WHERE p.status = 'pending'
                ORDER BY p.created_at DESC
            ");
            $stmt->execute();
            $result = $stmt->get_result();
            
            $payments = [];
            while ($row = $result->fetch_assoc()) {
                $payments[] = $row;
            }
            
            return [
                'success' => true,
                'data' => $payments
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error getting pending payments: ' . $e->getMessage()
            ];
        }
    }

    // Complete all pending payments (for development)
    public function completeAllPendingPayments() {
        try {
            $pendingPayments = $this->getPendingPayments();
            
            if (!$pendingPayments['success']) {
                return $pendingPayments;
            }

            $completed = 0;
            foreach ($pendingPayments['data'] as $payment) {
                $result = $this->autoCompletePayment($payment['order_id']);
                if ($result['success']) {
                    $completed++;
                }
            }

            return [
                'success' => true,
                'message' => "Completed $completed pending payments",
                'data' => [
                    'completed' => $completed,
                    'total' => count($pendingPayments['data'])
                ]
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error completing all payments: ' . $e->getMessage()
            ];
        }
    }

    // Clear all payment records (for development)
    public function clearAllPayments() {
        try {
            // Clear payment history
            $stmt = $this->db->prepare("DELETE FROM payment_history");
            $stmt->execute();
            $paymentHistoryDeleted = $stmt->affected_rows;

            // Clear enrollments
            $stmt = $this->db->prepare("DELETE FROM enrollments");
            $stmt->execute();
            $enrollmentsDeleted = $stmt->affected_rows;

            // Clear financial records
            $stmt = $this->db->prepare("DELETE FROM financial_records");
            $stmt->execute();
            $financialRecordsDeleted = $stmt->affected_rows;

            // Clear payments table (if exists)
            $stmt = $this->db->prepare("DELETE FROM payments");
            $stmt->execute();
            $paymentsDeleted = $stmt->affected_rows;

            // Reset auto-increment counters
            $this->db->query("ALTER TABLE payment_history AUTO_INCREMENT = 1");
            $this->db->query("ALTER TABLE enrollments AUTO_INCREMENT = 1");
            $this->db->query("ALTER TABLE financial_records AUTO_INCREMENT = 1");
            $this->db->query("ALTER TABLE payments AUTO_INCREMENT = 1");

            return [
                'success' => true,
                'message' => 'All payment records cleared successfully',
                'data' => [
                    'payment_history_deleted' => $paymentHistoryDeleted,
                    'enrollments_deleted' => $enrollmentsDeleted,
                    'financial_records_deleted' => $financialRecordsDeleted,
                    'payments_deleted' => $paymentsDeleted
                ]
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error clearing payment records: ' . $e->getMessage()
            ];
        }
    }
}
?> 