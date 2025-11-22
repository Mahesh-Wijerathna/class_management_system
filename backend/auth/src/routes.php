<?php
// Set JSON content type for all responses
header('Content-Type: application/json');

require_once __DIR__ . '/UserController.php';
require_once __DIR__ . '/UserModel.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$mysqli = new mysqli(
    getenv('DB_HOST'),
    getenv('DB_USER'),
    getenv('DB_PASSWORD'),
    getenv('DB_NAME')
);

if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$controller = new UserController($mysqli);

// Root path test
if ($method === 'GET' && ($path === '/' || $path === '/index.php')) {
    echo json_encode([
        'success' => true,
        'message' => 'Auth API is working!'
    ]);
    exit;
}

if ($method === 'GET' && $path === '/routes.php/test') {
    echo json_encode([
        'success' => true,
        'message' => 'Test route works!'
    ]);
    exit;
}

// CREATE user (register)
if ($method === 'POST' && $path === '/routes.php/user') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['role']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing role or password']);
        exit;
    }
    
    // If this is a student registration, redirect to student backend
    if ($data['role'] === 'student') {
        $studentData = [
            'firstName' => $data['firstName'] ?? '',
            'lastName' => $data['lastName'] ?? '',
            'nic' => $data['nic'] ?? '',
            'gender' => $data['gender'] ?? '',
            'age' => $data['age'] ?? '',
            'email' => $data['email'] ?? '',
            'mobile' => $data['mobile'] ?? '',
            'parentName' => $data['parentName'] ?? '',
            'parentMobile' => $data['parentMobile'] ?? '',
            'stream' => $data['stream'] ?? '',
            'dateOfBirth' => $data['dateOfBirth'] ?? '',
            'school' => $data['school'] ?? '',
            'address' => $data['address'] ?? '',
            'district' => $data['district'] ?? '',
            'registration_method' => $data['registration_method'] ?? 'Online' // Default to Online for web registration
        ];
        
        // First create the user in auth database
        $user = new UserModel($mysqli);
        if ($user->createUser($data['role'], $data['password'])) {
            $userid = $user->userid;
            
            // Then register student data in student backend
            $studentRegistrationData = [
                'userid' => $userid,
                'password' => $data['password'],
                'studentData' => $studentData
            ];
            
            $response = file_get_contents('http://student-backend/routes.php/register-student', false, stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: application/json',
                    'content' => json_encode($studentRegistrationData)
                ]
            ]));
            
            echo $response;
        } else {
            echo json_encode(['success' => false, 'message' => 'User creation failed']);
        }
        exit;
    }
    
    // For non-student registrations, handle normally
    echo $controller->register($data['role'], $data['password'], null);
    exit;
}



// LOGIN user
if ($method === 'POST' && $path === '/routes.php/login') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['userid']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing userid or password']);
        exit;
    }
    echo $controller->login($data['userid'], $data['password']);
    exit;
}

// REFRESH TOKEN
if ($method === 'POST' && $path === '/routes.php/refresh') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['refreshToken'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing refresh token']);
        exit;
    }
    echo $controller->refreshToken($data['refreshToken']);
    exit;
}

// LOGOUT user
if ($method === 'POST' && $path === '/routes.php/logout') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['refreshToken'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing refresh token']);
        exit;
    }
    echo $controller->logout($data['refreshToken']);
    exit;
}

// SAVE BARCODE
if ($method === 'POST' && $path === '/routes.php/barcode/save') {
    $data = json_decode(file_get_contents('php://input'), true);
    $controller->saveBarcode($data['userid'], $data['barcodeData'], $data['studentName']);
    exit;
}

// REGISTRATION OTP REQUEST
if ($method === 'POST' && $path === '/routes.php/registration-otp-request') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['mobile'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Mobile number is required']);
        exit;
    }
    echo $controller->registrationOtpRequest($data['mobile']);
    exit;
}
    
// VERIFY REGISTRATION OTP
if ($method === 'POST' && $path === '/routes.php/verify-registration-otp') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['mobile']) || !isset($data['otp'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Mobile number and OTP are required']);
        exit;
    }
    echo $controller->verifyRegistrationOtp($data['mobile'], $data['otp']);
    exit;
}

