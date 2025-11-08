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

    // Create a new study pack
    public function createStudyPack($data) {
        $sql = "INSERT INTO study_packs (teacher_id, title, description, price) VALUES (?, ?, ?, ?)";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        $teacherId = $data['teacher_id'];
        $title = $data['title'];
        $description = $data['description'] ?? '';
        $price = $data['price'] ?? 0.00;

        // teacher_id is VARCHAR(10)
        $stmt->bind_param("sssd", $teacherId, $title, $description, $price);

        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Study pack created',
                'study_pack_id' => $stmt->insert_id
            ];
        } else {
            throw new Exception("Execute failed: " . $stmt->error);
        }
    }

    // Add a link to a study pack
    public function addStudyPackLink($studyPackId, $linkUrl, $linkTitle = '') {
        // 1) Validate study pack exists to avoid FK errors
        $check = $this->conn->prepare('SELECT id FROM study_packs WHERE id = ?');
        if (!$check) {
            throw new Exception('Prepare failed: ' . $this->conn->error);
        }
        $check->bind_param('i', $studyPackId);
        if (!$check->execute()) {
            throw new Exception('Execute failed: ' . $check->error);
        }
        // Prefer store_result to avoid mysqlnd dependency
        $check->store_result();
        if ($check->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Invalid study_pack_id: study pack not found'
            ];
        }
        $check->free_result();
        $check->close();

        // 2) Insert the link now that the parent exists
        $sql = 'INSERT INTO study_pack_links (study_pack_id, link_url, link_title) VALUES (?, ?, ?)';
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . $this->conn->error);
        }
        $stmt->bind_param('iss', $studyPackId, $linkUrl, $linkTitle);
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Link added',
                'link_id' => $stmt->insert_id
            ];
        }
        // Friendly message on FK errors (should be rare after the explicit check)
        if ($stmt->errno === 1452) { // ER_NO_REFERENCED_ROW_2
            return [
                'success' => false,
                'message' => 'Invalid study_pack_id: parent study pack does not exist'
            ];
        }
        throw new Exception('Execute failed: ' . $stmt->error);
    }

    // Get study packs by teacher id
    public function getStudyPacksByTeacher($teacherId) {
        $sql = "SELECT * FROM study_packs WHERE teacher_id = ? ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        // teacher_id is VARCHAR(10)
        $stmt->bind_param("s", $teacherId);
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        $result = $stmt->get_result();
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        return $rows;
    }

    // Get study pack by id with its links/docs/videos
    public function getStudyPackById($id) {
        $sql = "SELECT * FROM study_packs WHERE id = ? LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }
        $stmt->bind_param("i", $id);
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        $res = $stmt->get_result();
        $pack = $res->fetch_assoc();

        if ($pack) {
            // fetch links
            $linksSql = "SELECT id, link_url, link_title FROM study_pack_links WHERE study_pack_id = ?";
            $lstmt = $this->conn->prepare($linksSql);
            $lstmt->bind_param("i", $id);
            $lstmt->execute();
            $linksRes = $lstmt->get_result();
            $links = [];
            while ($r = $linksRes->fetch_assoc()) $links[] = $r;
            $pack['links'] = $links;

            // fetch videos
            $vidSql = "SELECT id, file_path, title FROM study_pack_videos WHERE study_pack_id = ?";
            $vstmt = $this->conn->prepare($vidSql);
            $vstmt->bind_param("i", $id);
            $vstmt->execute();
            $vidRes = $vstmt->get_result();
            $videos = [];
            while ($r = $vidRes->fetch_assoc()) $videos[] = $r;
            $pack['videos'] = $videos;

            // fetch documents
            $docSql = "SELECT id, file_path, title FROM study_pack_documents WHERE study_pack_id = ?";
            $dstmt = $this->conn->prepare($docSql);
            $dstmt->bind_param("i", $id);
            $dstmt->execute();
            $docRes = $dstmt->get_result();
            $docs = [];
            while ($r = $docRes->fetch_assoc()) $docs[] = $r;
            $pack['documents'] = $docs;
        }

        return $pack;
    }

    // List all study packs
        public function getAllStudyPacks() {
                // Explicitly collate both sides to avoid 'Illegal mix of collations' errors
                $sql = "SELECT sp.*, t.name as teacher_name
                                FROM study_packs sp
                                LEFT JOIN teachers t
                                    ON sp.teacher_id COLLATE utf8mb4_unicode_ci = t.teacherId COLLATE utf8mb4_unicode_ci
                                ORDER BY sp.created_at DESC";
        $result = $this->conn->query($sql);
        if (!$result) {
            throw new Exception('Query failed: ' . $this->conn->error);
        }
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        return $rows;
    }

    // Update study pack (partial update for title, description, price)
    public function updateStudyPack($id, $data) {
        // Build dynamic SQL based on provided fields
        $fields = [];
        $params = [];
        $types = '';

        if (array_key_exists('title', $data)) {
            $fields[] = 'title = ?';
            $params[] = $data['title'];
            $types .= 's';
        }
        if (array_key_exists('description', $data)) {
            $fields[] = 'description = ?';
            $params[] = $data['description'];
            $types .= 's';
        }
        if (array_key_exists('price', $data)) {
            $fields[] = 'price = ?';
            $params[] = (float)$data['price'];
            $types .= 'd';
        }

        if (empty($fields)) {
            return ['success' => false, 'message' => 'No fields to update'];
        }

        $sql = 'UPDATE study_packs SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $params[] = (int)$id;
        $types .= 'i';

        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . $this->conn->error);
        }
        $stmt->bind_param($types, ...$params);
        if (!$stmt->execute()) {
            throw new Exception('Execute failed: ' . $stmt->error);
        }
        if ($stmt->affected_rows === 0) {
            // Check existence
            $check = $this->conn->prepare('SELECT id FROM study_packs WHERE id = ?');
            $check->bind_param('i', $id);
            $check->execute();
            $check->store_result();
            if ($check->num_rows === 0) {
                return ['success' => false, 'message' => 'Study pack not found'];
            }
        }
        return ['success' => true, 'message' => 'Study pack updated'];
    }
} 