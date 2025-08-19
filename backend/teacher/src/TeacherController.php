<?php
// Set timezone for all date/time operations
date_default_timezone_set('Asia/Colombo');

require_once 'TeacherModel.php';
require_once 'config.php';


class TeacherController {
    private $model;
    private $conn;
    
    public function __construct() {
        $this->conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($this->conn->connect_error) {
            throw new Exception("Connection failed: " . $this->conn->connect_error);
        }
        
        $this->model = new TeacherModel($this->conn);
    }
    
    // Create a new teacher
    public function createTeacher($data) {
        try {
            // Auto-generate teacher ID if not provided
            if (empty($data['teacherId'])) {
                $data['teacherId'] = $this->model->generateNextTeacherId();
            }
            
            // Validate required fields
            $requiredFields = ['designation', 'name', 'stream', 'email', 'phone', 'password'];
            foreach ($requiredFields as $field) {
                if (empty($data[$field])) {
                    return [
                        'success' => false,
                        'message' => ucfirst($field) . ' is required'
                    ];
                }
            }
            
            // Validate email format
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                return [
                    'success' => false,
                    'message' => 'Invalid email format'
                ];
            }
            
            // Check if teacherId already exists
            if ($this->model->teacherIdExists($data['teacherId'])) {
                return [
                    'success' => false,
                    'message' => 'Teacher ID already exists'
                ];
            }
            
            // Check if email already exists
            if ($this->model->emailExists($data['email'])) {
                return [
                    'success' => false,
                    'message' => 'Email already exists'
                ];
            }
            
            // Check if phone number already exists
            if ($this->model->phoneExists($data['phone'])) {
                return [
                    'success' => false,
                    'message' => 'Phone number already exists'
                ];
            }
            
            // Validate phone number (Sri Lankan format)
            if (!preg_match('/^0\d{9}$/', $data['phone'])) {
                return [
                    'success' => false,
                    'message' => 'Invalid phone number format (should be 10 digits, start with 0)'
                ];
            }
            
            // Validate password strength
            if (strlen($data['password']) < 8) {
                return [
                    'success' => false,
                    'message' => 'Password must be at least 8 characters long'
                ];
            }
            
            $result = $this->model->createTeacher($data);
            
            // If teacher creation was successful, send credentials via external service
            if ($result['success']) {
                try {
                    // Format phone number for external service
                    $phone = $data['phone'];
                    $formatted_phone = $phone;
                    if (strlen($phone) === 10 && substr($phone, 0, 1) === '0') {
                        $formatted_phone = '94' . substr($phone, 1);
                    } elseif (strlen($phone) === 9 && substr($phone, 0, 1) === '0') {
                        $formatted_phone = '94' . substr($phone, 1);
                    } elseif (strlen($phone) === 11 && substr($phone, 0, 2) === '94') {
                        $formatted_phone = $phone;
                    } elseif (strlen($phone) === 10 && substr($phone, 0, 1) === '7') {
                        $formatted_phone = '94' . $phone;
                    }

                    // Send credentials via external service
                    $sendOtpUrl = 'https://down-south-front-end.onrender.com/send_otp';
                    $message = "Hello {$data['name']}! Your teacher account has been created.\n\nLogin Details:\nUser ID: {$data['teacherId']}\nPassword: {$data['password']}\n\nPlease change your password after first login.";
                    
                    $postData = json_encode([
                        'phoneNumber' => $formatted_phone,
                        'otp' => $message // Using the message as OTP field for credentials
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
                    $externalServiceSuccess = false;
                    $externalServiceMessage = '';

                    if (curl_errno($ch)) {
                        $externalServiceMessage = 'cURL Error: ' . curl_error($ch);
                    } else {
                        $otpResponseData = json_decode($otpResponse, true);
                        if ($otpResponseData && isset($otpResponseData['success'])) {
                            $externalServiceSuccess = $otpResponseData['success'];
                            $externalServiceMessage = $otpResponseData['message'] ?? 'No message returned';
                        } else {
                            $externalServiceMessage = 'Invalid response from external service';
                        }
                    }
                    curl_close($ch);
                    
                    // Add external service result to the response
                    $result['credentials_sent'] = $externalServiceSuccess;
                    $result['credentials_message'] = $externalServiceMessage;
                    
                } catch (Exception $e) {
                    // External service sending failed, but teacher was created successfully
                    $result['credentials_sent'] = false;
                    $result['credentials_message'] = 'Failed to send credentials: ' . $e->getMessage();
                }
            }
            
            return $result;
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error creating teacher: ' . $e->getMessage()
            ];
        }
    }
    
