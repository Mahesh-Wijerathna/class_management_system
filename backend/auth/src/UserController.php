
<?php
// Set timezone for all date/time operations
date_default_timezone_set('Asia/Colombo');

require_once __DIR__ . '/UserModel.php';
require_once __DIR__ . '/StudentModel.php';
require_once __DIR__ . '/RateLimiter.php';
require_once __DIR__ . '/WhatsAppService.php';
require_once __DIR__ . '/StudentMonitoringModel.php';

require_once __DIR__ . '/vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class UserController {
    private $db;
    private $rateLimiter;

    public function __construct($db) {
        $this->db = $db;
        $this->rateLimiter = new RateLimiter($db);
    }

    public function register($role, $password, $studentData = null) {
        // If this is a student registration, validate student data first
        if ($role === 'student' && $studentData) {
            $student = new StudentModel($this->db);
            $validationErrors = $student->validateStudentData($studentData);
            
            if (!empty($validationErrors)) {
                return json_encode([
                    'success' => false, 
                    'message' => implode(', ', $validationErrors)
                ]);
            }
        }
        
        $user = new UserModel($this->db);
        if ($user->createUser($role, $password)) {
            $userid = $user->userid;
            
            // If this is a student registration and we have student data, save it
            if ($role === 'student' && $studentData) {
                $student = new StudentModel($this->db);
                $result = $student->createStudent($userid, $studentData);
                if (!$result['success']) {
                    // If student data creation fails, delete the user and return error
                    $user->deleteUser($userid);
                    return json_encode([
                        'success' => false, 
                        'message' => implode(', ', $result['errors'])
                    ]);
                }
            }
            
            return json_encode([
                'success' => true,
                'userid' => $userid,
                'role' => $user->role
            ]);
        } else {
            return json_encode(['success' => false, 'message' => 'User creation failed']);
        }
    }


    

    // Read user by ID
    public function getUser($userid) {
        $user = new UserModel($this->db);
        $userData = $user->getUserById($userid);
        if ($userData) {
            return json_encode(['success' => true, 'user' => $userData]);
        } else {
            return json_encode(['success' => false, 'message' => 'User not found']);
        }
    }

    // Update user by ID
    public function updateUser($userid, $role = null, $password = null, $otp = null) {
        $user = new UserModel($this->db);
        $result = $user->updateUser($userid, $role, $password, $otp);
        if ($result) {
            return json_encode(['success' => true, 'message' => 'User updated successfully']);
        } else {
            return json_encode(['success' => false, 'message' => 'User update failed']);
        }
    }

    // Delete user by ID (handles both regular users and students)
    public function deleteUser($userid) {
        try {
            // Start transaction
            $this->db->begin_transaction();
            
            // Check if this is a student (starts with 'S')
            if (strpos($userid, 'S') === 0) {
                // Delete from students table
                $stmt = $this->db->prepare("DELETE FROM students WHERE userid = ?");
                $stmt->bind_param("s", $userid);
                $stmt->execute();
                
                // Delete from barcodes table
                $stmt = $this->db->prepare("DELETE FROM barcodes WHERE userid = ?");
                $stmt->bind_param("s", $userid);
                $stmt->execute();
            }
            
            // Delete from users table (for all users)
            $user = new UserModel($this->db);
            $result = $user->deleteUser($userid);
            
            if ($result) {
                // If this is a student, also delete their enrollments from class-db
                if (strpos($userid, 'S') === 0) {
                    $this->deleteStudentEnrollments($userid);
                }
                
                // Commit transaction
                $this->db->commit();
                return json_encode(['success' => true, 'message' => 'User deleted successfully']);
            } else {
                // Rollback transaction
                $this->db->rollback();
                return json_encode(['success' => false, 'message' => 'User deletion failed']);
            }
        } catch (Exception $e) {
            // Rollback transaction on error
            $this->db->rollback();
            return json_encode(['success' => false, 'message' => 'Failed to delete user: ' . $e->getMessage()]);
        }
    }
    
    // Helper method to delete student enrollments from class-db
    private function deleteStudentEnrollments($studentId) {
        try {
            // Call the class backend to delete enrollments
            $url = 'http://host.docker.internal:8087/routes.php/delete_student_enrollments';
            $data = json_encode(['studentId' => $studentId]);
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Content-Length: ' . strlen($data)
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 200) {
                $result = json_decode($response, true);
                if ($result && $result['success']) {
                    error_log("Successfully deleted enrollments for student {$studentId}: " . $result['message']);
                } else {
                    error_log("Failed to delete enrollments for student {$studentId}: " . ($result['message'] ?? 'Unknown error'));
                }
            } else {
                error_log("HTTP error {$httpCode} when deleting enrollments for student {$studentId}");
            }
        } catch (Exception $e) {
            error_log("Exception when deleting enrollments for student {$studentId}: " . $e->getMessage());
        }
    }


    // Get all users
    public function getAllUsers() {
        $user = new UserModel($this->db);
        $users = $user->getAllUsers();
        if ($users !== false) {
            return json_encode(['success' => true, 'users' => $users]);
        } else {
            return json_encode(['success' => false, 'message' => 'Failed to fetch users']);
        }
    }
    // Login user
    public function login($userid, $password) {
        // Check if user is locked out
        if ($this->rateLimiter->isLockedOut($userid)) {
            $this->rateLimiter->recordAttempt($userid, 0);
            return json_encode([
                'success' => false, 
                'message' => 'Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.'
            ]);
        }

        // Check if student is blocked - do this BEFORE any other processing
        if ($userid && $userid[0] === 'S') { // Check if it's a student
            require_once __DIR__ . '/StudentMonitoringModel.php';
            $monitoringModel = new StudentMonitoringModel($this->db);
            if ($monitoringModel->isStudentBlocked($userid)) {
                // Record failed login attempt for blocked student
                $this->rateLimiter->recordAttempt($userid, 0);
                return json_encode([
                    'success' => false,
                    'message' => 'Your account has been blocked by the administrator. Please contact support for assistance.'
                ]);
            }
        }
        
        $user = new UserModel($this->db);
        $userData = $user->getUserById($userid);
        if ($userData && password_verify($password, $userData['password'])) {
            // Remove password from response
            unset($userData['password']);
            
            // If user is a student, get complete student data
            if ($userData['role'] === 'student') {
                $stmt = $this->db->prepare("
                    SELECT 
                        u.userid,
                        u.role,
                        COALESCE(s.firstName, '') as firstName,
                        COALESCE(s.lastName, '') as lastName,
                        COALESCE(s.email, '') as email,
                        COALESCE(s.mobile, '') as mobile,
                        COALESCE(s.nic, '') as nic,
                        COALESCE(s.gender, '') as gender,
                        COALESCE(s.age, '') as age,
                        COALESCE(s.parentName, '') as parentName,
                        COALESCE(s.parentMobile, '') as parentMobile,
                        COALESCE(s.stream, '') as stream,
                        COALESCE(s.dateOfBirth, '') as dateOfBirth,
                        COALESCE(s.school, '') as school,
                        COALESCE(s.address, '') as address,
                        COALESCE(s.district, '') as district,
                        COALESCE(s.dateJoined, '') as dateJoined,
                        COALESCE(b.barcode_data, '') as barcodeData,
                        COALESCE(b.created_at, '') as barcodeCreatedAt
                    FROM users u
                    LEFT JOIN students s ON u.userid = s.userid
                    LEFT JOIN barcodes b ON u.userid = b.userid
                    WHERE u.userid = ?
                ");
                $stmt->bind_param("s", $userid);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows === 1) {
                    $userData = $result->fetch_assoc();
                }
            }
            

            
            // Generate access token (short-lived: 15 minutes)
            $secretKey = 'your_secret_key_here';
            $accessPayload = [
                'userid' => $userData['userid'],
                'role' => $userData['role'],
                'iat' => time(),
                'exp' => time() + (15 * 60) // 15 minutes expiry
            ];
            $accessToken = JWT::encode($accessPayload, $secretKey, 'HS256');
            
            // Generate refresh token (long-lived: 7 days)
            $refreshToken = $this->generateRefreshToken();
            
            // Store refresh token in database
            $this->storeRefreshToken($userData['userid'], $refreshToken);
            
            // Record successful login attempt
            $this->rateLimiter->recordAttempt($userData['userid'], 1);
            
            // Track student login activity for monitoring
            if ($userData['role'] === 'student') {
                $monitoringModel = new StudentMonitoringModel($this->db);
                $sessionId = uniqid('session_', true);
                $ipAddress = $this->getClientIP();
                $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
                $loginTime = date('Y-m-d H:i:s');
                $monitoringModel->trackLoginActivity($userData['userid'], $ipAddress, $userAgent, $sessionId, $loginTime);
            }
            
            return json_encode([
                'success' => true,
                'user' => $userData,
                'accessToken' => $accessToken,
                'refreshToken' => $refreshToken,
                'sessionId' => $sessionId ?? null
            ]);
        } else {
            // Record failed login attempt
            $this->rateLimiter->recordAttempt($userid, 0);
            $remainingAttempts = $this->rateLimiter->getRemainingAttempts($userid);
            
            $message = 'Invalid userid or password';
            if ($remainingAttempts <= 2) {
                $message .= ". {$remainingAttempts} attempts remaining before account lockout.";
            }
            
            return json_encode(['success' => false, 'message' => $message]);
        }
    }
    
    // Refresh access token
    public function refreshToken($refreshToken) {
        // Validate refresh token
        $stmt = $this->db->prepare("SELECT userid, role FROM refresh_tokens WHERE token = ? AND expires_at > NOW()");
        $stmt->bind_param("s", $refreshToken);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 1) {
            $tokenData = $result->fetch_assoc();
            
            // Generate new access token
            $secretKey = 'your_secret_key_here';
            $accessPayload = [
                'userid' => $tokenData['userid'],
                'role' => $tokenData['role'],
                'iat' => time(),
                'exp' => time() + (15 * 60) // 15 minutes expiry
            ];
            $newAccessToken = JWT::encode($accessPayload, $secretKey, 'HS256');
            
            return json_encode([
                'success' => true,
                'accessToken' => $newAccessToken,
                'user' => [
                    'userid' => $tokenData['userid'],
                    'role' => $tokenData['role']
                ]
            ]);
        }
        
        return json_encode(['success' => false, 'message' => 'Invalid or expired refresh token']);
    }
    
    // Logout user (invalidate refresh token)
    public function logout($refreshToken) {
        // Remove refresh token from database
        $stmt = $this->db->prepare("DELETE FROM refresh_tokens WHERE token = ?");
        $stmt->bind_param("s", $refreshToken);
        $stmt->execute();
        
        return json_encode(['success' => true, 'message' => 'Logged out successfully']);
        }
    
    private function generateRefreshToken() {
        return bin2hex(random_bytes(32));
    }
    
    private function storeRefreshToken($userid, $refreshToken) {
        // Remove any existing refresh tokens for this user
        $stmt = $this->db->prepare("DELETE FROM refresh_tokens WHERE userid = ?");
        $stmt->bind_param("s", $userid);
        $stmt->execute();
        
        // Store new refresh token (expires in 7 days)
        $expiresAt = date('Y-m-d H:i:s', time() + (7 * 24 * 60 * 60));
        $stmt = $this->db->prepare("INSERT INTO refresh_tokens (userid, token, expires_at) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $userid, $refreshToken, $expiresAt);
        $stmt->execute();
    }

    // Get client IP address
    private function getClientIP() {
        $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    
                    // Return any valid IP address, including Docker internal IPs
                    if (filter_var($ip, FILTER_VALIDATE_IP) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        // If no IP found, return a placeholder
        return 'Unknown IP';
    }
    // Validate JWT token
    public function validateToken($token) {
        $secretKey = 'your_secret_key_here'; // Use the same key as in login
        try {
            $decoded = JWT::decode($token, new Key($secretKey, 'HS256'));
            
            // Check if user is blocked (for students)
            if (isset($decoded->role) && $decoded->role === 'student') {
                $monitoring = new StudentMonitoringModel($this->db);
                if ($monitoring->isStudentBlocked($decoded->userid)) {
                    return json_encode([
                        'success' => false,
                        'message' => 'Your account has been blocked by the administrator. Please contact support for assistance.',
                        'blocked' => true
                    ]);
                }
            }
            
            return json_encode([
                'success' => true,
                'data' => (array)$decoded
            ]);
        } catch (\Exception $e) {
            return json_encode([
                'success' => false,
                'message' => 'Invalid or expired token',
                'error' => $e->getMessage()
            ]);
        }
    }
    // OTP request for forgot password
    public function forgotPasswordRequestOtp($userid) {
    // Step 1: Call internal student API to get details by user_id
    $url = "http://host.docker.internal:8086/routes.php/get_with_id/$userid"; // Adjust if in Docker
    
    $response = file_get_contents($url);

    if ($response === FALSE) {
        return json_encode([
            'success' => false,
            'message' => "Failed to fetch student data for user ID: $userid"
        ]);
    }

    $userData = json_decode($response, true);

    // Step 2: Check if student data and mobile number exists
    if (!isset($userData['mobile_number'])) {
        return json_encode([
            'success' => false,
            'message' => "Mobile number not found for user ID: $userid"
        ]);
    }

    $phone_number = $userData['mobile_number'];

    // Step 3: Generate OTP
    $otp = rand(100000, 999999);

    // Step 4: Update OTP in your local database
    $user = new UserModel($this->db);
    $user->updateUser($userid, null, null, $otp);

    // Step 5: Send OTP to frontend endpoint
    $sendOtpUrl = 'https://down-south-front-end.onrender.com/send_otp';

    $postData = json_encode([
        'phoneNumber' => $phone_number,
        'otp' => (string)$otp
    ]);

    $ch = curl_init($sendOtpUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($postData)
    ]);

    $otpResponse = curl_exec($ch);

    if (curl_errno($ch)) {
        return json_encode([
            'success' => false,
            'message' => 'cURL Error: ' . curl_error($ch)
        ]);
    }

    $otpResponseData = json_decode($otpResponse, true);

    if ($otpResponseData === null) {
        return json_encode([
            'success' => false,
            'message' => 'Invalid JSON response from OTP service',
            'raw' => $otpResponse
        ]);
    }

    // Step 6: Return success
    return json_encode([
        'success' => true,
        'message' => 'OTP sent to ' . $phone_number
        // 'otp' => $otp, // Only for testing
        // 'response_message' => $otpResponseData['message'] ?? 'No message returned'
    ]);
}



// Reset password using OTP
public function resetPassword($userid, $otp, $newPassword) {
        $user = new UserModel($this->db);
        $userData = $user->getUserById($userid);
        if ($userData) {
            if (isset($userData['otp']) && $userData['otp'] == $otp) {
                // Update password and clear OTP (set to empty string)
                $user->updateUser($userid, null, $newPassword, '');
                return json_encode([
                    'success' => true,
                    'message' => 'Password reset successfully'
                ]);
            } else {
                return json_encode([
                    'success' => false,
                    'message' => 'Invalid OTP'
                ]);
            }
        } else {
            return json_encode([
                'success' => false,
                'message' => 'User not found'
            ]);
        }
    }

    // Send OTP for forgot password (using mobile number)
    public function sendOtpForForgotPassword($mobile) {
        // First, find the user by mobile number in local database
        $stmt = $this->db->prepare("
            SELECT u.userid, s.mobile 
            FROM users u 
            LEFT JOIN students s ON u.userid = s.userid 
            WHERE s.mobile = ? AND u.role = 'student'
        ");
        $stmt->bind_param("s", $mobile);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return json_encode([
                'success' => false,
                'message' => 'No student found with this mobile number'
            ]);
        }
        
        $user = $result->fetch_assoc();
        $userid = $user['userid'];
        
        // Generate OTP (6 digits)
        $otp = sprintf("%06d", mt_rand(0, 999999));
        
        // Store OTP in database with timestamp
        $stmt = $this->db->prepare("
            UPDATE users 
            SET otp = ?, otp_created_at = NOW() 
            WHERE userid = ?
        ");
        $stmt->bind_param("ss", $otp, $userid);
        
        if ($stmt->execute()) {
            // Send OTP via WhatsApp
            $whatsappService = new WhatsAppService();
            $whatsappResult = $whatsappService->sendOtp($mobile, $otp);
            
            if ($whatsappResult['success']) {
                return json_encode([
                    'success' => true,
                    'message' => 'OTP sent to WhatsApp successfully',
                    'otp' => $otp, // Remove this in production
                    'userid' => $userid
                ]);
            } else {
                // Fallback: return OTP for testing if WhatsApp fails
                return json_encode([
                    'success' => true,
                    'message' => 'OTP sent successfully (WhatsApp failed: ' . $whatsappResult['message'] . ')',
                    'otp' => $otp, // Remove this in production
                    'userid' => $userid
                ]);
            }
        } else {
            return json_encode([
                'success' => false,
                'message' => 'Failed to send OTP'
            ]);
        }
    }

    // Send OTP via WhatsApp
    private function sendWhatsAppOtp($mobile, $otp) {
        // Option 1: WhatsApp Business API (requires business verification)
        $whatsappApiUrl = 'https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages';
        $accessToken = 'YOUR_ACCESS_TOKEN'; // Get from Meta Developer Console
        
        $message = "Your TCMS verification code is: $otp\n\nThis code will expire in 15 minutes.\n\nDo not share this code with anyone.";
        
        $data = [
            'messaging_product' => 'whatsapp',
            'to' => $mobile,
            'type' => 'text',
            'text' => [
                'body' => $message
            ]
        ];
        
        $ch = curl_init($whatsappApiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            return ['success' => true, 'message' => 'WhatsApp message sent'];
        } else {
            return ['success' => false, 'message' => 'WhatsApp API error: ' . $response];
        }
    }

    // Reset password using OTP (using mobile number)
    public function resetPasswordWithOtp($mobile, $otp, $newPassword) {
        // First, find the user by mobile number
        $stmt = $this->db->prepare("
            SELECT u.userid, u.otp, u.otp_created_at
            FROM users u 
            LEFT JOIN students s ON u.userid = s.userid 
            WHERE s.mobile = ? AND u.role = 'student'
        ");
        $stmt->bind_param("s", $mobile);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return json_encode([
                'success' => false,
                'message' => 'No student found with this mobile number'
            ]);
        }
        
        $user = $result->fetch_assoc();
        
        // Check if OTP matches
        if ($user['otp'] !== $otp) {
            return json_encode([
                'success' => false,
                'message' => 'Invalid OTP'
            ]);
        }
        
        // Check if OTP is expired (15 minutes)
        if ($user['otp_created_at']) {
            $otpCreatedAt = new DateTime($user['otp_created_at']);
            $now = new DateTime();
            $diff = $now->diff($otpCreatedAt);
            
            if ($diff->i > 15) {
                return json_encode([
                    'success' => false,
                    'message' => 'OTP has expired'
                ]);
            }
        }
        
        // Hash new password
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        
        // Update password and clear OTP
        $stmt = $this->db->prepare("
            UPDATE users 
            SET password = ?, otp = NULL, otp_created_at = NULL 
            WHERE userid = ?
        ");
        $stmt->bind_param("ss", $hashedPassword, $user['userid']);
        
        if ($stmt->execute()) {
            return json_encode([
                'success' => true,
                'message' => 'Password reset successfully'
            ]);
        } else {
            return json_encode([
                'success' => false,
                'message' => 'Failed to reset password'
            ]);
        }
    }

    // Update student profile information
    public function updateStudentProfile($userid, $profileData) {
        // First, verify the user exists and is a student
        $stmt = $this->db->prepare("SELECT role FROM users WHERE userid = ?");
        $stmt->bind_param("s", $userid);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return json_encode([
                'success' => false,
                'message' => 'User not found'
            ]);
        }
        
        $user = $result->fetch_assoc();
        if ($user['role'] !== 'student') {
            return json_encode([
                'success' => false,
                'message' => 'User is not a student'
            ]);
        }
        
        // Update student information in the students table
        $stmt = $this->db->prepare("
            UPDATE students SET 
                firstName = ?,
                lastName = ?,
                email = ?,
                mobile = ?,
                nic = ?,
                gender = ?,
                age = ?,
                parentName = ?,
                parentMobile = ?,
                stream = ?,
                dateOfBirth = ?,
                school = ?,
                address = ?,
                district = ?
            WHERE userid = ?
        ");
        
        $stmt->bind_param("sssssssssssssss", 
            $profileData['firstName'],
            $profileData['lastName'],
            $profileData['email'],
            $profileData['mobile'],
            $profileData['nic'],
            $profileData['gender'],
            $profileData['age'],
            $profileData['parentName'],
            $profileData['parentMobile'],
            $profileData['stream'],
            $profileData['dateOfBirth'],
            $profileData['school'],
            $profileData['address'],
            $profileData['district'],
            $userid
        );
        
        if ($stmt->execute()) {
            return json_encode([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);
        } else {
            return json_encode([
                'success' => false,
                'message' => 'Failed to update profile'
            ]);
        }
    }

    // Change password for authenticated user
    public function changePassword($userid, $currentPassword, $newPassword) {
        // First, verify the current password
        $user = new UserModel($this->db);
        $userData = $user->getUserById($userid);
        
        if (!$userData) {
            return json_encode([
                'success' => false,
                'message' => 'User not found'
            ]);
        }
        
        // Verify current password
        if (!password_verify($currentPassword, $userData['password'])) {
            return json_encode([
                'success' => false,
                'message' => 'Current password is incorrect'
            ]);
        }
        
        // Hash the new password
        $hashedNewPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        
        // Update the password in the database
        $stmt = $this->db->prepare("UPDATE users SET password = ? WHERE userid = ?");
        $stmt->bind_param("ss", $hashedNewPassword, $userid);
        
        if ($stmt->execute()) {
            return json_encode([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);
        } else {
            return json_encode([
                'success' => false,
                'message' => 'Failed to change password'
            ]);
        }
    }

    // Get all students with complete information
    public function getAllStudents() {
        $stmt = $this->db->prepare("
            SELECT 
                u.userid,
                u.role,
                COALESCE(s.firstName, '') as firstName,
                COALESCE(s.lastName, '') as lastName,
                COALESCE(s.email, '') as email,
                COALESCE(s.mobile, '') as mobile,
                COALESCE(s.nic, '') as nic,
                COALESCE(s.gender, '') as gender,
                COALESCE(s.age, '') as age,
                COALESCE(s.parentName, '') as parentName,
                COALESCE(s.parentMobile, '') as parentMobile,
                COALESCE(s.stream, '') as stream,
                COALESCE(s.dateOfBirth, '') as dateOfBirth,
                COALESCE(s.school, '') as school,
                COALESCE(s.address, '') as address,
                COALESCE(s.district, '') as district,
                COALESCE(s.dateJoined, '') as dateJoined,
                COALESCE(b.barcode_data, '') as barcodeData,
                COALESCE(b.created_at, '') as barcodeCreatedAt
            FROM users u
            LEFT JOIN students s ON u.userid = s.userid
            LEFT JOIN barcodes b ON u.userid = b.userid
            WHERE u.role = 'student'
            ORDER BY u.userid
        ");
        $stmt->execute();
        $result = $stmt->get_result();
        
        $students = [];
        while ($row = $result->fetch_assoc()) {
            $students[] = $row;
        }
        
        return json_encode([
            'success' => true,
            'students' => $students
        ]);
    }

    // Get student by ID
    public function getStudentById($studentId) {
        $stmt = $this->db->prepare("
            SELECT 
                u.userid,
                u.role,
                COALESCE(s.firstName, '') as firstName,
                COALESCE(s.lastName, '') as lastName,
                COALESCE(s.email, '') as email,
                COALESCE(s.mobile, '') as mobile,
                COALESCE(s.nic, '') as nic,
                COALESCE(s.gender, '') as gender,
                COALESCE(s.age, '') as age,
                COALESCE(s.parentName, '') as parentName,
                COALESCE(s.parentMobile, '') as parentMobile,
                COALESCE(s.stream, '') as stream,
                COALESCE(s.dateOfBirth, '') as dateOfBirth,
                COALESCE(s.school, '') as school,
                COALESCE(s.address, '') as address,
                COALESCE(s.district, '') as district,
                COALESCE(s.dateJoined, '') as dateJoined
            FROM users u
            LEFT JOIN students s ON u.userid = s.userid
            WHERE u.role = 'student' AND u.userid = ?
        ");
        $stmt->bind_param("s", $studentId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            return json_encode([
                'success' => true,
                'data' => $row
            ]);
        } else {
            return json_encode([
                'success' => false,
                'message' => 'Student not found'
            ]);
        }
    }



    // Get all barcodes
    public function getAllBarcodes() {
        $stmt = $this->db->prepare("
            SELECT userid, barcode_data, student_name, created_at 
            FROM barcodes 
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $result = $stmt->get_result();
        
        $barcodes = [];
        while ($row = $result->fetch_assoc()) {
            $barcodes[] = $row;
        }
        
        return json_encode([
            'success' => true,
            'barcodes' => $barcodes
        ]);
    }

    // Get next cashier ID
    public function getNextCashierId() {
        $stmt = $this->db->prepare("
            SELECT MAX(CAST(SUBSTRING(userid, 2) AS UNSIGNED)) as max_id 
            FROM users 
            WHERE userid LIKE 'C%'
        ");
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        $nextId = 1;
        if ($row && $row['max_id']) {
            $nextId = $row['max_id'] + 1;
        }
        
        return json_encode([
            'success' => true,
            'data' => 'C' . str_pad($nextId, 3, '0', STR_PAD_LEFT)
        ]);
    }

    // Create cashier
    public function createCashier($data) {
        $name = $data['name'];
        $password = $data['password'];
        $phone = $data['phone'];
        $email = $data['email'] ?? '';

        // Get next cashier ID
        $stmt = $this->db->prepare("
            SELECT MAX(CAST(SUBSTRING(userid, 2) AS UNSIGNED)) as max_id 
            FROM users 
            WHERE userid LIKE 'C%'
        ");
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        $nextId = 1;
        if ($row && $row['max_id']) {
            $nextId = $row['max_id'] + 1;
        }
        
        $cashierId = 'C' . str_pad($nextId, 3, '0', STR_PAD_LEFT);
        
        // Hash the password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Create the cashier user
        $stmt = $this->db->prepare("
            INSERT INTO users (userid, password, role, name, email, phone) 
            VALUES (?, ?, 'cashier', ?, ?, ?)
        ");
        $stmt->bind_param("sssss", $cashierId, $hashedPassword, $name, $email, $phone);
        
        if ($stmt->execute()) {
            // Send WhatsApp message with credentials
            $whatsappService = new WhatsAppService();
            $message = "Hello $name! Your cashier account has been created.\n\nLogin Details:\nUser ID: $cashierId\nPassword: $password\n\nPlease change your password after first login.";
            
            $whatsappSent = false;
            $whatsappMessage = '';
            
            try {
                $whatsappResult = $whatsappService->sendCustomMessage($phone, $message);
                $whatsappSent = $whatsappResult['success'];
                $whatsappMessage = $whatsappResult['message'];
            } catch (Exception $e) {
                $whatsappSent = false;
                $whatsappMessage = $e->getMessage();
            }
            
            return json_encode([
                'success' => true,
                'message' => 'Cashier account created successfully',
                'cashier_id' => $cashierId,
                'whatsapp_sent' => $whatsappSent,
                'whatsapp_message' => $whatsappMessage
            ]);
        } else {
            return json_encode([
                'success' => false,
                'message' => 'Failed to create cashier account'
            ]);
        }
    }

    // Get all cashiers
    public function getAllCashiers() {
        $stmt = $this->db->prepare("
            SELECT userid, role, name, email, phone, created_at 
            FROM users 
            WHERE role = 'cashier'
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $result = $stmt->get_result();
        
        $cashiers = [];
        while ($row = $result->fetch_assoc()) {
            $cashiers[] = $row;
        }
        
        return json_encode([
            'success' => true,
            'cashiers' => $cashiers
        ]);
    }

    // Update cashier
    public function updateCashier($cashierId, $data) {
        // First, verify the user exists and is a cashier
        $stmt = $this->db->prepare("SELECT role FROM users WHERE userid = ?");
        $stmt->bind_param("s", $cashierId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return json_encode([
                'success' => false,
                'message' => 'Cashier not found'
            ]);
        }
        
        $user = $result->fetch_assoc();
        if ($user['role'] !== 'cashier') {
            return json_encode([
                'success' => false,
                'message' => 'User is not a cashier'
            ]);
        }
        
        // Build the update query dynamically based on provided fields
        $updateFields = [];
        $updateValues = [];
        $types = '';
        
        if (isset($data['name'])) {
            $updateFields[] = 'name = ?';
            $updateValues[] = $data['name'];
            $types .= 's';
        }
        
        if (isset($data['email'])) {
            $updateFields[] = 'email = ?';
            $updateValues[] = $data['email'];
            $types .= 's';
        }
        
        if (isset($data['phone'])) {
            $updateFields[] = 'phone = ?';
            $updateValues[] = $data['phone'];
            $types .= 's';
        }
        
        if (isset($data['password']) && !empty($data['password'])) {
            $updateFields[] = 'password = ?';
            $updateValues[] = password_hash($data['password'], PASSWORD_DEFAULT);
            $types .= 's';
        }
        
        if (empty($updateFields)) {
            return json_encode([
                'success' => false,
                'message' => 'No fields to update'
            ]);
        }
        
        // Add the cashier ID to the values array for the WHERE clause
        $updateValues[] = $cashierId;
        $types .= 's';
        
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE userid = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$updateValues);
        
        if ($stmt->execute()) {
            return json_encode([
                'success' => true,
                'message' => 'Cashier updated successfully'
            ]);
        } else {
            return json_encode([
                'success' => false,
                'message' => 'Failed to update cashier'
            ]);
        }
    }

    // Delete cashier
    public function deleteCashier($cashierId) {
        // First, verify the user exists and is a cashier
        $stmt = $this->db->prepare("SELECT role FROM users WHERE userid = ?");
        $stmt->bind_param("s", $cashierId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return json_encode([
                'success' => false,
                'message' => 'Cashier not found'
            ]);
        }
        
        $user = $result->fetch_assoc();
        if ($user['role'] !== 'cashier') {
            return json_encode([
                'success' => false,
                'message' => 'User is not a cashier'
            ]);
        }
        
        // Delete the cashier
        $stmt = $this->db->prepare("DELETE FROM users WHERE userid = ?");
        $stmt->bind_param("s", $cashierId);
        
        if ($stmt->execute()) {
            return json_encode([
                'success' => true,
                'message' => 'Cashier deleted successfully'
            ]);
        } else {
            return json_encode([
                'success' => false,
                'message' => 'Failed to delete cashier'
            ]);
        }
    }
}

