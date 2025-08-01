<?php
class ClassModel {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function createClass($data) {
        // Prepare payment tracking JSON
        $paymentTracking = null;
        if (isset($data['paymentTracking']) && $data['paymentTracking']) {
            $paymentTracking = json_encode($data['paymentTracking']);
        }

        $stmt = $this->conn->prepare("
            INSERT INTO classes (
                class_name, subject, teacher, teacher_id, stream, delivery_method, delivery_other,
                schedule_day, schedule_start_time, schedule_end_time, schedule_frequency,
                start_date, end_date, max_students, fee, payment_tracking, payment_tracking_free_days,
                zoom_link, description, course_type, revision_discount_price, related_theory_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        // Ensure all variables are properly defined
        $className = $data['className'] ?? '';
        $subject = $data['subject'] ?? '';
        $teacher = $data['teacher'] ?? '';
        $teacherId = $data['teacherId'] ?? '';
        $stream = $data['stream'] ?? '';
        $deliveryMethod = $data['deliveryMethod'] ?? '';
        $deliveryOther = $data['deliveryOther'] ?? null;
        $scheduleDay = $data['schedule']['day'] ?? '';
        $scheduleStartTime = $data['schedule']['startTime'] ?? '';
        $scheduleEndTime = $data['schedule']['endTime'] ?? '';
        $scheduleFrequency = $data['schedule']['frequency'] ?? 'weekly';
        $startDate = $data['startDate'] ?? '';
        $endDate = $data['endDate'] ?? '';
        $maxStudents = $data['maxStudents'] ?? 0;
        $fee = $data['fee'] ?? 0;
        $paymentTrackingFreeDays = $data['paymentTrackingFreeDays'] ?? 7;
        $zoomLink = $data['zoomLink'] ?? null;
        $description = $data['description'] ?? null;
        $courseType = $data['courseType'] ?? 'theory';
        $revisionDiscountPrice = $data['revisionDiscountPrice'] ?? 0;
        // Convert empty string to 0 for revision_discount_price
        if ($revisionDiscountPrice === '' || $revisionDiscountPrice === null) {
            $revisionDiscountPrice = 0;
        } else {
            $revisionDiscountPrice = floatval($revisionDiscountPrice);
        }
        $relatedTheoryId = $data['relatedTheoryId'] ?? null;
        // Convert empty string to null for related_theory_id
        if ($relatedTheoryId === '') {
            $relatedTheoryId = null;
        }
        $status = $data['status'] ?? 'active';

        $stmt->bind_param("sssssssssssssssssssssss", 
            $className,
            $subject,
            $teacher,
            $teacherId,
            $stream,
            $deliveryMethod,
            $deliveryOther,
            $scheduleDay,
            $scheduleStartTime,
            $scheduleEndTime,
            $scheduleFrequency,
            $startDate,
            $endDate,
            $maxStudents,
            $fee,
            $paymentTracking,
            $paymentTrackingFreeDays,
            $zoomLink,
            $description,
            $courseType,
            $revisionDiscountPrice,
            $relatedTheoryId,
            $status
        );

        return $stmt->execute();
    }

    public function getClassById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM classes WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $class = $result->fetch_assoc();
        
        if ($class) {
            return $this->formatClassData($class);
        }
        return null;
    }

