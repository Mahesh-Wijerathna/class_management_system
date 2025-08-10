<?php
class UserModel {
    private $conn;
    public $userid;
    public $password;
    public $role;
    public $otp;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function generateUserId($role) {
        $prefix = strtoupper(substr($role, 0, 1));
        $stmt = $this->conn->prepare("SELECT userid FROM users WHERE userid LIKE ? ORDER BY userid DESC LIMIT 1");
        $like = $prefix . '%';
        $stmt->bind_param("s", $like);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        $lastId = $result ? (int)substr($result['userid'], 1) : 0;
        return $prefix . str_pad($lastId + 1, 3, "0", STR_PAD_LEFT);
    }

    public function createUser($role, $password, $otp = null) {
        $this->userid = $this->generateUserId($role);
        $this->role = $role;
        $this->password = password_hash($password, PASSWORD_BCRYPT);
        $this->otp = $otp;

        $stmt = $this->conn->prepare("INSERT INTO users (userid, password, role, otp) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $this->userid, $this->password, $this->role, $this->otp);

        return $stmt->execute();
    }
    // Get user by ID
    public function getUserById($userid) {
        $stmt = $this->conn->prepare("SELECT userid, password, role, otp FROM users WHERE userid = ?");
        $stmt->bind_param("s", $userid);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    // Update user by ID
    public function updateUser($userid, $role = null, $password = null, $otp = null) {
        $fields = [];
        $params = [];
        $types = "";
        if ($role !== null) {
            $fields[] = "role = ?";
            $params[] = $role;
            $types .= "s";
        }
        if ($password !== null) {
            $fields[] = "password = ?";
            $params[] = password_hash($password, PASSWORD_BCRYPT);
            $types .= "s";
        }
        if ($otp !== null) {
            $fields[] = "otp = ?";
            $params[] = $otp;
            $types .= "s";
        }
        if (empty($fields)) return false;
        $params[] = $userid;
        $types .= "s";
        $sql = "UPDATE users SET ".implode(", ", $fields)." WHERE userid = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        return $stmt->execute();
    }

    // Delete user by ID
    public function deleteUser($userid) {
        $stmt = $this->conn->prepare("DELETE FROM users WHERE userid = ?");
        $stmt->bind_param("s", $userid);
        return $stmt->execute();
    }

    // Get all users
    public function getAllUsers() {
        $result = $this->conn->query("SELECT userid, role, otp FROM users");
        if ($result) {
            return $result->fetch_all(MYSQLI_ASSOC);
        }
        return false;
    }
    
}
