<?php

class TeacherModel {
    private $conn;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    // Create a new teacher
    public function createTeacher($data) {
        $sql = "INSERT INTO teachers (teacherId, designation, name, stream, email, phone, password, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $status = $data['status'] ?? 'active';
        
        $stmt->bind_param("ssssssss", 
            $data['teacherId'],
            $data['designation'],
            $data['name'],
            $data['stream'],
            $data['email'],
            $data['phone'],
            $hashedPassword,
            $status
        );
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Teacher created successfully',
                'teacherId' => $data['teacherId']
            ];
        } else {
            throw new Exception("Execute failed: " . $stmt->error);
        }
    }
    
    // Get all teachers
    public function getAllTeachers() {
        $sql = "SELECT id, teacherId, designation, name, stream, email, phone, status, created_at 
                FROM teachers 
                ORDER BY name ASC";
        
        $result = $this->conn->query($sql);
        
        if (!$result) {
            throw new Exception("Query failed: " . $this->conn->error);
        }
        
        $teachers = [];
        while ($row = $result->fetch_assoc()) {
            $teachers[] = $row;
        }
        
        return $teachers;
    }
    
    // Get active teachers only
    public function getActiveTeachers() {
        $sql = "SELECT id, teacherId, designation, name, stream, email, phone, status, created_at 
                FROM teachers 
                WHERE status = 'active'
                ORDER BY name ASC";
        
        $result = $this->conn->query($sql);
        
        if (!$result) {
            throw new Exception("Query failed: " . $this->conn->error);
        }
        
        $teachers = [];
        while ($row = $result->fetch_assoc()) {
            $teachers[] = $row;
        }
        
        return $teachers;
    }
    
    // Get teacher by ID
    public function getTeacherById($teacherId) {
        $sql = "SELECT id, teacherId, designation, name, stream, email, phone, status, created_at 
                FROM teachers 
                WHERE teacherId = ?";
        
        $stmt = $this->conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        
        $stmt->bind_param("s", $teacherId);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }
    
    // Get teacher by ID with password for editing (admin only)
    public function getTeacherByIdForEdit($teacherId) {
        $sql = "SELECT id, teacherId, designation, name, stream, email, phone, password, status, created_at 
                FROM teachers 
                WHERE teacherId = ?";
        
        $stmt = $this->conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        
        $stmt->bind_param("s", $teacherId);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        $teacher = $result->fetch_assoc();
        
        // For security, we don't return the actual password hash
        // Instead, we return a placeholder that indicates the password exists
        if ($teacher) {
            $teacher['password'] = '********'; // Placeholder for existing password
        }
        
        return $teacher;
    }
    
    // Get teacher by ID with password for login
    public function getTeacherByIdWithPassword($teacherId) {
        $sql = "SELECT id, teacherId, designation, name, stream, email, phone, password, status, created_at 
                FROM teachers 
                WHERE teacherId = ?";
        
        $stmt = $this->conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        
        $stmt->bind_param("s", $teacherId);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }
    
    // Get teacher by email (for login)
    public function getTeacherByEmail($email) {
        $sql = "SELECT id, teacherId, designation, name, stream, email, phone, password, status 
                FROM teachers 
                WHERE email = ?";
        
        $stmt = $this->conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        
        $stmt->bind_param("s", $email);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }
    
    // Update teacher
    public function updateTeacher($teacherId, $data) {
        // Check if password is being updated
        $updatePassword = !empty($data['password']);
        
        if ($updatePassword) {
            // Update including password
            $sql = "UPDATE teachers 
                    SET designation = ?, name = ?, stream = ?, email = ?, phone = ?, password = ?, status = ? 
                    WHERE teacherId = ?";
            
            $stmt = $this->conn->prepare($sql);
            
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }
            
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            $status = $data['status'] ?? 'active';
            
            $stmt->bind_param("ssssssss", 
                $data['designation'],
                $data['name'],
                $data['stream'],
                $data['email'],
                $data['phone'],
                $hashedPassword,
                $status,
                $teacherId
            );
        } else {
            // Update without password
            $sql = "UPDATE teachers 
                    SET designation = ?, name = ?, stream = ?, email = ?, phone = ?, status = ? 
                    WHERE teacherId = ?";
            
            $stmt = $this->conn->prepare($sql);
            
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }
            
            $status = $data['status'] ?? 'active';
            
            $stmt->bind_param("sssssss", 
                $data['designation'],
                $data['name'],
                $data['stream'],
                $data['email'],
                $data['phone'],
                $status,
                $teacherId
            );
        }
        
        if ($stmt->execute()) {
            $message = 'Teacher updated successfully';
            if ($updatePassword) {
                $message .= ' (including password)';
            }
            return [
                'success' => true,
                'message' => $message
            ];
        } else {
            throw new Exception("Execute failed: " . $stmt->error);
        }
    }
    
    // Delete teacher
    public function deleteTeacher($teacherId) {
        $sql = "DELETE FROM teachers WHERE teacherId = ?";
        
        $stmt = $this->conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        
        $stmt->bind_param("s", $teacherId);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Teacher deleted successfully'
            ];
        } else {
            throw new Exception("Execute failed: " . $stmt->error);
        }
    }
    
    // Change teacher password
    public function changePassword($teacherId, $newPassword) {
        $sql = "UPDATE teachers SET password = ? WHERE teacherId = ?";
        
        $stmt = $this->conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt->bind_param("ss", $hashedPassword, $teacherId);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Password changed successfully'
            ];
        } else {
            throw new Exception("Execute failed: " . $stmt->error);
        }
    }
    
    // Get teachers by stream
    public function getTeachersByStream($stream) {
        $sql = "SELECT id, teacherId, designation, name, stream, email, phone, status 
                FROM teachers 
                WHERE stream = ? AND status = 'active'
                ORDER BY name ASC";
        
        $stmt = $this->conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        
        $stmt->bind_param("s", $stream);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        $teachers = [];
        while ($row = $result->fetch_assoc()) {
            $teachers[] = $row;
        }
        
        return $teachers;
    }
    
    // Check if email exists
    public function emailExists($email, $excludeTeacherId = null) {
        $sql = "SELECT teacherId FROM teachers WHERE email = ?";
        $params = [$email];
        $types = "s";
        
        if ($excludeTeacherId) {
            $sql .= " AND teacherId != ?";
            $params[] = $excludeTeacherId;
            $types .= "s";
        }
        
        $stmt = $this->conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        
        $stmt->bind_param($types, ...$params);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }
    
    // Check if phone number exists
    public function phoneExists($phone, $excludeTeacherId = null) {
        $sql = "SELECT teacherId FROM teachers WHERE phone = ?";
        $params = [$phone];
        $types = "s";
        
        if ($excludeTeacherId) {
            $sql .= " AND teacherId != ?";
            $params[] = $excludeTeacherId;
            $types .= "s";
        }
        
        $stmt = $this->conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        
        $stmt->bind_param($types, ...$params);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }
    
    // Check if teacherId exists
    public function teacherIdExists($teacherId) {
        $sql = "SELECT teacherId FROM teachers WHERE teacherId = ?";
        
        $stmt = $this->conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        
        $stmt->bind_param("s", $teacherId);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }
    
    // Generate next teacher ID
    public function generateNextTeacherId() {
        $sql = "SELECT teacherId FROM teachers ORDER BY CAST(SUBSTRING(teacherId, 2) AS UNSIGNED) DESC LIMIT 1";
        
        $result = $this->conn->query($sql);
        
        if (!$result) {
            throw new Exception("Query failed: " . $this->conn->error);
        }
        
        if ($result->num_rows === 0) {
            return 'T001';
        }
        
        $row = $result->fetch_assoc();
        $lastId = $row['teacherId'];
        
        // Extract the number part and increment
        $number = intval(substr($lastId, 1));
        $nextNumber = $number + 1;
        
        // Format with leading zeros (T001, T002, etc.)
        return 'T' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }
} 