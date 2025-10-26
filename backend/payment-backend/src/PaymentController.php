<?php
// Set timezone for all date/time operations
date_default_timezone_set('Asia/Colombo');

require_once __DIR__ . '/config.php';

class PaymentController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Create a new payment record
    public function createPayment($data) {
        try {
            // Generate unique transaction ID
            $transactionId = 'TXN' . date('Ymd') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
            
            // Get student information
            $studentId = $data['studentId'] ?? '';
            // Use actual student details if provided
            $firstName = $data['firstName'] ?? '';
            $lastName = $data['lastName'] ?? '';
            $email = $data['email'] ?? '';
            $mobile = $data['mobile'] ?? '';
            $address = $data['address'] ?? '';
            $district = $data['district'] ?? '';
            
            $studentName = trim($firstName . ' ' . $lastName) ?: ($data['studentName'] ?? 'Student');

            // Get class information from class backend
            $classId = $data['classId'] ?? '';
            $paymentType = $data['paymentType'] ?? 'class_payment';
            
            // For admission_fee, classId is optional (can be collected before class enrollment)
            if ($paymentType === 'admission_fee' && empty($classId)) {
                // Admission fee without class - use default values
                $class = [
                    'className' => 'Admission Fee',
                    'fee' => 0
                ];
            } else {
                // For class payments, classId is required
                $class = $this->getClassFromClassBackend($classId);
                if (!$class) {
                    return ['success' => false, 'message' => 'Class not found'];
                }
            }

            // Check if this is a renewal payment (indicated by payment method or notes)
            $isRenewal = isset($data['isRenewal']) && $data['isRenewal'] === true;
            $isRenewalFromNotes = isset($data['notes']) && (
                strpos($data['notes'], 'Renewal Payment') !== false ||
                strpos($data['notes'], 'Early Payment') !== false ||
                strpos($data['notes'], 'Next Month Renewal') !== false
            );
            
            // Check if student is already enrolled ONLY for online/new enrollments
            // Skip this check for physical/cashier payments (they're for existing enrollments)
            // Also skip for admission_fee payments without a classId
            // Also skip for renewal payments
            $channel = $data['channel'] ?? 'online';
            if ($channel !== 'physical' && !empty($classId) && !$isRenewal && !$isRenewalFromNotes) {
                // Check if student is already enrolled in this class (only check paid enrollments)
                $isEnrolled = $this->checkStudentEnrollmentFromClassBackend($studentId, $classId);
                if ($isEnrolled) {
                    return [
                        'success' => false, 
                        'message' => 'You are already enrolled in this class. Use "Pay Early" or "Renew Payment" for monthly payments.'
                    ];
                }
            } else if (($isRenewal || $isRenewalFromNotes) && !empty($classId)) {
                // For renewals, verify the student IS enrolled
                $isEnrolled = $this->checkStudentEnrollmentFromClassBackend($studentId, $classId);
                if (!$isEnrolled) {
                    return [
                        'success' => false, 
                        'message' => 'Cannot process renewal payment - you are not enrolled in this class yet.'
                    ];
                }
            }

            // CRITICAL: Prevent duplicate payment for the same class in the same month
            // BUT: Only check for class_payment duplicates, NOT admission_fee (admission fee is one-time)
            // IMPORTANT: Only apply duplicate check for class_payment type, not admission_fee
            // $paymentType already defined above
            
            if ($paymentType === 'class_payment') {
                $currentMonth = date('Y-m');
                $dupCheckStmt = $this->db->prepare("
                    SELECT COUNT(*) as payment_count, MAX(date) as last_payment 
                    FROM financial_records 
                    WHERE user_id = ? 
                    AND class_id = ? 
                    AND DATE_FORMAT(date, '%Y-%m') = ?
                    AND status = 'paid'
                    AND type = 'income'
                    AND payment_type = 'class_payment'
                ");
                $dupCheckStmt->bind_param("sis", $studentId, $classId, $currentMonth);
                $dupCheckStmt->execute();
                $dupResult = $dupCheckStmt->get_result()->fetch_assoc();
                
                if ($dupResult && $dupResult['payment_count'] > 0) {
                    error_log("DUPLICATE_PAYMENT_BLOCKED: Student $studentId attempted duplicate payment for class $classId in month $currentMonth");
                    return [
                        'success' => false,
                        'message' => 'Payment for this class has already been made this month (Last payment: ' . $dupResult['last_payment'] . '). Please wait until next month.',
                        'error_code' => 'DUPLICATE_PAYMENT_BLOCKED'
                    ];
                }
            }

            // Use the final amount calculated by frontend (includes all discounts and fees)
            $finalAmount = $data['amount'] ?? $class['fee'] ?? 0;

            // Create financial record
            $stmt = $this->db->prepare("
                INSERT INTO financial_records (
                    transaction_id, date, type, category, person_name, user_id, person_role,
                    class_name, class_id, amount, status, payment_method, reference_number, notes, created_by, payment_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $date = date('Y-m-d');
            $type = 'income';
            $category = ($paymentType === 'admission_fee') ? 'admission_fee' : 'class_enrollment';
            $personName = $studentName;
            $userId = $studentId; // Use studentId as user_id
            $personRole = 'student';
            $className = $class['className'] ?? '';
            // For admission fee without class, classId will be empty
            $classIdValue = !empty($classId) ? $classId : null;
            // For cash payments, status should be 'paid' immediately
            $status = ($data['paymentMethod'] === 'cash' || $data['status'] === 'paid') ? 'paid' : 'pending';
            $paymentMethod = $data['paymentMethod'] ?? 'online';
            $referenceNumber = $transactionId;
            
            // Create comprehensive notes with student details
            $studentDetails = [];
            if ($firstName) $studentDetails[] = "First Name: $firstName";
            if ($lastName) $studentDetails[] = "Last Name: $lastName";
            if ($email) $studentDetails[] = "Email: $email";
            if ($mobile) $studentDetails[] = "Mobile: $mobile";
            if ($address) $studentDetails[] = "Address: $address";
            if ($district) $studentDetails[] = "District: $district";
            
            $baseNotes = $data['notes'] ?? '';
            $notes = $baseNotes;
            if (!empty($studentDetails)) {
                $notes = $baseNotes . (empty($baseNotes) ? '' : ' | ') . implode(', ', $studentDetails);
            }
            
            // Get cashier ID from request data (who is creating this payment)
            $createdBy = $data['cashierId'] ?? $data['createdBy'] ?? $studentId; // Fallback to studentId for backward compatibility

            $stmt->bind_param("ssssssssidssssss", 
                $transactionId, $date, $type, $category, $personName, $userId, $personRole,
                $className, $classIdValue, $finalAmount, $status, $paymentMethod, $referenceNumber, $notes, $createdBy, $paymentType
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
                SET status = 'paid'
                WHERE transaction_id = ?
            ");
            
            if ($updateStmt->execute([$transactionId])) {
                // Step 3: Get class payment tracking configuration from class backend
                $classDetails = $this->getClassFromClassBackend($payment['class_id']);
                
                // Step 4: Calculate payment tracking dates (INDUSTRY STANDARD)
                $paymentTrackingEnabled = $classDetails ? ($classDetails['payment_tracking'] ?? false) : false;
                $freeDays = $classDetails ? ($classDetails['payment_tracking_free_days'] ?? 7) : 7;
                
                // INDUSTRY STANDARD: Next payment due date = 1st of next month + free days
                // This ensures consistent billing cycles and proper grace period calculation
                $firstOfNextMonth = date('Y-m-01', strtotime('+1 month'));
                $nextPaymentDate = date('Y-m-d', strtotime($firstOfNextMonth . ' +' . $freeDays . ' days'));
                
                // Calculate grace period end date (same as next payment date)
                $gracePeriodEndDate = $nextPaymentDate;
                
                // Log the payment tracking calculation for debugging
                error_log("PAYMENT_TRACKING_CALC: Transaction $transactionId - Next Payment: $nextPaymentDate, Grace Period End: $gracePeriodEndDate, Free Days: $freeDays, Tracking Enabled: " . ($paymentTrackingEnabled ? 'Yes' : 'No'));
                
                // Step 5: Create payment history JSON
                $paymentHistory = json_encode([[
                    'date' => date('Y-m-d'),
                    'amount' => $payment['amount'],
                    'method' => $paymentData['paymentMethod'] ?? 'online',
                    'status' => 'completed',
                    'transactionId' => $transactionId,
                    'referenceNumber' => $paymentData['referenceNumber'] ?? $transactionId,
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
                
                // Create enrollment in class backend
                try {
                    $userId = $payment['user_id'];
                    $classId = $payment['class_id'];
                    $amount = $payment['amount'];
                    
                    $enrollmentData = [
                        'student_id' => $userId,
                        'class_id' => $classId,
                        'payment_status' => 'paid',
                        'total_fee' => $amount,
                        'paid_amount' => $amount,
                        'next_payment_date' => $nextPaymentDate,
                        'status' => 'active'
                    ];
                    
                    $url = "http://class-backend/routes.php/create_enrollment";
                    $context = stream_context_create([
                        'http' => [
                            'method' => 'POST',
                            'header' => 'Content-Type: application/json',
                            'content' => json_encode($enrollmentData)
                        ]
                    ]);
                    
                    $response = file_get_contents($url, false, $context);
                    
                    if ($response === FALSE) {
                        throw new Exception("Failed to create enrollment in class backend");
                    }
                    
                    $enrollmentResult = json_decode($response, true);
                    
                    if (!$enrollmentResult || !isset($enrollmentResult['success']) || !$enrollmentResult['success']) {
                        throw new Exception("Enrollment creation failed in class backend: " . ($enrollmentResult['message'] ?? 'Unknown error'));
                    }
                    
                    $enrollmentId = $enrollmentResult['enrollmentId'] ?? 'unknown';
                    
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
        // Check enrollment from class backend
        return $this->checkStudentEnrollmentFromClassBackend($studentId, $classId);
    }
    
    // Create enrollment record from payment
    private function createEnrollmentFromPayment($payment) {
        try {
            $classId = $payment['class_id'];
            $userId = $payment['user_id'];
            
            // Check if enrollment already exists using cross-service call
            $isEnrolled = $this->checkStudentEnrollmentFromClassBackend($userId, $classId);
            
            if ($isEnrolled) {
                // Enrollment already exists, update payment status
                $paymentStatus = $payment['status'] === 'paid' ? 'paid' : 'pending';
                $paidAmount = $payment['status'] === 'paid' ? $payment['amount'] : 0;
                
                // Update enrollment in class backend
                $enrollmentData = [
                    'classId' => $classId,
                    'studentId' => $userId,
                    'paymentStatus' => $paymentStatus,
                    'paidAmount' => $paidAmount
                ];
                
                $url = "http://class-backend/routes.php/update_enrollment_payment";
                $context = stream_context_create([
                    'http' => [
                        'method' => 'POST',
                        'header' => 'Content-Type: application/json',
                        'content' => json_encode($enrollmentData)
                    ]
                ]);
                
                $response = file_get_contents($url, false, $context);
                return;
            }
            
            // Create new enrollment in class backend
            $paymentStatus = $payment['status'] === 'paid' ? 'paid' : 'pending';
            $paidAmount = $payment['status'] === 'paid' ? $payment['amount'] : 0;
            
            // Get class details to calculate next payment date with free days
            $classDetails = $this->getClassFromClassBackend($payment['class_id']);
            $freeDays = $classDetails ? ($classDetails['payment_tracking_free_days'] ?? 7) : 7;
            
            // INDUSTRY STANDARD: Next payment due date = 1st of next month + free days
            $firstOfNextMonth = date('Y-m-01', strtotime('+1 month'));
            $nextPaymentDate = date('Y-m-d', strtotime($firstOfNextMonth . ' +' . $freeDays . ' days'));
            
            $classId = $payment['class_id'];
            $userId = $payment['user_id'];
            $amount = $payment['amount'];
            
            $enrollmentData = [
                'student_id' => $userId,
                'class_id' => $classId,
                'payment_status' => $paymentStatus,
                'total_fee' => $amount,
                'paid_amount' => $paidAmount,
                'next_payment_date' => $nextPaymentDate,
                'status' => 'active'
            ];
            
            $url = "http://class-backend/routes.php/create_enrollment";
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: application/json',
                    'content' => json_encode($enrollmentData)
                ]
            ]);
            
            $response = file_get_contents($url, false, $context);
            
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
                    fr.*
                FROM financial_records fr
                WHERE fr.transaction_id = ?
            ");

            $stmt->bind_param("s", $transactionId);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                return ['success' => false, 'message' => 'Payment not found'];
            }

            $payment = $result->fetch_assoc();
            
            // Get class details from class backend
            if (isset($payment['class_id'])) {
                $classDetails = $this->getClassFromClassBackend($payment['class_id']);
                if ($classDetails) {
                    $payment['class_name'] = $classDetails['className'] ?? '';
                    $payment['subject'] = $classDetails['subject'] ?? '';
                    $payment['teacher'] = $classDetails['teacher'] ?? '';
                    $payment['class_fee'] = $classDetails['fee'] ?? 0;
                }
            }
            
            return ['success' => true, 'data' => $payment];

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error retrieving payment: ' . $e->getMessage()];
        }
    }

    // Get student's payment history
    public function getStudentPayments($studentId) {
        try {
            // Get payments from financial_records table (INCLUDING admission_fee payments)
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
                    fr.class_id,
                    fr.payment_type,
                    fr.category,
                    fr.type
                FROM financial_records fr
                WHERE fr.user_id = ?
                ORDER BY fr.date DESC
            ");

            $stmt->bind_param("s", $studentId);
            $stmt->execute();
            $result = $stmt->get_result();

            $payments = [];
            while ($row = $result->fetch_assoc()) {
                // Get class details from class backend (if class_id exists)
                if (isset($row['class_id']) && $row['class_id']) {
                    $classDetails = $this->getClassFromClassBackend($row['class_id']);
                    if ($classDetails) {
                        $row['subject'] = $classDetails['subject'] ?? '';
                        $row['teacher'] = $classDetails['teacher'] ?? '';
                        
                        // If class_name is empty but we have class details, set it
                        if (empty($row['class_name']) && isset($classDetails['className'])) {
                            $row['class_name'] = $classDetails['className'];
                        }
                    }
                }
                $payments[] = $row;
            }


            // Also get payments from payments table (PayHere payments)
            $stmt2 = $this->db->prepare("
                SELECT 
                    p.order_id as transaction_id,
                    p.created_at as date,
                    p.amount,
                    p.payment_method,
                    p.status,
                    p.student_id as user_id,
                    p.class_id
                FROM payments p
                WHERE p.student_id = ?
                ORDER BY p.created_at DESC
            ");

            $stmt2->bind_param("s", $studentId);
            $stmt2->execute();
            $result2 = $stmt2->get_result();

            while ($row = $result2->fetch_assoc()) {
                // Get class details from class backend
                if (isset($row['class_id'])) {
                    $classDetails = $this->getClassFromClassBackend($row['class_id']);
                    if ($classDetails) {
                        $row['class_name'] = $classDetails['className'] ?? '';
                        $row['subject'] = $classDetails['subject'] ?? '';
                        $row['teacher'] = $classDetails['teacher'] ?? '';
                    }
                }
                $payments[] = $row;
            }

            // Sort all payments by date (newest first)
            usort($payments, function($a, $b) {
                return strtotime($b['date']) - strtotime($a['date']);
            });

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

    // Get all payments
    public function getAllPayments() {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    fr.transaction_id,
                    fr.date,
                    fr.person_name,
                    fr.user_id,
                    fr.class_name,
                    fr.class_id,
                    fr.amount,
                    fr.status,
                    fr.payment_method,
                    fr.category as payment_type,
                    fr.reference_number,
                    fr.notes,
                    fr.delivery_status,
                    fr.created_at
                FROM financial_records fr
                WHERE fr.type = 'income' AND fr.category = 'class_enrollment'
                ORDER BY fr.date DESC
            ");

            $stmt->execute();
            $result = $stmt->get_result();
            $payments = [];

            while ($row = $result->fetch_assoc()) {
                $payments[] = [
                    'transaction_id' => $row['transaction_id'],
                    'date' => $row['date'],
                    'person_name' => $row['person_name'],
                    'user_id' => $row['user_id'],
                    'class_name' => $row['class_name'],
                    'class_id' => $row['class_id'],
                    'amount' => $row['amount'],
                    'status' => $row['status'],
                    'payment_method' => $row['payment_method'],
                    'payment_type' => $row['payment_type'],
                    'reference_number' => $row['reference_number'],
                    'notes' => $row['notes'],
                    'delivery_status' => $row['delivery_status'] ?? null,
                    'created_at' => $row['created_at'] ?? null
                ];
            }

            return ['success' => true, 'data' => $payments];

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error retrieving payments: ' . $e->getMessage()];
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

    // Get cashier statistics (daily or monthly)
    public function getCashierStats($cashierId, $period = 'today') {
        try {
            // Determine date range based on period
            // Note: Using CURDATE() ensures data persists for entire day (not reset on logout/login)
            // Data automatically resets at midnight when new day starts
            if ($period === 'today') {
                $dateCondition = "DATE(fr.created_at) = CURDATE()";
            } elseif ($period === 'month') {
                $dateCondition = "YEAR(fr.created_at) = YEAR(CURDATE()) AND MONTH(fr.created_at) = MONTH(CURDATE())";
            } elseif ($period === 'all') {
                $dateCondition = "1=1"; // No date filter
            } else {
                // Custom date range: period should be in format 'YYYY-MM-DD'
                $dateCondition = "DATE(fr.created_at) = ?";
            }

            // Query to get cashier statistics
            $sql = "
                SELECT 
                    COUNT(*) as total_receipts,
                    SUM(CASE WHEN fr.status = 'paid' THEN fr.amount ELSE 0 END) as total_collected,
                    SUM(CASE WHEN fr.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                    SUM(CASE WHEN fr.status = 'paid' AND fr.payment_method = 'cash' THEN fr.amount ELSE 0 END) as cash_collected,
                    SUM(CASE WHEN fr.status = 'paid' AND fr.payment_method = 'card' THEN fr.amount ELSE 0 END) as card_collected,
                    SUM(CASE WHEN fr.status = 'paid' AND fr.payment_type = 'admission_fee' THEN fr.amount ELSE 0 END) as admission_fees,
                    SUM(CASE WHEN fr.status = 'paid' AND fr.payment_type = 'class_payment' THEN fr.amount ELSE 0 END) as class_payments,
                    MIN(fr.created_at) as first_transaction,
                    MAX(fr.created_at) as last_transaction
                FROM financial_records fr
                WHERE fr.created_by = ? 
                AND fr.type = 'income'
                AND $dateCondition
            ";

            $stmt = $this->db->prepare($sql);
            
            if ($period !== 'today' && $period !== 'month' && $period !== 'all') {
                $stmt->bind_param("ss", $cashierId, $period);
            } else {
                $stmt->bind_param("s", $cashierId);
            }

            $stmt->execute();
            $result = $stmt->get_result();
            $stats = $result->fetch_assoc();

            // Get recent transactions for this cashier
            $recentSql = "
                SELECT 
                    fr.transaction_id,
                    fr.date,
                    fr.created_at,
                    fr.person_name,
                    fr.user_id,
                    fr.class_name,
                    fr.class_id,
                    fr.amount,
                    fr.status,
                    fr.payment_method,
                    fr.payment_type,
                    fr.notes
                FROM financial_records fr
                WHERE fr.created_by = ?
                AND $dateCondition
                AND fr.type = 'income'
                ORDER BY fr.created_at DESC
                LIMIT 50
            ";

            $recentStmt = $this->db->prepare($recentSql);
            
            if ($period !== 'today' && $period !== 'month' && $period !== 'all') {
                $recentStmt->bind_param("ss", $cashierId, $period);
            } else {
                $recentStmt->bind_param("s", $cashierId);
            }

            $recentStmt->execute();
            $recentResult = $recentStmt->get_result();
            
            $transactions = [];
            $classCache = []; // Cache class data to avoid repeated API calls
            
            while ($row = $recentResult->fetch_assoc()) {
                // Fetch teacher information from class backend if class_id exists
                if (!empty($row['class_id'])) {
                    $classId = $row['class_id'];
                    
                    // Check cache first
                    if (!isset($classCache[$classId])) {
                        $classDetails = $this->getClassFromClassBackend($classId);
                        $classCache[$classId] = $classDetails;
                    }
                    
                    if ($classCache[$classId]) {
                        $row['teacher'] = $classCache[$classId]['teacher'] ?? '';
                        $row['teacher_name'] = $classCache[$classId]['teacher'] ?? '';
                    }
                }
                
                $transactions[] = $row;
            }
            
            // Aggregate per-class data
            $perClass = [];
            $classMap = [];
            
            foreach ($transactions as $tx) {
                $className = $tx['class_name'] ?? 'Unspecified';
                $classId = $tx['class_id'] ?? null;
                
                if (!isset($classMap[$className])) {
                    $classMap[$className] = [
                        'class_name' => $className,
                        'teacher' => $tx['teacher'] ?? $tx['teacher_name'] ?? '-',
                        'full_count' => 0,
                        'half_count' => 0,
                        'free_count' => 0,
                        'total_amount' => 0,
                        'tx_count' => 0
                    ];
                }
                
                // Count both class_payment and admission_fee transactions
                $paymentType = $tx['payment_type'] ?? '';
                if ($paymentType === 'class_payment' || $paymentType === 'admission_fee') {
                    $classMap[$className]['tx_count']++;
                    $classMap[$className]['total_amount'] += floatval($tx['amount'] ?? 0);
                    
                    // Only analyze card type for class_payment (admission fees don't use cards)
                    if ($paymentType === 'class_payment') {
                        // Determine card type with flexible pattern matching
                        $notes = strtolower($tx['notes'] ?? '');
                        $amount = floatval($tx['amount'] ?? 0);
                        
                        $isFreeCard = false;
                        $isHalfCard = false;
                        
                        // Check for FREE CARD patterns
                        if (strpos($notes, 'full free card') !== false) {
                            $isFreeCard = true;
                        } elseif (strpos($notes, '100%') !== false || strpos($notes, '100 %') !== false) {
                            $isFreeCard = true;
                        } elseif ($amount == 0 && (
                            strpos($notes, 'free card') !== false ||
                            strpos($notes, 'complimentary') !== false ||
                            strpos($notes, 'free') !== false
                        )) {
                            $isFreeCard = true;
                        }
                        
                        // Check for HALF CARD patterns
                        if (!$isFreeCard) {
                            if (strpos($notes, 'half free card') !== false) {
                                $isHalfCard = true;
                            } elseif (strpos($notes, '50%') !== false || strpos($notes, '50 %') !== false) {
                                $isHalfCard = true;
                            } elseif (strpos($notes, 'half') !== false && strpos($notes, 'discount') !== false) {
                                $isHalfCard = true;
                            }
                        }
                        
                        // Count the card type
                        if ($isFreeCard) {
                            $classMap[$className]['free_count']++;
                        } elseif ($isHalfCard) {
                            $classMap[$className]['half_count']++;
                        } else {
                            $classMap[$className]['full_count']++;
                        }
                    }
                }
            }
            
            // Convert to array and sort by total amount
            $perClass = array_values($classMap);
            usort($perClass, function($a, $b) {
                return $b['total_amount'] - $a['total_amount'];
            });
            
            // Calculate overall card counts from transactions
            $fullCardsIssued = 0;
            $halfCardsIssued = 0;
            $freeCardsIssued = 0;
            
            error_log("====== Starting Card Count Calculation ======");
            error_log("Total transactions to process: " . count($transactions));
            
            foreach ($transactions as $tx) {
                error_log("TX ID: " . ($tx['transaction_id'] ?? 'unknown') . " | Type: " . ($tx['payment_type'] ?? 'unknown') . " | Status: " . ($tx['status'] ?? 'unknown'));
                
                // Only count paid class payments
                if (($tx['payment_type'] ?? '') === 'class_payment' && ($tx['status'] ?? '') === 'paid') {
                    $notes = strtolower($tx['notes'] ?? '');
                    $amount = floatval($tx['amount'] ?? 0);
                    
                    // Log for debugging
                    error_log("Processing TX: " . ($tx['transaction_id'] ?? 'unknown'));
                    error_log("  Notes: " . $notes);
                    error_log("  Amount: " . $amount);
                    
                    // Determine card type with flexible pattern matching
                    $isFreeCard = false;
                    $isHalfCard = false;
                    
                    // Check for FREE CARD patterns (check multiple variations)
                    if (strpos($notes, 'full free card') !== false) {
                        $isFreeCard = true;
                    } elseif (strpos($notes, '100%') !== false || strpos($notes, '100 %') !== false) {
                        $isFreeCard = true;
                    } elseif ($amount == 0 && (
                        strpos($notes, 'free card') !== false ||
                        strpos($notes, 'complimentary') !== false ||
                        strpos($notes, 'free') !== false
                    )) {
                        $isFreeCard = true;
                    }
                    
                    // Check for HALF CARD patterns (only if not already identified as free)
                    if (!$isFreeCard) {
                        if (strpos($notes, 'half free card') !== false) {
                            $isHalfCard = true;
                        } elseif (strpos($notes, '50%') !== false || strpos($notes, '50 %') !== false) {
                            $isHalfCard = true;
                        } elseif (strpos($notes, 'half') !== false && strpos($notes, 'discount') !== false) {
                            $isHalfCard = true;
                        }
                    }
                    
                    // Count the card type
                    if ($isFreeCard) {
                        $freeCardsIssued++;
                        error_log("  -> Counted as FREE card");
                    } elseif ($isHalfCard) {
                        $halfCardsIssued++;
                        error_log("  -> Counted as HALF card");
                    } else {
                        $fullCardsIssued++;
                        error_log("  -> Counted as FULL card");
                    }
                }
            }
            
            // Add card counts to stats
            $stats['full_cards_issued'] = $fullCardsIssued;
            $stats['half_cards_issued'] = $halfCardsIssued;
            $stats['free_cards_issued'] = $freeCardsIssued;
            
            error_log("====== Final Card Counts ======");
            error_log("Full Cards: $fullCardsIssued");
            error_log("Half Cards: $halfCardsIssued");
            error_log("Free Cards: $freeCardsIssued");
            error_log("============================");

            return [
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'transactions' => $transactions,
                    'perClass' => $perClass,
                    'period' => $period,
                    'cashierId' => $cashierId
                ]
            ];

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error retrieving cashier stats: ' . $e->getMessage()];
        }
    }

    // Helper method to get class information from class backend
    private function getClassFromClassBackend($classId) {
        try {
            $url = "http://class-backend/routes.php/get_class_by_id?id=" . $classId;
            $response = file_get_contents($url);
            
            if ($response === FALSE) {
                error_log("Failed to fetch class from class backend: " . $classId);
                return null;
            }
            
            $classData = json_decode($response, true);
            
            // Class backend returns data wrapped in success/data structure
            if ($classData && isset($classData['success']) && $classData['success'] && isset($classData['data'])) {
                return $classData['data'];
            }
            
            return null;
        } catch (Exception $e) {
            error_log("Error fetching class from class backend: " . $e->getMessage());
            return null;
        }
    }

    // Helper method to check student enrollment from class backend
    private function checkStudentEnrollmentFromClassBackend($studentId, $classId) {
        try {
            $url = "http://class-backend/routes.php/get_enrollments_by_student?studentId=" . $studentId;
            $response = file_get_contents($url);
            
            if ($response === FALSE) {
                error_log("Failed to fetch enrollments from class backend for student: " . $studentId);
                return false;
            }
            
            $enrollmentData = json_decode($response, true);
            
            if (isset($enrollmentData['success']) && $enrollmentData['success'] && isset($enrollmentData['data'])) {
                foreach ($enrollmentData['data'] as $enrollment) {
                    if ($enrollment['class_id'] == $classId && $enrollment['payment_status'] === 'paid') {
                        return true;
                    }
                }
            }
            
            return false;
        } catch (Exception $e) {
            error_log("Error checking enrollment from class backend: " . $e->getMessage());
            return false;
        }
    }
}
?> 