<?php
require_once __DIR__ . '/UserController.php';

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
    
    // Extract student data if this is a student registration
    $studentData = null;
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
            'district' => $data['district'] ?? ''
        ];
    }
    
    echo $controller->register($data['role'], $data['password'], $studentData);
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
    if (!isset($data['userid']) || !isset($data['barcodeData']) || !isset($data['studentName'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required barcode data']);
        exit;
    }
    
    require_once __DIR__ . '/BarcodeController.php';
    $barcodeController = new BarcodeController($mysqli);
    echo $barcodeController->saveBarcode($data['userid'], $data['barcodeData'], $data['studentName']);
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

// GET ALL STUDENTS WITH COMPLETE INFORMATION
if ($method === 'GET' && $path === '/routes.php/students') {
    echo $controller->getAllStudents();
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

// DELETE user by ID
if ($method === 'DELETE' && preg_match('#^/routes.php/user/(\\d+)$#', $path, $matches)) {
    $userid = $matches[1];
    echo $controller->deleteUser($userid);
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
// STUDENT MONITORING ROUTES
// =====================================================

require_once __DIR__ . '/StudentMonitoringController.php';
$monitoringController = new StudentMonitoringController($mysqli);

// Track student login activity
if ($method === 'POST' && $path === '/routes.php/track-student-login') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['studentId']) || !isset($data['sessionId'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing studentId or sessionId']);
        exit;
    }
    echo json_encode($monitoringController->trackStudentLogin($data['studentId'], $data['sessionId']));
    exit;
}

// Track concurrent session
if ($method === 'POST' && $path === '/routes.php/track-concurrent-session') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['studentId']) || !isset($data['sessionId']) || !isset($data['classId'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing studentId, sessionId, or classId']);
        exit;
    }
    echo json_encode($monitoringController->trackConcurrentSession($data['studentId'], $data['sessionId'], $data['classId']));
    exit;
}

// End concurrent session
if ($method === 'POST' && $path === '/routes.php/end-concurrent-session') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['sessionId'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing sessionId']);
        exit;
    }
    echo json_encode($monitoringController->endConcurrentSession($data['sessionId']));
    exit;
}

// Get student monitoring data
if ($method === 'GET' && preg_match('#^/routes.php/student-monitoring/([A-Za-z0-9]+)$#', $path, $matches)) {
    $studentId = $matches[1];
    $limit = $_GET['limit'] ?? 50;
    echo json_encode($monitoringController->getStudentMonitoringData($studentId, $limit));
    exit;
}

// Get suspicious activities
if ($method === 'GET' && $path === '/routes.php/suspicious-activities') {
    $limit = $_GET['limit'] ?? 100;
    echo json_encode($monitoringController->getSuspiciousActivities($limit));
    exit;
}

// Get concurrent session violations
if ($method === 'GET' && $path === '/routes.php/concurrent-violations') {
    $limit = $_GET['limit'] ?? 100;
    echo json_encode($monitoringController->getConcurrentSessionViolations($limit));
    exit;
}

// Block student
if ($method === 'POST' && $path === '/routes.php/block-student') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['studentId']) || !isset($data['reason']) || !isset($data['blockedBy'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing studentId, reason, or blockedBy']);
        exit;
    }
    $blockDuration = $data['blockDuration'] ?? 24;
    echo json_encode($monitoringController->blockStudent($data['studentId'], $data['reason'], $data['blockedBy'], $blockDuration));
    exit;
}

// Unblock student
if ($method === 'POST' && $path === '/routes.php/unblock-student') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['studentId'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing studentId']);
        exit;
    }
    echo json_encode($monitoringController->unblockStudent($data['studentId']));
    exit;
}

// Check if student is blocked
if ($method === 'GET' && preg_match('#^/routes.php/student-blocked/([A-Za-z0-9]+)$#', $path, $matches)) {
    $studentId = $matches[1];
    echo json_encode($monitoringController->isStudentBlocked($studentId));
    exit;
}

// Get student block history
if ($method === 'GET' && preg_match('#^/routes.php/student-block-history/([A-Za-z0-9]+)$#', $path, $matches)) {
    $studentId = $matches[1];
    echo json_encode($monitoringController->getStudentBlockHistory($studentId));
    exit;
}

// Get monitoring statistics
if ($method === 'GET' && $path === '/routes.php/monitoring-statistics') {
    echo json_encode($monitoringController->getMonitoringStatistics());
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
    echo json_encode($monitoringController->detectCheating($data['studentId'], $data['classId'], $data['sessionId']));
    exit;
}

// Get detailed monitoring report
if ($method === 'GET' && $path === '/routes.php/monitoring-report') {
    $studentId = $_GET['studentId'] ?? null;
    $dateFrom = $_GET['dateFrom'] ?? null;
    $dateTo = $_GET['dateTo'] ?? null;
    echo json_encode($monitoringController->getDetailedMonitoringReport($studentId, $dateFrom, $dateTo));
    exit;
}

// Check for concurrent logins
if ($method === 'GET' && preg_match('#^/routes.php/check-concurrent-logins/([A-Za-z0-9]+)$#', $path, $matches)) {
    $studentId = $matches[1];
    echo json_encode($monitoringController->checkConcurrentLogins($studentId));
    exit;
}

// Get student devices
if ($method === 'GET' && preg_match('#^/routes.php/student-devices/([A-Za-z0-9]+)$#', $path, $matches)) {
    $studentId = $matches[1];
    echo json_encode($monitoringController->getStudentDevices($studentId));
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
    echo json_encode($monitoringController->detectMultipleDeviceLogin($data['studentId'], $data['deviceFingerprint']));
    exit;
}

// Check if session is valid (for real-time session validation)
if ($method === 'GET' && preg_match('#^/routes.php/session-valid/([A-Za-z0-9]+)$#', $path, $matches)) {
    $studentId = $matches[1];
    echo json_encode($monitoringController->isSessionValid($studentId));
    exit;
}

echo json_encode(['path' => $path, 'method' => $method, 'message' => 'Route not found']);