    // Get all teachers
    public function getAllTeachers() {
        try {
            $teachers = $this->model->getAllTeachers();
            return [
                'success' => true,
                'data' => $teachers,
                'message' => 'Teachers retrieved successfully'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error retrieving teachers: ' . $e->getMessage()
            ];
        }
    }
    
    // Get active teachers only
    public function getActiveTeachers() {
        try {
            $teachers = $this->model->getActiveTeachers();
            return [
                'success' => true,
                'data' => $teachers,
                'message' => 'Active teachers retrieved successfully'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error retrieving active teachers: ' . $e->getMessage()
            ];
        }
    }
    
    // Get teacher by ID
    public function getTeacherById($teacherId) {
        try {
            if (empty($teacherId)) {
                return [
                    'success' => false,
                    'message' => 'Teacher ID is required'
                ];
            }
            
            $teacher = $this->model->getTeacherById($teacherId);
            
            if (!$teacher) {
                return [
                    'success' => false,
                    'message' => 'Teacher not found'
                ];
            }
            
            return [
                'success' => true,
                'data' => $teacher,
                'message' => 'Teacher retrieved successfully'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error retrieving teacher: ' . $e->getMessage()
            ];
        }
    }
    
    // Get teacher by ID for editing (includes password placeholder)
    public function getTeacherByIdForEdit($teacherId) {
        try {
            if (empty($teacherId)) {
                return [
                    'success' => false,
                    'message' => 'Teacher ID is required'
                ];
            }
            
            $teacher = $this->model->getTeacherByIdForEdit($teacherId);
            
            if (!$teacher) {
                return [
                    'success' => false,
                    'message' => 'Teacher not found'
                ];
            }
            
            return [
                'success' => true,
                'data' => $teacher,
                'message' => 'Teacher retrieved successfully for editing'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error retrieving teacher: ' . $e->getMessage()
            ];
        }
    }
    
    // Teacher login with email
    public function login($email, $password) {
        try {
            if (empty($email) || empty($password)) {
                return [
                    'success' => false,
                    'message' => 'Email and password are required'
                ];
            }
            
            $teacher = $this->model->getTeacherByEmail($email);
            
            if (!$teacher) {
                return [
                    'success' => false,
                    'message' => 'Invalid email or password'
                ];
            }
            
            if ($teacher['status'] !== 'active') {
                return [
                    'success' => false,
                    'message' => 'Account is inactive'
                ];
            }
            
            if (!password_verify($password, $teacher['password'])) {
                return [
                    'success' => false,
                    'message' => 'Invalid email or password'
                ];
            }
            
            // Remove password from response
            unset($teacher['password']);
            
            return [
                'success' => true,
                'data' => $teacher,
                'message' => 'Login successful'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error during login: ' . $e->getMessage()
            ];
        }
    }
    
    // Teacher login with Teacher ID
    public function loginWithTeacherId($teacherId, $password) {
        try {
            if (empty($teacherId) || empty($password)) {
                return [
                    'success' => false,
                    'message' => 'Teacher ID and password are required'
                ];
            }
            
            $teacher = $this->model->getTeacherByIdWithPassword($teacherId);
            
            if (!$teacher) {
                return [
                    'success' => false,
                    'message' => 'Invalid Teacher ID or password'
                ];
            }
            
            if ($teacher['status'] !== 'active') {
                return [
                    'success' => false,
                    'message' => 'Account is inactive'
                ];
            }
            
            if (!password_verify($password, $teacher['password'])) {
                return [
                    'success' => false,
                    'message' => 'Invalid Teacher ID or password'
                ];
            }
            
            // Remove password from response
            unset($teacher['password']);
            
            // Generate simple tokens for frontend compatibility
            $accessToken = bin2hex(random_bytes(32));
            $refreshToken = bin2hex(random_bytes(32));
            
            // Add role and tokens to response
            $teacher['role'] = 'teacher';
            
            return [
                'success' => true,
                'accessToken' => $accessToken,
                'refreshToken' => $refreshToken,
                'user' => $teacher,
                'message' => 'Login successful'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error during login: ' . $e->getMessage()
            ];
        }
    }
    