// GET BARCODE
if ($method === 'GET' && preg_match('#^/routes.php/barcode/([A-Za-z0-9]+)$#', $path, $matches)) {
    $userid = $matches[1];
    
    require_once __DIR__ . '/BarcodeController.php';
    $barcodeController = new BarcodeController($mysqli);
    echo $barcodeController->getBarcode($userid);
    exit;
}

// GET ALL BARCODES
if ($method === 'GET' && $path === '/routes.php/barcodes') {
    require_once __DIR__ . '/BarcodeController.php';
    $barcodeController = new BarcodeController($mysqli);
    echo $barcodeController->getAllBarcodes();
    exit;
}

// GET STUDENT BY ID
if ($method === 'GET' && $path === '/routes.php/get_student_by_id') {
    $studentId = $_GET['studentId'] ?? null;
    if (!$studentId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing studentId parameter']);
        exit;
    }
    echo $controller->getStudentById($studentId);
    exit;
}



// SEND OTP FOR FORGOT PASSWORD
if ($method === 'POST' && $path === '/routes.php/forgot-password/send-otp') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['mobile'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Mobile number is required']);
        exit;
    }
    
    echo $controller->sendOtpForForgotPassword($data['mobile']);
    exit;
}

// RESET PASSWORD WITH OTP
if ($method === 'POST' && $path === '/routes.php/forgot-password/reset') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['mobile']) || !isset($data['otp']) || !isset($data['newPassword'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Mobile, OTP, and new password are required']);
        exit;
    }
    
    echo $controller->resetPasswordWithOtp($data['mobile'], $data['otp'], $data['newPassword']);
    exit;
}

// GET all users
if ($method === 'GET' && $path === '/routes.php/users') {
    echo $controller->getAllUsers();
    exit;
}

// VALIDATE JWT TOKEN
if ($method === 'POST' && $path === '/routes.php/validate_token') {
    // echo json_encode(['message' => 'Validating token...']);
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['token'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing token']);
        exit;
    }
    echo $controller->validateToken($data['token']);
    exit;
}

// FORGOT PASSWORD (only needs userid)
if ($method === 'POST' && $path === '/routes.php/forgot_password_request_otp') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['userid'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing userid']);
        exit;
    }
    echo $controller->forgotPasswordRequestOtp($data['userid']);
    exit;
}
// RESET PASSWORD (needs userid, otp, new password)
if ($method === 'POST' && $path === '/routes.php/reset_password') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['userid']) || !isset($data['otp']) || !isset($data['new_password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing userid, otp or new password']);
        exit;
    }
    echo $controller->resetPassword($data['userid'], $data['otp'], $data['new_password']);
    exit;
}

// UPDATE STUDENT PROFILE
if ($method === 'PUT' && $path === '/routes.php/student/profile') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['userid']) || !isset($data['profileData'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing userid or profile data']);
        exit;
    }
    echo $controller->updateStudentProfile($data['userid'], $data['profileData']);
    exit;
}

// CHANGE PASSWORD
if ($method === 'POST' && $path === '/routes.php/change-password') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['userid']) || !isset($data['currentPassword']) || !isset($data['newPassword'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing userid, current password, or new password']);
        exit;
    }
    echo $controller->changePassword($data['userid'], $data['currentPassword'], $data['newPassword']);
    exit;
}

// READ user by ID
if ($method === 'GET' && preg_match('#^/routes.php/user/(\\d+)$#', $path, $matches)) {
    $userid = $matches[1];
    echo $controller->getUser($userid);
    exit;
}

// UPDATE user by ID
if ($method === 'PUT' && preg_match('#^/routes.php/user/([A-Za-z0-9]+)$#', $path, $matches)) {
    $userid = $matches[1];
    parse_str(file_get_contents('php://input'), $data);
    if (!isset($data['role']) && !isset($data['password']) && !isset($data['otp'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }
    echo $controller->updateUser($userid, $data['role'] ?? null, $data['password'] ?? null, $data['otp'] ?? null);
    exit;
}

// DELETE user by ID (handles both regular users and students)
if ($method === 'DELETE' && preg_match('#^/routes.php/user/([A-Za-z0-9]+)$#', $path, $matches)) {
    $userid = $matches[1];
    require_once __DIR__ . '/UserModel.php';
    $userModel = new UserModel($mysqli);
    $result = $userModel->deleteUser($userid);
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete user']);
    }
    exit;
}

// GET next cashier ID
if ($method === 'GET' && $path === '/routes.php/next-cashier-id') {
    echo $controller->getNextCashierId();
    exit;
}

// CREATE cashier
if ($method === 'POST' && $path === '/routes.php/cashier') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['name']) || !isset($data['password']) || !isset($data['phone'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing name, password, or phone number']);
        exit;
    }
    echo $controller->createCashier($data);
    exit;
}

