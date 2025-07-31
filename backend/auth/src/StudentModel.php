<?php
class StudentModel {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function createStudent($userid, $studentData) {
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

        return $stmt->execute();
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