    public function updateClass($id, $data) {
        // Prepare payment tracking JSON
        $paymentTracking = null;
        if (isset($data['paymentTracking']) && $data['paymentTracking']) {
            $paymentTracking = json_encode($data['paymentTracking']);
        }

        $stmt = $this->conn->prepare("
            UPDATE classes SET 
                class_name = ?, subject = ?, teacher = ?, teacher_id = ?, stream = ?, 
                delivery_method = ?, delivery_other = ?, schedule_day = ?, schedule_start_time = ?, 
                schedule_end_time = ?, schedule_frequency = ?, start_date = ?, end_date = ?, 
                max_students = ?, fee = ?, payment_tracking = ?, payment_tracking_free_days = ?,
                zoom_link = ?, description = ?, course_type = ?, revision_discount_price = ?, 
                related_theory_id = ?, status = ?
            WHERE id = ?
        ");

        // Ensure all variables are properly defined
        $className = $data['className'] ?? '';
        $subject = $data['subject'] ?? '';
        $teacher = $data['teacher'] ?? '';
        $teacherId = $data['teacherId'] ?? '';
        $stream = $data['stream'] ?? '';
        $deliveryMethod = $data['deliveryMethod'] ?? '';
        $deliveryOther = $data['deliveryOther'] ?? null;
        $scheduleDay = $data['schedule']['day'] ?? '';
        $scheduleStartTime = $data['schedule']['startTime'] ?? '';
        $scheduleEndTime = $data['schedule']['endTime'] ?? '';
        $scheduleFrequency = $data['schedule']['frequency'] ?? 'weekly';
        $startDate = $data['startDate'] ?? '';
        $endDate = $data['endDate'] ?? '';
        $maxStudents = $data['maxStudents'] ?? 0;
        $fee = $data['fee'] ?? 0;
        $paymentTrackingFreeDays = $data['paymentTrackingFreeDays'] ?? 7;
        $zoomLink = $data['zoomLink'] ?? null;
        $description = $data['description'] ?? null;
        $courseType = $data['courseType'] ?? 'theory';
        $revisionDiscountPrice = $data['revisionDiscountPrice'] ?? 0;
        // Convert empty string to 0 for revision_discount_price
        if ($revisionDiscountPrice === '' || $revisionDiscountPrice === null) {
            $revisionDiscountPrice = 0;
        } else {
            $revisionDiscountPrice = floatval($revisionDiscountPrice);
        }
        $relatedTheoryId = $data['relatedTheoryId'] ?? null;
        // Convert empty string to null for related_theory_id
        if ($relatedTheoryId === '') {
            $relatedTheoryId = null;
        }
        $status = $data['status'] ?? 'active';

        $stmt->bind_param("sssssssssssssssssssssssi", 
            $className,
            $subject,
            $teacher,
            $teacherId,
            $stream,
            $deliveryMethod,
            $deliveryOther,
            $scheduleDay,
            $scheduleStartTime,
            $scheduleEndTime,
            $scheduleFrequency,
            $startDate,
            $endDate,
            $maxStudents,
            $fee,
            $paymentTracking,
            $paymentTrackingFreeDays,
            $zoomLink,
            $description,
            $courseType,
            $revisionDiscountPrice,
            $relatedTheoryId,
            $status,
            $id
        );

        return $stmt->execute();
    }

    public function deleteClass($id) {
        $stmt = $this->conn->prepare("DELETE FROM classes WHERE id = ?");
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }

    public function getAllClasses() {
        $result = $this->conn->query("SELECT * FROM classes ORDER BY created_at DESC");
        if (!$result) {
            return [];
        }
        
        $classes = [];
        while ($row = $result->fetch_assoc()) {
            $classes[] = $this->formatClassData($row);
        }
        return $classes;
    }

    public function getActiveClasses() {
        $stmt = $this->conn->prepare("SELECT * FROM classes WHERE status = 'active' ORDER BY created_at DESC");
        $stmt->execute();
        $result = $stmt->get_result();
        
        $classes = [];
        while ($row = $result->fetch_assoc()) {
            $classes[] = $this->formatClassData($row);
        }
        return $classes;
    }

    public function getClassesByType($courseType) {
        $stmt = $this->conn->prepare("SELECT * FROM classes WHERE course_type = ? AND status = 'active' ORDER BY created_at DESC");
        $stmt->bind_param("s", $courseType);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $classes = [];
        while ($row = $result->fetch_assoc()) {
            $classes[] = $this->formatClassData($row);
        }
        return $classes;
    }

    public function getClassesByDeliveryMethod($deliveryMethod) {
        $stmt = $this->conn->prepare("SELECT * FROM classes WHERE delivery_method = ? AND status = 'active' ORDER BY created_at DESC");
        $stmt->bind_param("s", $deliveryMethod);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $classes = [];
        while ($row = $result->fetch_assoc()) {
            $classes[] = $this->formatClassData($row);
        }
        return $classes;
    }

    public function getClassesByTeacher($teacherId) {
        $stmt = $this->conn->prepare("SELECT * FROM classes WHERE teacher_id = ? AND status = 'active' ORDER BY created_at DESC");
        $stmt->bind_param("s", $teacherId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $classes = [];
        while ($row = $result->fetch_assoc()) {
            $classes[] = $this->formatClassData($row);
        }
        return $classes;
    }

    // Session Schedule Methods
    public function createSessionSchedule($data) {
        $stmt = $this->conn->prepare("
            INSERT INTO session_schedules (
                class_id, subject, class_name, teacher, teacher_id, session_date, 
                start_time, end_time, delivery_method, delivery_other, zoom_link, hall, description, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        // For session schedules, we don't need a class_id since we're creating individual sessions
        // We'll use a default value of 1 or find the class by name
        $classId = $data['classId'] ?? 1; // Default to 1 for now
        $subject = $data['subject'] ?? '';
        $className = $data['className'] ?? '';
        $teacher = $data['teacher'] ?? '';
        $teacherId = $data['teacherId'] ?? '';
        $sessionDate = $data['date'] ?? '';
        $startTime = $data['startTime'] ?? '';
        $endTime = $data['endTime'] ?? '';
        $deliveryMethod = $data['deliveryMethod'] ?? '';
        $deliveryOther = $data['deliveryOther'] ?? null;
        $zoomLink = $data['zoomLink'] ?? null;
        $hall = $data['hall'] ?? null;
        $description = $data['description'] ?? null;
        $status = $data['status'] ?? 'active';
        $createdBy = $data['teacherId'] ?? '';

        $stmt->bind_param("issssssssssssss", 
            $classId, $subject, $className, $teacher, $teacherId, $sessionDate,
            $startTime, $endTime, $deliveryMethod, $deliveryOther, $zoomLink, $hall, $description, $status, $createdBy
        );

        return $stmt->execute();
    }

    public function getSessionSchedulesByTeacher($teacherId) {
        $stmt = $this->conn->prepare("SELECT * FROM session_schedules WHERE teacher_id = ? ORDER BY session_date DESC, start_time ASC");
        $stmt->bind_param("s", $teacherId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $schedules = [];
        while ($row = $result->fetch_assoc()) {
            $schedules[] = $this->formatSessionScheduleData($row);
        }
        return $schedules;
    }

    public function getAllSessionSchedules() {
        $result = $this->conn->query("SELECT * FROM session_schedules ORDER BY session_date DESC, start_time ASC");
        if (!$result) {
            return [];
        }
        
        $schedules = [];
        while ($row = $result->fetch_assoc()) {
            $schedules[] = $this->formatSessionScheduleData($row);
        }
        return $schedules;
    }

    public function updateSessionSchedule($id, $data) {
        $stmt = $this->conn->prepare("
            UPDATE session_schedules SET 
                subject = ?, class_name = ?, teacher = ?, teacher_id = ?, session_date = ?,
                start_time = ?, end_time = ?, delivery_method = ?, delivery_other = ?, 
                zoom_link = ?, hall = ?, description = ?, status = ?
            WHERE id = ?
        ");

        $subject = $data['subject'] ?? '';
        $className = $data['className'] ?? '';
        $teacher = $data['teacher'] ?? '';
        $teacherId = $data['teacherId'] ?? '';
        $sessionDate = $data['date'] ?? '';
        $startTime = $data['startTime'] ?? '';
        $endTime = $data['endTime'] ?? '';
        $deliveryMethod = $data['deliveryMethod'] ?? '';
        $deliveryOther = $data['deliveryOther'] ?? null;
        $zoomLink = $data['zoomLink'] ?? null;
        $hall = $data['hall'] ?? null;
        $description = $data['description'] ?? null;
        $status = $data['status'] ?? 'active';

        $stmt->bind_param("sssssssssssssi", 
            $subject, $className, $teacher, $teacherId, $sessionDate,
            $startTime, $endTime, $deliveryMethod, $deliveryOther, $zoomLink, $hall, $description, $status, $id
        );

        return $stmt->execute();
    }

    public function deleteSessionSchedule($id) {
        $stmt = $this->conn->prepare("DELETE FROM session_schedules WHERE id = ?");
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }

    private function formatSessionScheduleData($row) {
        return [
            'id' => $row['id'],
            'classId' => $row['class_id'],
            'subject' => $row['subject'],
            'className' => $row['class_name'],
            'teacher' => $row['teacher'],
            'teacherId' => $row['teacher_id'],
            'date' => $row['session_date'],
            'startTime' => $row['start_time'],
            'endTime' => $row['end_time'],
            'deliveryMethod' => $row['delivery_method'],
            'deliveryOther' => $row['delivery_other'],
            'zoomLink' => $row['zoom_link'],
            'hall' => $row['hall'],
            'description' => $row['description'],
            'status' => $row['status'],
            'createdBy' => $row['created_by'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }

    private function formatClassData($row) {
        // Parse payment tracking JSON
        $paymentTracking = null;
        if ($row['payment_tracking']) {
            $paymentTracking = json_decode($row['payment_tracking'], true);
        }

        return [
            'id' => $row['id'],
            'className' => $row['class_name'],
            'subject' => $row['subject'],
            'teacher' => $row['teacher'],
            'teacherId' => $row['teacher_id'],
            'stream' => $row['stream'],
            'deliveryMethod' => $row['delivery_method'],
            'deliveryOther' => $row['delivery_other'],
            'schedule' => [
                'day' => $row['schedule_day'],
                'startTime' => $row['schedule_start_time'],
                'endTime' => $row['schedule_end_time'],
                'frequency' => $row['schedule_frequency']
            ],
            'startDate' => $row['start_date'],
            'endDate' => $row['end_date'],
            'maxStudents' => (int)$row['max_students'],
            'fee' => (float)$row['fee'],
            'paymentTracking' => $paymentTracking,
            'paymentTrackingFreeDays' => (int)$row['payment_tracking_free_days'],
            'zoomLink' => $row['zoom_link'],
            'description' => $row['description'],
            'courseType' => $row['course_type'],
            'revisionDiscountPrice' => (float)$row['revision_discount_price'],
            'relatedTheoryId' => $row['related_theory_id'],
            'status' => $row['status'],
            'currentStudents' => (int)$row['current_students'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }
}