// GET all cashiers
if ($method === 'GET' && $path === '/routes.php/cashiers') {
    echo $controller->getAllCashiers();
    exit;
}

// UPDATE cashier by ID
if ($method === 'PUT' && preg_match('#^/routes.php/cashier/([A-Za-z0-9]+)$#', $path, $matches)) {
    $cashierId = $matches[1];
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['name']) && !isset($data['email']) && !isset($data['phone']) && !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }
    echo $controller->updateCashier($cashierId, $data);
    exit;
}

// DELETE cashier by ID
if ($method === 'POST' && preg_match('#^/routes.php/cashier/([A-Za-z0-9]+)/delete$#', $path, $matches)) {
    $cashierId = $matches[1];
    echo $controller->deleteCashier($cashierId);
    exit;
}

// =====================================================
// TEACHER ROUTES (CENTRALIZED AUTHENTICATION)
// =====================================================

// CREATE teacher
if ($method === 'POST' && $path === '/routes.php/teacher') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['password']) || !isset($data['name']) || !isset($data['email']) || !isset($data['phone'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields: password, name, email, phone']);
        exit;
    }
    
    // First create the teacher in auth database
    $user = new UserModel($mysqli);
    $teacherId = $user->generateUserId('teacher');
    
    // Check if teacher ID already exists
    if ($user->getUserById($teacherId)) {
        echo json_encode(['success' => false, 'message' => 'Teacher ID already exists']);
        exit;
    }
    
    // Check if email already exists
    if ($user->emailExists($data['email'])) {
        echo json_encode(['success' => false, 'message' => 'Email already exists']);
        exit;
    }
    
    // Check if phone number already exists in teacher backend
    $phoneCheckResponse = file_get_contents('http://host.docker.internal:8088/routes.php/check_phone_exists?phone=' . urlencode($data['phone']));
    if ($phoneCheckResponse !== false) {
        $phoneCheckResult = json_decode($phoneCheckResponse, true);
        if ($phoneCheckResult && $phoneCheckResult['exists']) {
            echo json_encode(['success' => false, 'message' => 'Phone number already exists']);
            exit;
        }
    }
    
    // Create teacher in auth database
    $result = $user->createTeacherUser($teacherId, $data['password'], $data['name'], $data['email'], $data['phone']);
    
    if ($result) {
        // Then register teacher data in teacher backend
        $teacherRegistrationData = [
            'teacherId' => $teacherId,
            'designation' => $data['designation'] ?? 'Mr.',
            'name' => $data['name'],
            'stream' => $data['stream'] ?? 'Not Specified',
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => $data['password'],
            'status' => 'active'
        ];
        
        $response = file_get_contents('http://host.docker.internal:8088/routes.php/create_teacher', false, stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => 'Content-Type: application/json',
                'content' => json_encode($teacherRegistrationData)
            ]
        ]));
        
        if ($response !== false) {
            $teacherBackendResponse = json_decode($response, true);
            if ($teacherBackendResponse && $teacherBackendResponse['success']) {
                // Send welcome message via WhatsApp
                $whatsappResult = $controller->sendTeacherWelcomeMessage($teacherId, $data['name'], $data['phone'], $data['password']);
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Teacher created successfully',
                    'teacherId' => $teacherId,
                    'whatsapp_sent' => $whatsappResult,
                    'whatsapp_message' => $whatsappResult ? 'Welcome message sent successfully' : 'WhatsApp service unavailable'
                ]);
            } else {
                // Teacher backend failed, but auth backend succeeded
                echo json_encode([
                    'success' => false, 
                    'message' => 'Teacher created in auth system but failed to create in teacher backend: ' . ($teacherBackendResponse['message'] ?? 'Unknown error')
                ]);
            }
        } else {
            // Teacher backend call failed
            echo json_encode([
                'success' => false, 
                'message' => 'Teacher created in auth system but failed to connect to teacher backend'
            ]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create teacher in auth system']);
    }
    exit;
}

