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

            // Check if student is already enrolled in this class
            $checkEnrollmentStmt = $this->db->prepare("
                SELECT id, payment_status FROM enrollments 
                WHERE student_id = ? AND class_id = ?
            ");
            $checkEnrollmentStmt->bind_param("ss", $studentId, $classId);
            $checkEnrollmentStmt->execute();
            $enrollmentResult = $checkEnrollmentStmt->get_result();
            
            if ($enrollmentResult->num_rows > 0) {
                $existingEnrollment = $enrollmentResult->fetch_assoc();
                if ($existingEnrollment['payment_status'] === 'paid') {
                    return [
                        'success' => false, 
                        'message' => 'You are already enrolled in this class'
                    ];
                } else if ($existingEnrollment['payment_status'] === 'pending') {
                    return [
                        'success' => false, 
                        'message' => 'You have a pending payment for this class'
                    ];
                }
            }

            // Calculate payment details
            $baseAmount = $class['fee'] ?? 0;
            $discount = $data['discount'] ?? 0;
            $finalAmount = $baseAmount - $discount;

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
                'message' => 'Payment created successfully',
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
            // Get payment record
            $stmt = $this->db->prepare("
                SELECT * FROM financial_records 
                WHERE transaction_id = ?
            ");
            $stmt->bind_param("s", $transactionId);
            $stmt->execute();
            $result = $stmt->get_result();
            $payment = $result->fetch_assoc();
            
            if (!$payment) {
                return [
                    'success' => false,
                    'message' => 'Payment record not found'
                ];
            }
            
            // Update payment status
            $stmt = $this->db->prepare("
                UPDATE financial_records 
                SET status = 'paid', 
                    payment_method = ?, 
                    reference_number = ?,
                    updated_at = NOW()
                WHERE transaction_id = ?
            ");
            $stmt->bind_param("sss", 
                $paymentData['paymentMethod'], 
                $paymentData['referenceNumber'], 
                $transactionId
            );
            
            if ($stmt->execute()) {
                // Get class payment tracking configuration
                $classStmt = $this->db->prepare("SELECT payment_tracking, payment_tracking_free_days FROM classes WHERE id = ?");
                $classStmt->bind_param("i", $payment['class_id']);
                $classStmt->execute();
                $classResult = $classStmt->get_result();
                $classData = $classResult->fetch_assoc();
                
                // Check if payment tracking is enabled for this class
                $paymentTrackingEnabled = $classData ? $classData['payment_tracking'] : false;
                $freeDays = $classData ? $classData['payment_tracking_free_days'] : 7;
                
                // Always calculate next payment date: 1st day of next month (for both enabled and disabled)
                $nextPaymentDate = date('Y-m-01', strtotime('+1 month'));
                
                // Calculate grace period end date only if payment tracking is enabled
                if ($paymentTrackingEnabled) {
                    // Payment tracking enabled: next payment date + free days
                    $gracePeriodEndDate = date('Y-m-d', strtotime($nextPaymentDate . ' +' . $freeDays . ' days'));
                } else {
                    // Payment tracking disabled: no grace period (payment due immediately on next payment date)
                    $gracePeriodEndDate = $nextPaymentDate;
                }
                
                // Create payment history JSON with updated information
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
                
                // Create enrollment record ONLY after successful payment
                $enrollmentStmt = $this->db->prepare("
                    INSERT INTO enrollments (
                        student_id, class_id, enrollment_date, fee_amount, payment_status, 
                        payment_method, transaction_id, next_payment_date, payment_history, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");

                $enrollmentStatus = 'paid';
                $enrollmentDate = date('Y-m-d');
                
                $enrollmentStmt->bind_param("sisdsssss", 
                    $payment['user_id'], $payment['class_id'], $enrollmentDate, $payment['amount'], $enrollmentStatus, 
                    $paymentData['paymentMethod'], $transactionId, $nextPaymentDate, $paymentHistory
                );
                
                if (!$enrollmentStmt->execute()) {
                    return ['success' => false, 'message' => 'Failed to create enrollment record'];
                }
                
                $enrollmentId = $enrollmentStmt->insert_id;
                
                // Create payment history record with enrollment_id
                $paymentHistoryStmt = $this->db->prepare("
                    INSERT INTO payment_history (
                        enrollment_id, amount, payment_method, reference_number, status, notes
                    ) VALUES (?, ?, ?, ?, ?, ?)
                ");
                $paymentHistoryStmt->bind_param("idssss", 
                    $enrollmentId, $payment['amount'], $paymentData['paymentMethod'], $paymentData['referenceNumber'], 'completed', $paymentData['notes'] ?? ''
                );
                $paymentHistoryStmt->execute();
                
                return [
                    'success' => true,
                    'message' => 'Payment processed successfully',
                    'data' => [
                        'transactionId' => $transactionId,
                        'enrollmentId' => $enrollmentId,
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
            return [
                'success' => false,
                'message' => 'Error processing payment: ' . $e->getMessage()
            ];
        }
    }
    
    // Create enrollment record from payment
    private function createEnrollmentFromPayment($payment) {
        try {
            // Check if enrollment already exists
            $stmt = $this->db->prepare("
                SELECT id FROM enrollments 
                WHERE class_id = ? AND student_id = ?
            ");
            $stmt->bind_param("ss", $payment['class_id'], $payment['user_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                // Enrollment already exists, update payment status
                $stmt = $this->db->prepare("
                    UPDATE enrollments 
                    SET payment_status = 'paid',
                        updated_at = NOW()
                    WHERE class_id = ? AND student_id = ?
                ");
                $stmt->bind_param("ss", $payment['class_id'], $payment['user_id']);
                $stmt->execute();
                return;
            }
            
            // Create new enrollment
            $stmt = $this->db->prepare("
                INSERT INTO enrollments (
                    class_id, student_id, student_name, enrollment_date,
                    status, payment_status, payment_method, amount_paid,
                    next_payment_date, attendance_data, payment_history,
                    forget_card_requested, late_payment_requested,
                    created_at
                ) VALUES (?, ?, ?, NOW(), 'enrolled', 'paid', ?, ?, ?, '[]', ?, '0', '0', NOW())
            ");
            
            $nextPaymentDate = date('Y-m-d', strtotime('+30 days'));
            $paymentHistory = json_encode([[
                'date' => date('Y-m-d'),
                'amount' => $payment['amount'],
                'method' => $payment['payment_method'],
                'status' => 'paid',
                'transactionId' => $payment['transaction_id']
            ]]);
            
            $stmt->bind_param("ssssdss", 
                $payment['class_id'],
                $payment['user_id'],
                $payment['person_name'],
                $payment['payment_method'],
                $payment['amount'],
                $nextPaymentDate,
                $paymentHistory
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
                    e.student_id,
                    e.class_id,
                    e.enrollment_date,
                    c.class_name,
                    c.subject,
                    c.teacher,
                    c.fee as class_fee
                FROM financial_records fr
                LEFT JOIN enrollments e ON fr.transaction_id = e.transaction_id
                LEFT JOIN classes c ON e.class_id = c.id
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
                LEFT JOIN enrollments e ON fr.transaction_id = e.transaction_id
                LEFT JOIN classes c ON e.class_id = c.id
                WHERE e.student_id = ?
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
                    SELECT e.class_id 
                    FROM enrollments e 
                    WHERE e.transaction_id = ?
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
            $whereClause = $studentId ? "WHERE e.student_id = ?" : "";
            $params = $studentId ? [$studentId] : [];

            $stmt = $this->db->prepare("
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN fr.status = 'paid' THEN 1 ELSE 0 END) as paid_payments,
                    SUM(CASE WHEN fr.status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
                    SUM(CASE WHEN fr.status = 'paid' THEN fr.amount ELSE 0 END) as total_amount
                FROM financial_records fr
                LEFT JOIN enrollments e ON fr.transaction_id = e.transaction_id
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