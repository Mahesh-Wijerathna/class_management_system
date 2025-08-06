<?php
require_once __DIR__ . '/ClassModel.php';
require_once __DIR__ . '/config.php';

class PaymentController {
    private $db;
    private $classModel;

    public function __construct($db) {
        $this->db = $db;
        $this->classModel = new ClassModel($db);
    }

    // Create a new payment record
    public function createPayment($data) {
        try {
            // Generate unique transaction ID
            $transactionId = 'TXN' . date('Ymd') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
            
            // Get student information
            $studentId = $data['studentId'] ?? '';
            // For now, we'll use a simple student lookup or create a placeholder
            $studentName = $data['studentName'] ?? 'Student';

            // Get class information
            $classId = $data['classId'] ?? '';
            $class = $this->classModel->getClassById($classId);
            if (!$class) {
                return ['success' => false, 'message' => 'Class not found'];
            }

            // Check if student is already enrolled in this class (only check paid enrollments)
            $checkEnrollmentStmt = $this->db->prepare("
                SELECT id FROM enrollments 
                WHERE student_id = ? AND class_id = ? AND payment_status = 'paid'
            ");
            $checkEnrollmentStmt->bind_param("ss", $studentId, $classId);
            $checkEnrollmentStmt->execute();
            $enrollmentResult = $checkEnrollmentStmt->get_result();
            
            if ($enrollmentResult->num_rows > 0) {
                return [
                    'success' => false, 
                    'message' => 'You are already enrolled in this class'
                ];
            }

            // Use the final amount calculated by frontend (includes all discounts and fees)
            $finalAmount = $data['amount'] ?? $class['fee'] ?? 0;

            // Create financial record
            $stmt = $this->db->prepare("
                INSERT INTO financial_records (
                    transaction_id, date, type, category, person_name, user_id, person_role,
                    class_name, class_id, amount, status, payment_method, reference_number, notes, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $date = date('Y-m-d');
            $type = 'income';
            $category = 'class_enrollment';
            $personName = $studentName;
            $userId = $studentId; // Use studentId as user_id
            $personRole = 'student';
            $className = $class['className'] ?? '';
            $classId = $classId; // Include class_id
            $status = 'pending';
            $paymentMethod = $data['paymentMethod'] ?? 'online';
            $referenceNumber = $transactionId;
            $notes = $data['notes'] ?? '';

            $stmt->bind_param("ssssssssidsssss", 
                $transactionId, $date, $type, $category, $personName, $userId, $personRole,
                $className, $classId, $finalAmount, $status, $paymentMethod, $referenceNumber, $notes, $studentId
            );

            if (!$stmt->execute()) {
                return ['success' => false, 'message' => 'Failed to create payment record'];
            }

            $financialRecordId = $stmt->insert_id;

            return [
                'success' => true,
                'message' => 'Payment created successfully. Enrollment will be created after payment confirmation.',
                'data' => [
                    'transactionId' => $transactionId,
                    'amount' => $finalAmount,
                    'classId' => $classId,
                    'className' => $className,
                    'studentId' => $studentId,
                    'studentName' => $studentName
                ]
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error creating payment: ' . $e->getMessage()
            ];
        }
    }

    // Process payment
    public function processPayment($transactionId, $paymentData) {
        try {
            // Step 1: Get payment details
            $payment = $this->getPaymentByTransactionId($transactionId);
            if (!$payment['success']) {
                return ['success' => false, 'message' => 'Payment not found'];
            }

            $payment = $payment['data'];
            
            // Step 2: Update payment status to paid
            $updateStmt = $this->db->prepare("
                UPDATE financial_records 
                SET status = 'paid', updated_at = NOW() 
                WHERE transaction_id = ?
            ");
            
            if ($updateStmt->execute([$transactionId])) {
                // Step 3: Get class payment tracking configuration
                $classStmt = $this->db->prepare("SELECT payment_tracking, payment_tracking_free_days FROM classes WHERE id = ?");
                $classStmt->bind_param("i", $payment['class_id']);
                $classStmt->execute();
                $classResult = $classStmt->get_result();
                $classData = $classResult->fetch_assoc();
                
                // Step 4: Calculate payment tracking dates (INDUSTRY STANDARD)
                $paymentTrackingEnabled = $classData ? $classData['payment_tracking'] : false;
                $freeDays = $classData ? $classData['payment_tracking_free_days'] : 7;
                
                // INDUSTRY STANDARD: Next payment is always 1st of next month, regardless of purchase date
                // This ensures consistent billing cycles and proper grace period calculation
                $nextPaymentDate = date('Y-m-01', strtotime('+1 month'));
                
                // Calculate grace period end date
                if ($paymentTrackingEnabled) {
                    // Grace period = Next payment date + free days
                    $gracePeriodEndDate = date('Y-m-d', strtotime($nextPaymentDate . ' +' . $freeDays . ' days'));
                } else {
                    // No grace period - payment due immediately on next payment date
                    $gracePeriodEndDate = $nextPaymentDate;
                }
                
                // Log the payment tracking calculation for debugging
                error_log("PAYMENT_TRACKING_CALC: Transaction $transactionId - Next Payment: $nextPaymentDate, Grace Period End: $gracePeriodEndDate, Free Days: $freeDays, Tracking Enabled: " . ($paymentTrackingEnabled ? 'Yes' : 'No'));
                
                // Step 5: Create payment history JSON
                $paymentHistory = json_encode([[
                    'date' => date('Y-m-d'),
                    'amount' => $payment['amount'],
                    'method' => $paymentData['paymentMethod'],
                    'status' => 'completed',
                    'transactionId' => $transactionId,
                    'referenceNumber' => $paymentData['referenceNumber'],
                    'paymentTrackingEnabled' => $paymentTrackingEnabled,
                    'freeDays' => $freeDays,
                    'nextPaymentDate' => $nextPaymentDate,
                    'gracePeriodEndDate' => $gracePeriodEndDate
                ]]);
                
                // Step 6: INDUSTRY-LEVEL ENROLLMENT CREATION WITH RETRY MECHANISM
                $enrollmentResult = $this->createEnrollmentWithRetry($payment, $nextPaymentDate, $transactionId);
                
                if (!$enrollmentResult['success']) {
                    // Log the failure for monitoring
                    error_log("ENROLLMENT_FAILURE: Transaction $transactionId - " . $enrollmentResult['message']);
                    
                    // Return success for payment but with enrollment warning
                    return [
                        'success' => true,
                        'message' => 'Payment processed successfully, but enrollment creation failed. Please contact support.',
                        'warning' => 'enrollment_failed',
                        'data' => [
                            'transactionId' => $transactionId,
                            'amount' => $payment['amount'],
                            'status' => 'paid',
                            'nextPaymentDate' => $nextPaymentDate,
                            'enrollmentError' => $enrollmentResult['message']
                        ]
                    ];
                }
                
                return [
                    'success' => true,
                    'message' => 'Payment processed successfully',
                    'data' => [
                        'transactionId' => $transactionId,
                        'enrollmentId' => $enrollmentResult['enrollmentId'],
                        'amount' => $payment['amount'],
                        'status' => 'paid',
                        'nextPaymentDate' => $nextPaymentDate
                    ]
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to update payment status'
                ];
            }
        } catch (Exception $e) {
            error_log("PAYMENT_PROCESSING_ERROR: Transaction $transactionId - " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error processing payment: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Industry-level enrollment creation with automatic retry mechanism
     */
    private function createEnrollmentWithRetry($payment, $nextPaymentDate, $transactionId) {
        $maxRetries = 3;
        $retryDelay = 1; // seconds
        
        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                // Check if enrollment already exists (idempotency)
                $existingEnrollment = $this->checkExistingEnrollment($payment['user_id'], $payment['class_id']);
                if ($existingEnrollment) {
                    return [
                        'success' => true,
                        'enrollmentId' => $existingEnrollment['id'],
                        'message' => 'Enrollment already exists'
                    ];
                }
                
                // Create enrollment with transaction
                $this->db->begin_transaction();
                
                try {
                    // Create enrollment
                    $enrollmentStmt = $this->db->prepare("
                        INSERT INTO enrollments (
                            student_id, class_id, enrollment_date, status, payment_status, 
                            total_fee, paid_amount, next_payment_date, created_at
                        ) VALUES (?, ?, NOW(), 'active', 'paid', ?, ?, ?, NOW())
                    ");

                    $userId = $payment['user_id'];
                    $classId = $payment['class_id'];
                    $amount = $payment['amount'];
                    
                    $enrollmentStmt->bind_param("sisds", 
                        $userId, $classId, $amount, $amount, $nextPaymentDate
                    );
                    
                    if (!$enrollmentStmt->execute()) {
                        throw new Exception("Failed to create enrollment: " . $enrollmentStmt->error);
                    }
                    
                    $enrollmentId = $enrollmentStmt->insert_id;
                    
                    // Create payment history record
                    $paymentHistoryStmt = $this->db->prepare("
                        INSERT INTO payment_history (
                            enrollment_id, amount, payment_method, reference_number, status, notes
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    ");
                    
                    $paymentMethod = $payment['payment_method'] ?? 'online';
                    $referenceNumber = $payment['reference_number'] ?? $transactionId;
                    $notes = "Auto-created from payment transaction: $transactionId";
                    $status = 'completed';
                    
                    $paymentHistoryStmt->bind_param("idssss", 
                        $enrollmentId, $amount, $paymentMethod, $referenceNumber, $status, $notes
                    );
                    
                    if (!$paymentHistoryStmt->execute()) {
                        throw new Exception("Failed to create payment history: " . $paymentHistoryStmt->error);
                    }
                    
                    // Update class student count
                    $this->updateClassStudentCount($transactionId);
                    
                    // Commit transaction
                    $this->db->commit();
                    
                    // Log successful enrollment
                    error_log("ENROLLMENT_SUCCESS: Transaction $transactionId - Enrollment ID: $enrollmentId");
                    
                    return [
                        'success' => true,
                        'enrollmentId' => $enrollmentId,
                        'message' => 'Enrollment created successfully'
                    ];
                    
                } catch (Exception $e) {
                    // Rollback transaction
                    $this->db->rollback();
                    throw $e;
                }
                
            } catch (Exception $e) {
                error_log("ENROLLMENT_ATTEMPT_$attempt: Transaction $transactionId - " . $e->getMessage());
                
                if ($attempt < $maxRetries) {
                    // Wait before retry
                    sleep($retryDelay);
                    $retryDelay *= 2; // Exponential backoff
                    continue;
                } else {
                    // All retries failed
                    return [
                        'success' => false,
                        'message' => "Enrollment creation failed after $maxRetries attempts: " . $e->getMessage()
                    ];
                }
            }
        }
        
        return [
            'success' => false,
            'message' => 'Enrollment creation failed - unknown error'
        ];
    }

    /**
     * Check if enrollment already exists (idempotency check)
     */
    private function checkExistingEnrollment($studentId, $classId) {
        $stmt = $this->db->prepare("
            SELECT id, status, payment_status 
            FROM enrollments 
            WHERE student_id = ? AND class_id = ?
        ");
        $stmt->bind_param("si", $studentId, $classId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }
    
    // Create enrollment record from payment
    private function createEnrollmentFromPayment($payment) {
        try {
            // Check if enrollment already exists
            $stmt = $this->db->prepare("
                SELECT id FROM enrollments 
                WHERE class_id = ? AND student_id = ?
            ");
            $classId = $payment['class_id'];
            $userId = $payment['user_id'];
            $stmt->bind_param("ss", $classId, $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                // Enrollment already exists, update payment status
                $paymentStatus = $payment['status'] === 'paid' ? 'paid' : 'pending';
                $paidAmount = $payment['status'] === 'paid' ? $payment['amount'] : 0;
                
                $stmt = $this->db->prepare("
                    UPDATE enrollments 
                    SET payment_status = ?,
                        paid_amount = ?,
                        updated_at = NOW()
                    WHERE class_id = ? AND student_id = ?
                ");
                $stmt->bind_param("sdss", $paymentStatus, $paidAmount, $classId, $userId);
                $stmt->execute();
                return;
                return;
            }
            
            // Create new enrollment
            $paymentStatus = $payment['status'] === 'paid' ? 'paid' : 'pending';
            $paidAmount = $payment['status'] === 'paid' ? $payment['amount'] : 0;
            
            $stmt = $this->db->prepare("
                INSERT INTO enrollments (
                    student_id, class_id, enrollment_date,
                    status, payment_status, total_fee, paid_amount,
                    next_payment_date, created_at
                ) VALUES (?, ?, NOW(), 'active', ?, ?, ?, ?, NOW())
            ");
            
            // INDUSTRY STANDARD: Next payment is always 1st of next month, regardless of purchase date
            $nextPaymentDate = date('Y-m-01', strtotime('+1 month'));
            
            $classId = $payment['class_id'];
            $userId = $payment['user_id'];
            $amount = $payment['amount'];
            
            $stmt->bind_param("sssdss", 
                $userId, $classId, $paymentStatus, $amount, $paidAmount, $nextPaymentDate
            );
            
            $stmt->execute();
            
        } catch (Exception $e) {
            // Log error but don't fail the payment process
            error_log('Error creating enrollment: ' . $e->getMessage());
        }
    }

    // Get payment details by transaction ID
    public function getPaymentByTransactionId($transactionId) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    fr.*,
                    c.class_name,
                    c.subject,
                    c.teacher,
                    c.fee as class_fee
                FROM financial_records fr
                LEFT JOIN classes c ON fr.class_id = c.id
                WHERE fr.transaction_id = ?
            ");

            $stmt->bind_param("s", $transactionId);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                return ['success' => false, 'message' => 'Payment not found'];
            }

            $payment = $result->fetch_assoc();
            return ['success' => true, 'data' => $payment];

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error retrieving payment: ' . $e->getMessage()];
        }
    }

    // Get student's payment history
    public function getStudentPayments($studentId) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    fr.transaction_id,
                    fr.date,
                    fr.class_name,
                    fr.amount,
                    fr.payment_method,
                    fr.status,
                    fr.reference_number,
                    fr.user_id,
                    c.subject,
                    c.teacher
                FROM financial_records fr
                LEFT JOIN classes c ON fr.class_id = c.id
                WHERE fr.user_id = ?
                ORDER BY fr.date DESC
            ");

            $stmt->bind_param("s", $studentId);
            $stmt->execute();
            $result = $stmt->get_result();

            $payments = [];
            while ($row = $result->fetch_assoc()) {
                $payments[] = $row;
            }

            return ['success' => true, 'data' => $payments];

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error retrieving payments: ' . $e->getMessage()];
        }
    }

    // Generate invoice data
    public function generateInvoice($transactionId) {
        try {
            $payment = $this->getPaymentByTransactionId($transactionId);
            if (!$payment['success']) {
                return $payment;
            }

            $data = $payment['data'];
            
            // Generate invoice number
            $invoiceNumber = 'INV' . date('Ymd') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);

            $invoice = [
                'invoiceNumber' => $invoiceNumber,
                'transactionId' => $transactionId,
                'date' => $data['date'],
                'studentName' => $data['student_name'] ?? $data['person_name'] ?? 'Student',
                'studentMobile' => $data['student_mobile'] ?? '',
                'className' => $data['class_name'],
                'subject' => $data['subject'],
                'teacher' => $data['teacher'],
                'amount' => $data['amount'],
                'paymentMethod' => $data['payment_method'],
                'status' => $data['status'],
                'referenceNumber' => $data['reference_number']
            ];

            return ['success' => true, 'data' => $invoice];

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error generating invoice: ' . $e->getMessage()];
        }
    }

    // Update class student count after successful payment
    private function updateClassStudentCount($transactionId) {
        try {
            $stmt = $this->db->prepare("
                UPDATE classes c
                SET current_students = current_students + 1
                WHERE c.id = (
                    SELECT fr.class_id 
                    FROM financial_records fr 
                    WHERE fr.transaction_id = ?
                )
            ");

            $stmt->bind_param("s", $transactionId);
            $stmt->execute();

        } catch (Exception $e) {
            // Log error but don't fail the payment process
            error_log("Error updating class student count: " . $e->getMessage());
        }
    }

    // Get payment statistics
    public function getPaymentStats($studentId = null) {
        try {
            $whereClause = $studentId ? "WHERE fr.user_id = ?" : "";
            $params = $studentId ? [$studentId] : [];

            $stmt = $this->db->prepare("
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN fr.status = 'paid' THEN 1 ELSE 0 END) as paid_payments,
                    SUM(CASE WHEN fr.status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
                    SUM(CASE WHEN fr.status = 'paid' THEN fr.amount ELSE 0 END) as total_amount
                FROM financial_records fr
                $whereClause
            ");

            if ($studentId) {
                $stmt->bind_param("s", $studentId);
            }

            $stmt->execute();
            $result = $stmt->get_result();
            $stats = $result->fetch_assoc();

            return ['success' => true, 'data' => $stats];

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error retrieving payment stats: ' . $e->getMessage()];
        }
    }
}
?> 