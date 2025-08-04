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

    /**
     * Clear all payment records and reset counters
     */
    public function clearAllPayments() {
        try {
            $this->db->begin_transaction();
            
            // Clear all tables
            $this->db->query("DELETE FROM payment_history");
            $this->db->query("DELETE FROM enrollments");
            $this->db->query("DELETE FROM financial_records");
            
            // Reset auto-increment counters
            $this->db->query("ALTER TABLE payment_history AUTO_INCREMENT = 1");
            $this->db->query("ALTER TABLE enrollments AUTO_INCREMENT = 1");
            $this->db->query("ALTER TABLE financial_records AUTO_INCREMENT = 1");
            
            $this->db->commit();
            
            return [
                'success' => true,
                'message' => 'All payment records cleared successfully',
                'data' => [
                    'cleared_tables' => ['payment_history', 'enrollments', 'financial_records'],
                    'reset_counters' => true
                ]
            ];
        } catch (Exception $e) {
            $this->db->rollback();
            return [
                'success' => false,
                'message' => 'Failed to clear payment records: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Industry-level: Recover failed enrollments for paid transactions
     */
    public function recoverFailedEnrollments() {
        try {
            $recovered = 0;
            $errors = [];
            
            // Find all paid payments without enrollments
            $stmt = $this->db->prepare("
                SELECT fr.*, c.payment_tracking, c.payment_tracking_free_days
                FROM financial_records fr
                LEFT JOIN classes c ON fr.class_id = c.id
                WHERE fr.status = 'paid' 
                AND fr.category = 'class_enrollment'
                AND NOT EXISTS (
                    SELECT 1 FROM enrollments e 
                    WHERE e.student_id = fr.user_id 
                    AND e.class_id = fr.class_id
                )
            ");
            $stmt->execute();
            $result = $stmt->get_result();
            $failedPayments = $result->fetch_all(MYSQLI_ASSOC);
            
            foreach ($failedPayments as $payment) {
                try {
                    // Calculate next payment date
                    $nextPaymentDate = date('Y-m-01', strtotime('+1 month'));
                    
                    // Create enrollment
                    $enrollmentStmt = $this->db->prepare("
                        INSERT INTO enrollments (
                            student_id, class_id, enrollment_date, status, payment_status, 
                            total_fee, paid_amount, next_payment_date, created_at
                        ) VALUES (?, ?, NOW(), 'active', 'paid', ?, ?, ?, NOW())
                    ");
                    
                    $enrollmentStmt->bind_param("sisds", 
                        $payment['user_id'], 
                        $payment['class_id'], 
                        $payment['amount'], 
                        $payment['amount'], 
                        $nextPaymentDate
                    );
                    
                    if ($enrollmentStmt->execute()) {
                        $enrollmentId = $enrollmentStmt->insert_id;
                        
                        // Create payment history
                        $historyStmt = $this->db->prepare("
                            INSERT INTO payment_history (
                                enrollment_id, amount, payment_method, reference_number, status, notes
                            ) VALUES (?, ?, ?, ?, ?, ?)
                        ");
                        
                        $notes = "Recovered from failed enrollment - Original transaction: " . $payment['transaction_id'];
                        $historyStmt->bind_param("idssss", 
                            $enrollmentId, 
                            $payment['amount'], 
                            $payment['payment_method'], 
                            $payment['reference_number'], 
                            'completed', 
                            $notes
                        );
                        $historyStmt->execute();
                        
                        $recovered++;
                        error_log("ENROLLMENT_RECOVERED: Transaction {$payment['transaction_id']} - Enrollment ID: $enrollmentId");
                    } else {
                        $errors[] = "Failed to create enrollment for transaction {$payment['transaction_id']}: " . $enrollmentStmt->error;
                    }
                } catch (Exception $e) {
                    $errors[] = "Error recovering enrollment for transaction {$payment['transaction_id']}: " . $e->getMessage();
                }
            }
            
            return [
                'success' => true,
                'message' => "Recovery completed: $recovered enrollments recovered",
                'data' => [
                    'recovered_count' => $recovered,
                    'total_failed' => count($failedPayments),
                    'errors' => $errors
                ]
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to recover enrollments: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Industry-level: Process all pending payments and create enrollments
     */
    public function processPendingEnrollments() {
        try {
            $processed = 0;
            $errors = [];
            
            // Find all pending payments
            $stmt = $this->db->prepare("
                SELECT fr.*, c.payment_tracking, c.payment_tracking_free_days
                FROM financial_records fr
                LEFT JOIN classes c ON fr.class_id = c.id
                WHERE fr.status = 'pending' 
                AND fr.category = 'class_enrollment'
            ");
            $stmt->execute();
            $result = $stmt->get_result();
            $pendingPayments = $result->fetch_all(MYSQLI_ASSOC);
            
            foreach ($pendingPayments as $payment) {
                try {
                    // Simulate payment completion
                    $paymentData = [
                        'status' => 'paid',
                        'paymentMethod' => $payment['payment_method'] ?? 'online',
                        'referenceNumber' => $payment['reference_number'] ?? $payment['transaction_id'],
                        'notes' => 'Auto-processed pending payment'
                    ];
                    
                    // Process payment using the main controller
                    require_once __DIR__ . '/PaymentController.php';
                    $paymentController = new PaymentController($this->db);
                    $result = $paymentController->processPayment($payment['transaction_id'], $paymentData);
                    
                    if ($result['success']) {
                        $processed++;
                        error_log("PENDING_PAYMENT_PROCESSED: Transaction {$payment['transaction_id']}");
                    } else {
                        $errors[] = "Failed to process payment {$payment['transaction_id']}: " . $result['message'];
                    }
                } catch (Exception $e) {
                    $errors[] = "Error processing payment {$payment['transaction_id']}: " . $e->getMessage();
                }
            }
            
            return [
                'success' => true,
                'message' => "Processing completed: $processed payments processed",
                'data' => [
                    'processed_count' => $processed,
                    'total_pending' => count($pendingPayments),
                    'errors' => $errors
                ]
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to process pending payments: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Development: Simulate PayHere payment confirmation for testing
     */
    public function simulatePayHereConfirmation($orderId) {
        try {
            // Check if payment exists
            $stmt = $this->db->prepare("
                SELECT * FROM financial_records 
                WHERE transaction_id = ? AND category = 'class_enrollment'
            ");
            $stmt->bind_param("s", $orderId);
            $stmt->execute();
            $result = $stmt->get_result();
            $payment = $result->fetch_assoc();
            
            if (!$payment) {
                return [
                    'success' => false,
                    'message' => 'Payment not found'
                ];
            }
            
            if ($payment['status'] === 'paid') {
                return [
                    'success' => true,
                    'message' => 'Payment already confirmed',
                    'data' => $payment
                ];
            }
            
            // Update payment status to paid
            $updateStmt = $this->db->prepare("
                UPDATE financial_records 
                SET status = 'paid', updated_at = NOW() 
                WHERE transaction_id = ?
            ");
            $updateStmt->bind_param("s", $orderId);
            $updateStmt->execute();
            
            // Process the payment to create enrollment
            require_once __DIR__ . '/PaymentController.php';
            $paymentController = new PaymentController($this->db);
            $processResult = $paymentController->processPayment($orderId, [
                'status' => 'paid',
                'paymentMethod' => $payment['payment_method'] ?? 'online',
                'referenceNumber' => $payment['reference_number'] ?? $orderId,
                'notes' => 'Simulated PayHere confirmation'
            ]);
            
            if ($processResult['success']) {
                return [
                    'success' => true,
                    'message' => 'PayHere payment simulated successfully',
                    'data' => [
                        'payment' => $payment,
                        'enrollment' => $processResult['data'] ?? null
                    ]
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Payment confirmed but enrollment creation failed: ' . $processResult['message']
                ];
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to simulate PayHere confirmation: ' . $e->getMessage()
            ];
        }
    }

    public function debugEnrollment($studentId, $classId) {
        try {
            $debug = [
                'studentId' => $studentId,
                'classId' => $classId,
                'timestamp' => date('Y-m-d H:i:s')
            ];

            // Check if student exists (in auth database)
            $debug['student_exists'] = 'Check auth database manually';
            $debug['student_data'] = 'Student data is in auth database, not class database';

            // Check if class exists
            $classStmt = $this->db->prepare("SELECT * FROM classes WHERE id = ?");
            $classStmt->bind_param("i", $classId);
            $classStmt->execute();
            $class = $classStmt->get_result()->fetch_assoc();
            $debug['class_exists'] = $class ? true : false;
            $debug['class_data'] = $class;

            // Check for existing enrollment
            $enrollmentStmt = $this->db->prepare("SELECT * FROM enrollments WHERE student_id = ? AND class_id = ?");
            $enrollmentStmt->bind_param("si", $studentId, $classId);
            $enrollmentStmt->execute();
            $enrollment = $enrollmentStmt->get_result()->fetch_assoc();
            $debug['enrollment_exists'] = $enrollment ? true : false;
            $debug['enrollment_data'] = $enrollment;

            // Check for payments
            $paymentStmt = $this->db->prepare("SELECT * FROM financial_records WHERE user_id = ? AND class_id = ? ORDER BY created_at DESC");
            $paymentStmt->bind_param("si", $studentId, $classId);
            $paymentStmt->execute();
            $payments = $paymentStmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $debug['payments'] = $payments;
            $debug['payment_count'] = count($payments);

            // Check all enrollments for this student (simplified)
            $allEnrollmentsStmt = $this->db->prepare("SELECT * FROM enrollments WHERE student_id = ?");
            $allEnrollmentsStmt->bind_param("s", $studentId);
            $allEnrollmentsStmt->execute();
            $allEnrollments = $allEnrollmentsStmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $debug['all_student_enrollments'] = $allEnrollments;

            return [
                'success' => true,
                'message' => 'Debug information retrieved',
                'data' => $debug
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Debug failed: ' . $e->getMessage(),
                'data' => null
            ];
        }
    }
}
?> 