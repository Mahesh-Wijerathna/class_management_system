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
            $paymentTracking = json_encode([
                'enabled' => true,
                'startDate' => $data['startDate'] ?? null,
                'freeDays' => $data['paymentTrackingFreeDays'] ?? 7,
                'active' => true
            ]);
        }

        $stmt = $this->conn->prepare("
            INSERT INTO classes (
                class_name, subject, teacher, teacher_id, stream, delivery_method, delivery_other,
                schedule_day, schedule_start_time, schedule_end_time, schedule_frequency,
                start_date, end_date, max_students, fee, payment_tracking, payment_tracking_free_days,
                zoom_link, description, course_type, revision_discount_price, related_theory_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->bind_param("sssssssssssssssssssssss", 
            $data['className'],
            $data['subject'],
            $data['teacher'],
            $data['teacherId'],
            $data['stream'],
            $data['deliveryMethod'],
            $data['deliveryOther'] ?? null,
            $data['schedule']['day'],
            $data['schedule']['startTime'],
            $data['schedule']['endTime'],
            $data['schedule']['frequency'],
            $data['startDate'],
            $data['endDate'],
            $data['maxStudents'],
            $data['fee'],
            $paymentTracking,
            $data['paymentTrackingFreeDays'] ?? 7,
            $data['zoomLink'] ?? null,
            $data['description'] ?? null,
            $data['courseType'],
            $data['revisionDiscountPrice'] ?? 0,
            $data['relatedTheoryId'] ?? null,
            $data['status'] ?? 'active'
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
            $paymentTracking = json_encode([
                'enabled' => true,
                'startDate' => $data['startDate'] ?? null,
                'freeDays' => $data['paymentTrackingFreeDays'] ?? 7,
                'active' => true
            ]);
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

        $stmt->bind_param("sssssssssssssssssssssssi", 
            $data['className'],
            $data['subject'],
            $data['teacher'],
            $data['teacherId'],
            $data['stream'],
            $data['deliveryMethod'],
            $data['deliveryOther'] ?? null,
            $data['schedule']['day'],
            $data['schedule']['startTime'],
            $data['schedule']['endTime'],
            $data['schedule']['frequency'],
            $data['startDate'],
            $data['endDate'],
            $data['maxStudents'],
            $data['fee'],
            $paymentTracking,
            $data['paymentTrackingFreeDays'] ?? 7,
            $data['zoomLink'] ?? null,
            $data['description'] ?? null,
            $data['courseType'],
            $data['revisionDiscountPrice'] ?? 0,
            $data['relatedTheoryId'] ?? null,
            $data['status'] ?? 'active',
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
