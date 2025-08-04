<?php
require_once __DIR__ . '/config.php';

class EnrollmentController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Get all enrollments for a student
    public function getStudentEnrollments($studentId) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    e.*,
                    c.class_name,
                    c.subject,
                    c.teacher,
                    c.stream,
                    c.delivery_method,
                    c.course_type,
                    c.fee,
                    c.max_students,
                    c.status as class_status,
                    c.zoom_link,
                    c.description,
                    c.schedule_day,
                    c.schedule_start_time,
                    c.schedule_end_time,
                    c.schedule_frequency,
                    c.start_date,
                    c.end_date,
                    c.current_students,
                    c.payment_tracking,
                    c.payment_tracking_free_days,
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'transaction_id', fr.transaction_id,
                            'date', fr.date,
                            'amount', fr.amount,
                            'payment_method', fr.payment_method,
                            'reference_number', fr.reference_number,
                            'status', fr.status,
                            'notes', fr.notes
                        ) ORDER BY fr.date DESC SEPARATOR '|'
                    ) as payment_history_details
                FROM enrollments e
                LEFT JOIN classes c ON e.class_id = c.id
                LEFT JOIN financial_records fr ON e.student_id = fr.user_id AND e.class_id = fr.class_id
                WHERE e.student_id = ?
                GROUP BY e.id
                ORDER BY e.enrollment_date DESC
            ");
            
            $stmt->bind_param("s", $studentId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $enrollments = [];
            while ($row = $result->fetch_assoc()) {
                // Create schedule object from individual columns
                $row['schedule'] = [
                    'day' => $row['schedule_day'],
                    'startTime' => $row['schedule_start_time'],
                    'endTime' => $row['schedule_end_time'],
                    'frequency' => $row['schedule_frequency']
                ];
                
                $enrollments[] = $row;
            }
            
            return [
                'success' => true,
                'data' => $enrollments
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error retrieving enrollments: ' . $e->getMessage()
            ];
        }
    }

    // Get all enrollments in the system
    public function getAllEnrollments() {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    e.*,
                    c.class_name,
                    c.subject,
                    c.teacher,
                    c.stream,
                    c.delivery_method,
                    c.course_type,
                    c.fee,
                    c.max_students,
                    c.status as class_status,
                    c.zoom_link,
                    c.description,
                    c.schedule_day,
                    c.schedule_start_time,
                    c.schedule_end_time,
                    c.schedule_frequency,
                    c.start_date,
                    c.end_date,
                    c.current_students,
                    c.payment_tracking,
                    c.payment_tracking_free_days
                FROM enrollments e
                LEFT JOIN classes c ON e.class_id = c.id
                ORDER BY e.created_at DESC
            ");
            
            $stmt->execute();
            $result = $stmt->get_result();
            
            $enrollments = [];
            while ($row = $result->fetch_assoc()) {
                // Create schedule object from individual columns
                $row['schedule'] = [
                    'day' => $row['schedule_day'],
                    'startTime' => $row['schedule_start_time'],
                    'endTime' => $row['schedule_end_time'],
                    'frequency' => $row['schedule_frequency']
                ];
                
                $enrollments[] = $row;
            }
            
            return [
                'success' => true,
                'data' => $enrollments
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error retrieving all enrollments: ' . $e->getMessage()
            ];
        }
    }

    // Create a new enrollment
    public function createEnrollment($enrollmentData) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO enrollments (
                    class_id, student_id, student_name, enrollment_date, 
                    status, payment_status, payment_method, amount_paid,
                    next_payment_date, attendance_data, payment_history,
                    forget_card_requested, late_payment_requested, fee_amount,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->bind_param("ssssssssssssss", 
                $enrollmentData['class_id'],
                $enrollmentData['student_id'],
                $enrollmentData['student_name'],
                $enrollmentData['enrollment_date'],
                $enrollmentData['status'],
                $enrollmentData['payment_status'],
                $enrollmentData['payment_method'],
                $enrollmentData['amount_paid'],
                $enrollmentData['next_payment_date'],
                $enrollmentData['attendance_data'],
                $enrollmentData['payment_history'],
                $enrollmentData['forget_card_requested'],
                $enrollmentData['late_payment_requested'],
                $enrollmentData['amount_paid'] // Use amount_paid as fee_amount
            );
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Enrollment created successfully',
                    'data' => ['id' => $stmt->insert_id]
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to create enrollment'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error creating enrollment: ' . $e->getMessage()
            ];
        }
    }

    // Update enrollment
    public function updateEnrollment($enrollmentId, $updateData) {
        try {
            $stmt = $this->db->prepare("
                UPDATE enrollments SET
                    status = ?,
                    payment_status = ?,
                    notes = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");
            
            $stmt->bind_param("sssi", 
                $updateData['status'],
                $updateData['payment_status'],
                $updateData['notes'],
                $enrollmentId
            );
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Enrollment updated successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to update enrollment'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error updating enrollment: ' . $e->getMessage()
            ];
        }
    }

    // Delete enrollment
    public function deleteEnrollment($enrollmentId) {
        try {
            // First check if enrollment exists
            $stmt = $this->db->prepare("SELECT * FROM enrollments WHERE id = ?");
            $stmt->bind_param("i", $enrollmentId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                return [
                    'success' => false,
                    'message' => 'Enrollment not found'
                ];
            }
            
            // Delete the enrollment
            $stmt = $this->db->prepare("DELETE FROM enrollments WHERE id = ?");
            $stmt->bind_param("i", $enrollmentId);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Enrollment deleted successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to delete enrollment'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error deleting enrollment: ' . $e->getMessage()
            ];
        }
    }

    // Mark attendance for a class
    public function markAttendance($classId, $studentId, $attendanceData) {
        try {
            // Get current enrollment
            $stmt = $this->db->prepare("
                SELECT * FROM enrollments 
                WHERE class_id = ? AND student_id = ?
            ");
            $stmt->bind_param("ss", $classId, $studentId);
            $stmt->execute();
            $result = $stmt->get_result();
            $enrollment = $result->fetch_assoc();
            
            if (!$enrollment) {
                return [
                    'success' => false,
                    'message' => 'Enrollment not found'
                ];
            }
            
            // Parse existing attendance data
            $currentAttendance = json_decode($enrollment['attendance_data'] ?: '[]', true);
            
            // Check if attendance already marked for today
            $today = date('Y-m-d');
            $existingRecord = array_filter($currentAttendance, function($record) use ($today) {
                return $record['date'] === $today;
            });
            
            if (!empty($existingRecord)) {
                return [
                    'success' => false,
                    'message' => 'Attendance already marked for today'
                ];
            }
            
            // Add new attendance record
            $currentAttendance[] = $attendanceData;
            
            // Update enrollment
            $updateData = [
                'payment_status' => $enrollment['payment_status'],
                'next_payment_date' => $enrollment['next_payment_date'],
                'attendance_data' => json_encode($currentAttendance),
                'payment_history' => $enrollment['payment_history'],
                'forget_card_requested' => $enrollment['forget_card_requested'],
                'late_payment_requested' => $enrollment['late_payment_requested']
            ];
            
            return $this->updateEnrollment($enrollment['id'], $updateData);
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error marking attendance: ' . $e->getMessage()
            ];
        }
    }

    // Request forget card
    public function requestForgetCard($classId, $studentId) {
        try {
            $stmt = $this->db->prepare("
                UPDATE enrollments SET
                    forget_card_requested = '1',
                    forget_card_request_date = NOW(),
                    updated_at = NOW()
                WHERE class_id = ? AND student_id = ?
            ");
            
            $stmt->bind_param("ss", $classId, $studentId);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Forget card request submitted successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to submit forget card request'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error submitting forget card request: ' . $e->getMessage()
            ];
        }
    }

    // Request late payment
    public function requestLatePayment($classId, $studentId) {
        try {
            $stmt = $this->db->prepare("
                UPDATE enrollments SET
                    payment_status = 'late_payment',
                    late_payment_requested = '1',
                    late_payment_request_date = NOW(),
                    updated_at = NOW()
                WHERE class_id = ? AND student_id = ?
            ");
            
            $stmt->bind_param("ss", $classId, $studentId);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Late payment request submitted successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to submit late payment request'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error submitting late payment request: ' . $e->getMessage()
            ];
        }
    }
}
?> 