// GET all teachers
if ($method === 'GET' && $path === '/routes.php/teachers') {
    echo $controller->getAllTeachers();
    exit;
}

// GET teacher by ID
if ($method === 'GET' && preg_match('#^/routes.php/teacher/([A-Za-z0-9]+)$#', $path, $matches)) {
    $teacherId = $matches[1];
    echo $controller->getTeacher($teacherId);
    exit;
}

// UPDATE teacher by ID
if ($method === 'PUT' && preg_match('#^/routes.php/teacher/([A-Za-z0-9]+)$#', $path, $matches)) {
    $teacherId = $matches[1];
    $data = json_decode(file_get_contents('php://input'), true);
    echo $controller->updateTeacher($teacherId, $data);
    exit;
}

// DELETE teacher by ID
if ($method === 'DELETE' && preg_match('#^/routes.php/teacher/([A-Za-z0-9]+)$#', $path, $matches)) {
    $teacherId = $matches[1];
    echo $controller->deleteTeacher($teacherId);
    exit;
}

// Teacher login
if ($method === 'POST' && $path === '/routes.php/teacher/login') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['teacherId']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Teacher ID and password are required']);
        exit;
    }
    echo $controller->teacherLogin($data['teacherId'], $data['password']);
    exit;
}

// Teacher login with email
if ($method === 'POST' && $path === '/routes.php/teacher/login-email') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email and password are required']);
        exit;
    }
    echo $controller->teacherLoginWithEmail($data['email'], $data['password']);
    exit;
}

// Teacher forgot password OTP request
if ($method === 'POST' && $path === '/routes.php/teacher/forgot-password-otp') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['userid'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Teacher ID is required']);
        exit;
    }
    echo $controller->teacherForgotPasswordRequestOtp($data['userid']);
    exit;
}

// =====================================================
// STUDENT MONITORING ROUTES (REDIRECTED TO STUDENT BACKEND)
// =====================================================

// Track student login activity
if ($method === 'POST' && $path === '/routes.php/track-student-login') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Pass through the original User-Agent header
    $headers = ['Content-Type: application/json'];
    if (isset($_SERVER['HTTP_USER_AGENT'])) {
        $headers[] = 'User-Agent: ' . $_SERVER['HTTP_USER_AGENT'];
    }
    
    $response = file_get_contents('http://student-backend/routes.php/track-student-login', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => json_encode($data)
        ]
    ]));
    echo $response;
    exit;
}

// Track concurrent session
if ($method === 'POST' && $path === '/routes.php/track-concurrent-session') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Pass through the original User-Agent header
    $headers = ['Content-Type: application/json'];
    if (isset($_SERVER['HTTP_USER_AGENT'])) {
        $headers[] = 'User-Agent: ' . $_SERVER['HTTP_USER_AGENT'];
    }
    
    $response = file_get_contents('http://student-backend/routes.php/track-concurrent-session', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => json_encode($data)
        ]
    ]));
    echo $response;
    exit;
}

// End concurrent session
if ($method === 'POST' && $path === '/routes.php/end-concurrent-session') {
    $data = json_decode(file_get_contents('php://input'), true);
    $response = file_get_contents('http://student-backend/routes.php/end-concurrent-session', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($data)
        ]
    ]));
    echo $response;
    exit;
}

// Get student monitoring data
if ($method === 'GET' && preg_match('#^/routes.php/student-monitoring/([A-Za-z0-9]+)$#', $path, $matches)) {
    $studentId = $matches[1];
    $limit = $_GET['limit'] ?? 50;
    $response = file_get_contents("http://student-backend/routes.php/student-monitoring/$studentId?limit=$limit");
    echo $response;
    exit;
}

// Get suspicious activities
if ($method === 'GET' && $path === '/routes.php/suspicious-activities') {
    $limit = $_GET['limit'] ?? 100;
    $response = file_get_contents("http://student-backend/routes.php/suspicious-activities?limit=$limit");
    echo $response;
    exit;
}

// Get concurrent session violations
if ($method === 'GET' && $path === '/routes.php/concurrent-violations') {
    $limit = $_GET['limit'] ?? 100;
    $response = file_get_contents("http://student-backend/routes.php/concurrent-violations?limit=$limit");
    echo $response;
    exit;
}