    // Update teacher
    public function updateTeacher($teacherId, $data) {
        try {
            if (empty($teacherId)) {
                return [
                    'success' => false,
                    'message' => 'Teacher ID is required'
                ];
            }
            
            // Check if teacher exists
            $existingTeacher = $this->model->getTeacherById($teacherId);
            if (!$existingTeacher) {
                return [
                    'success' => false,
                    'message' => 'Teacher not found'
                ];
            }
            
            // Validate email if provided
            if (!empty($data['email'])) {
                if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                    return [
                        'success' => false,
                        'message' => 'Invalid email format'
                    ];
                }
                
                // Check if email exists (excluding current teacher)
                if ($this->model->emailExists($data['email'], $teacherId)) {
                    return [
                        'success' => false,
                        'message' => 'Email already exists'
                    ];
                }
            }
            
            // Validate phone number if provided
            if (!empty($data['phone'])) {
                if (!preg_match('/^0\d{9}$/', $data['phone'])) {
                    return [
                        'success' => false,
                        'message' => 'Invalid phone number format (should be 10 digits starting with 0)'
                    ];
                }
            }
            
            // Validate password if provided
            if (!empty($data['password'])) {
                if (strlen($data['password']) < 8) {
                    return [
                        'success' => false,
                        'message' => 'Password must be at least 8 characters long'
                    ];
                }
            }
            
            $result = $this->model->updateTeacher($teacherId, $data);
            return $result;
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error updating teacher: ' . $e->getMessage()
            ];
        }
    }
    
    // Delete teacher
    public function deleteTeacher($teacherId) {
        try {
            if (empty($teacherId)) {
                return [
                    'success' => false,
                    'message' => 'Teacher ID is required'
                ];
            }
            
            // Check if teacher exists
            $existingTeacher = $this->model->getTeacherById($teacherId);
            if (!$existingTeacher) {
                return [
                    'success' => false,
                    'message' => 'Teacher not found'
                ];
            }
            
            $result = $this->model->deleteTeacher($teacherId);
            return $result;
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error deleting teacher: ' . $e->getMessage()
            ];
        }
    }
    
    // Change teacher password
    public function changePassword($teacherId, $currentPassword, $newPassword) {
        try {
            if (empty($teacherId) || empty($currentPassword) || empty($newPassword)) {
                return [
                    'success' => false,
                    'message' => 'Teacher ID, current password, and new password are required'
                ];
            }
            
            // Get teacher with password
            $teacher = $this->model->getTeacherByEmail($teacherId); // Assuming teacherId is email for login
            
            if (!$teacher) {
                return [
                    'success' => false,
                    'message' => 'Teacher not found'
                ];
            }
            
            // Verify current password
            if (!password_verify($currentPassword, $teacher['password'])) {
                return [
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ];
            }
            
            // Validate new password strength
            if (strlen($newPassword) < 8) {
                return [
                    'success' => false,
                    'message' => 'New password must be at least 8 characters long'
                ];
            }
            
            $result = $this->model->changePassword($teacher['teacherId'], $newPassword);
            return $result;
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error changing password: ' . $e->getMessage()
            ];
        }
    }
    
    // Get teachers by stream
    public function getTeachersByStream($stream) {
        try {
            if (empty($stream)) {
                return [
                    'success' => false,
                    'message' => 'Stream is required'
                ];
            }
            
            $teachers = $this->model->getTeachersByStream($stream);
            return [
                'success' => true,
                'data' => $teachers,
                'message' => 'Teachers retrieved successfully'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error retrieving teachers: ' . $e->getMessage()
            ];
        }
    }
    
    // Get next teacher ID
    public function getNextTeacherId() {
        try {
            $nextId = $this->model->generateNextTeacherId();
            return [
                'success' => true,
                'data' => $nextId,
                'message' => 'Next teacher ID generated successfully'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error generating teacher ID: ' . $e->getMessage()
            ];
        }
    }
    
    // Check if phone number exists
    public function checkPhoneExists($phone) {
        try {
            if (empty($phone)) {
                return [
                    'success' => false,
                    'message' => 'Phone number is required'
                ];
            }
            
            $exists = $this->model->phoneExists($phone);
            return [
                'success' => true,
                'exists' => $exists,
                'message' => $exists ? 'Phone number already exists' : 'Phone number is available'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error checking phone number: ' . $e->getMessage()
            ];
        }
    }
    
    public function __destruct() {
        if ($this->conn) {
            $this->conn->close();
        }
    }
} 