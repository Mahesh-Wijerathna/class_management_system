<?php
// src/StudentModel.php
class StudentModel {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    // Create student (no password)
    public function createStudent($data) {
        $sql = "INSERT INTO students (user_id, first_name, last_name, nic, mobile_number, date_of_birth, age, gender, email, school, stream, address, district, parent_name, parent_mobile_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param(
            'ssssssissssssss',
            $data['user_id'],
            $data['first_name'],
            $data['last_name'],
            $data['nic'],
            $data['mobile_number'],
            $data['date_of_birth'],
            $data['age'],
            $data['gender'],
            $data['email'],
            $data['school'],
            $data['stream'],
            $data['address'],
            $data['district'],
            $data['parent_name'],
            $data['parent_mobile_number']
        );
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }

    // Read student by ID
    public function getStudentById($user_id) {
        $sql = "SELECT * FROM students WHERE user_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('s', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $student = $result->fetch_assoc();
        $stmt->close();
        return $student;
    }

    // Read all students
    public function getAllStudents() {
        $sql = "SELECT * FROM students";
        $result = $this->conn->query($sql);
        $students = [];
        while ($row = $result->fetch_assoc()) {
            $students[] = $row;
        }
        return $students;
    }

    // Update student by ID
    public function updateStudent($user_id, $data) {
        $sql = "UPDATE students SET first_name=?, last_name=?, nic=?, mobile_number=?, date_of_birth=?, age=?, gender=?, email=?, school=?, stream=?, address=?, district=?, parent_name=?, parent_mobile_number=? WHERE user_id=?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param(
            'sssssisssssssss',
            $data['first_name'],
            $data['last_name'],
            $data['nic'],
            $data['mobile_number'],
            $data['date_of_birth'],
            $data['age'],
            $data['gender'],
            $data['email'],
            $data['school'],
            $data['stream'],
            $data['address'],
            $data['district'],
            $data['parent_name'],
            $data['parent_mobile_number'],
            $user_id
        );
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }

    // Delete student by ID
    public function deleteStudent($user_id) {
        $sql = "DELETE FROM students WHERE user_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('s', $user_id);
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }    
}
?>