// Block student
if ($method === 'POST' && $path === '/routes.php/block-student') {
    $data = json_decode(file_get_contents('php://input'), true);
    $response = file_get_contents('http://student-backend/routes.php/block-student', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($data)
        ]
    ]));
    echo $response;
    exit;
}

// Unblock student
if ($method === 'POST' && $path === '/routes.php/unblock-student') {
    $data = json_decode(file_get_contents('php://input'), true);
    $response = file_get_contents('http://student-backend/routes.php/unblock-student', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($data)
        ]
    ]));
    echo $response;
    exit;
}

// Check if student is blocked
if ($method === 'GET' && preg_match('#^/routes.php/student-blocked/([A-Za-z0-9]+)$#', $path, $matches)) {
    $studentId = $matches[1];
    $response = file_get_contents("http://student-backend/routes.php/student-blocked/$studentId");
    echo $response;
    exit;
}

// Get student block history
if ($method === 'GET' && preg_match('#^/routes.php/student-block-history/([A-Za-z0-9]+)$#', $path, $matches)) {
    $studentId = $matches[1];
    $response = file_get_contents("http://student-backend/routes.php/student-block-history/$studentId");
    echo $response;
    exit;
}

// Get monitoring statistics
if ($method === 'GET' && $path === '/routes.php/monitoring-statistics') {
    $response = file_get_contents("http://student-backend/routes.php/monitoring-statistics");
    echo $response;
    exit;
}

// Detect cheating
if ($method === 'POST' && $path === '/routes.php/detect-cheating') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['studentId']) || !isset($data['classId']) || !isset($data['sessionId'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing studentId, classId, or sessionId']);
        exit;
    }
    $response = file_get_contents('http://student-backend/routes.php/detect-cheating', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($data)
        ]
    ]));
    echo $response;
    exit;
}

// Get detailed monitoring report
if ($method === 'GET' && $path === '/routes.php/monitoring-report') {
    $studentId = $_GET['studentId'] ?? null;
    $dateFrom = $_GET['dateFrom'] ?? null;
    $dateTo = $_GET['dateTo'] ?? null;
    $params = [];
    if ($studentId) $params[] = "studentId=$studentId";
    if ($dateFrom) $params[] = "dateFrom=$dateFrom";
    if ($dateTo) $params[] = "dateTo=$dateTo";
    $queryString = implode('&', $params);
    $url = "http://student-backend/routes.php/monitoring-report";
    if ($queryString) $url .= "?$queryString";
    $response = file_get_contents($url);
    echo $response;
    exit;
}

// Check for concurrent logins
if ($method === 'GET' && preg_match('#^/routes.php/check-concurrent-logins/([A-Za-z0-9]+)$#', $path, $matches)) {
    $studentId = $matches[1];
    $response = file_get_contents("http://student-backend/routes.php/check-concurrent-logins/$studentId");
    echo $response;
    exit;
}

// Get student devices
if ($method === 'GET' && preg_match('#^/routes.php/student-devices/([A-Za-z0-9]+)$#', $path, $matches)) {
    $studentId = $matches[1];
    $response = file_get_contents("http://student-backend/routes.php/student-devices/$studentId");
    echo $response;
    exit;
}

// Detect multiple device login
if ($method === 'POST' && $path === '/routes.php/detect-multiple-device-login') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['studentId']) || !isset($data['deviceFingerprint'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing studentId or deviceFingerprint']);
        exit;
    }
    $response = file_get_contents('http://student-backend/routes.php/detect-multiple-device-login', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($data)
        ]
    ]));
    echo $response;
    exit;
}

// Check if session is valid (for real-time session validation)
if ($method === 'GET' && preg_match('#^/routes.php/session-valid/([A-Za-z0-9]+)$#', $path, $matches)) {
    $studentId = $matches[1];
    $response = file_get_contents("http://student-backend/routes.php/session-valid/$studentId");
    echo $response;
    exit;
}

// Send welcome WhatsApp message
if ($method === 'POST' && $path === '/routes.php/send-welcome-whatsapp') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['userid']) || !isset($data['studentData'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing userid or studentData']);
        exit;
    }
    echo $controller->sendWelcomeWhatsAppMessage($data['userid'], $data['studentData']);
    exit;
}

echo json_encode(['path' => $path, 'method' => $method, 'message' => 'Route not found']);