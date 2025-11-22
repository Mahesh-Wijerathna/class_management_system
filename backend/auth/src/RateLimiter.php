<?php

class RateLimiter {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    // Check if user is locked out
    public function isLockedOut($userid) {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as failed_attempts, MAX(attempt_time) as last_attempt 
            FROM login_attempts 
            WHERE userid = ? AND attempt_type IN ('FAILED_PASSWORD', 'INVALID_USER') 
            AND attempt_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        ");
        $stmt->bind_param("s", $userid);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();
        
        // Lock out after 5 failed attempts in 15 minutes
        return $data['failed_attempts'] >= 5;
    }
    
    // Record login attempt
    public function recordAttempt($userid, $success, $ip = null) {
        if (!$ip) {
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        }
        
        $attemptType = $success ? 'SUCCESS' : 'FAILED_PASSWORD';
        
        $stmt = $this->db->prepare("
            INSERT INTO login_attempts (userid, attempt_type, ip_address, attempt_time) 
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->bind_param("sss", $userid, $attemptType, $ip);
        $stmt->execute();
    }
    
    // Get remaining attempts before lockout
    public function getRemainingAttempts($userid) {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as failed_attempts 
            FROM login_attempts 
            WHERE userid = ? AND attempt_type IN ('FAILED_PASSWORD', 'INVALID_USER') 
            AND attempt_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        ");
        $stmt->bind_param("s", $userid);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();
        
        return max(0, 5 - $data['failed_attempts']);
    }
    
    // Clean old attempts (older than 15 minutes)
    public function cleanOldAttempts() {
        $stmt = $this->db->prepare("
            DELETE FROM login_attempts 
            WHERE attempt_time < DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        ");
        $stmt->execute();
    }
} 