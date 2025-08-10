<?php
class StudentModel {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Check if student with same NIC exists
    public function checkNicExists($nic) {
        if (empty($nic)) return false;
        
        $stmt = $this->conn->prepare("SELECT userid FROM students WHERE nic = ?");
        $stmt->bind_param("s", $nic);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }

    // Check if student with same mobile number exists
    public function checkMobileExists($mobile) {
        $stmt = $this->conn->prepare("SELECT userid FROM students WHERE mobile = ?");
        $stmt->bind_param("s", $mobile);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }

    // Check if student with same email exists
    public function checkEmailExists($email) {
        if (empty($email)) return false;
        
        $stmt = $this->conn->prepare("SELECT userid FROM students WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }

    // Validate student data for duplicates
    public function validateStudentData($studentData) {
        $errors = [];
        
        // Check NIC
        if (!empty($studentData['nic']) && $this->checkNicExists($studentData['nic'])) {
            $errors[] = 'A student with this NIC number already exists';
        }
        
        // Check mobile
        if ($this->checkMobileExists($studentData['mobile'])) {
            $errors[] = 'A student with this mobile number already exists';
        }
        
        // Check email
        if (!empty($studentData['email']) && $this->checkEmailExists($studentData['email'])) {
            $errors[] = 'A student with this email address already exists';
        }
        
        return $errors;
    }

    public function createStudent($userid, $studentData) {
        // Validate for duplicates before creating
        $validationErrors = $this->validateStudentData($studentData);
        if (!empty($validationErrors)) {
            return ['success' => false, 'errors' => $validationErrors];
        }

        $stmt = $this->conn->prepare("
            INSERT INTO students (
                userid, firstName, lastName, nic, gender, age, email, mobile, 
                parentName, parentMobile, stream, dateOfBirth, school, address, district
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->bind_param("sssssssssssssss", 
            $userid,
            $studentData['firstName'],
            $studentData['lastName'],
            $studentData['nic'],
            $studentData['gender'],
            $studentData['age'],
            $studentData['email'],
            $studentData['mobile'],
            $studentData['parentName'],
            $studentData['parentMobile'],
            $studentData['stream'],
            $studentData['dateOfBirth'],
            $studentData['school'],
            $studentData['address'],
            $studentData['district']
        );

        $result = $stmt->execute();
        return $result ? ['success' => true] : ['success' => false, 'errors' => ['Database error occurred']];
    }

    public function getStudentByUserId($userid) {
        $stmt = $this->conn->prepare("
            SELECT s.*, u.role 
            FROM students s 
            JOIN users u ON s.userid = u.userid 
            WHERE s.userid = ?
        ");
        $stmt->bind_param("s", $userid);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    public function getAllStudents() {
        $result = $this->conn->query("
            SELECT s.*, u.role 
            FROM students s 
            JOIN users u ON s.userid = u.userid
        ");
        if ($result) {
            return $result->fetch_all(MYSQLI_ASSOC);
        }
        return false;
    }

    public function updateStudent($userid, $studentData) {
        $stmt = $this->conn->prepare("
            UPDATE students SET 
                firstName = ?, lastName = ?, nic = ?, gender = ?, age = ?, 
                email = ?, mobile = ?, parentName = ?, parentMobile = ?, 
                stream = ?, dateOfBirth = ?, school = ?, address = ?, district = ?
            WHERE userid = ?
        ");
        
        $stmt->bind_param("sssssssssssssss", 
            $studentData['firstName'],
            $studentData['lastName'],
            $studentData['nic'],
            $studentData['gender'],
            $studentData['age'],
            $studentData['email'],
            $studentData['mobile'],
            $studentData['parentName'],
            $studentData['parentMobile'],
            $studentData['stream'],
            $studentData['dateOfBirth'],
            $studentData['school'],
            $studentData['address'],
            $studentData['district'],
            $userid
        );

        return $stmt->execute();
    }

    public function deleteStudent($userid) {
        $stmt = $this->conn->prepare("DELETE FROM students WHERE userid = ?");
        $stmt->bind_param("s", $userid);
        return $stmt->execute();
    }
} 