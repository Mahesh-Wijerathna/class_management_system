<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// DB config
$servername = "127.0.0.1:3307";
$username = "root";
$password = "";
$dbname = "tuition_center_db";

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON input");
    }

    // Validate inputs
    $identifier = isset($data['identifier']) ? trim($data['identifier']) : '';
    $password = isset($data['password']) ? $data['password'] : '';

    if (empty($identifier) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Identifier and password are required']);
        exit;
    }

    // Determine if it's email or mobile
    if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
        $query = "SELECT id, name, mobile, email, password_hash FROM students WHERE email = ?";
    } else {
        $query = "SELECT id, name, mobile, email, password_hash FROM students WHERE mobile = ?";
    }

    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $identifier);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        exit;
    }

    $user = $result->fetch_assoc();

    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        exit;
    }

    // Successful login
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'data' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'mobile' => $user['mobile'],
            'email' => $user['email']
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred', 'error' => $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>








<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// DB config
$servername = "127.0.0.1:3307";
$username = "root";
$password = "";
$dbname = "tuition_loging_db";

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON input");
    }

    $identifier = isset($data['identifier']) ? trim($data['identifier']) : '';
    $password = isset($data['password']) ? $data['password'] : '';

    if (empty($identifier) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Identifier and password are required']);
        exit;
    }

    $firstChar = strtolower($identifier[0]);
    $query = '';
    $role = '';
    $table = '';

    switch ($firstChar) {
        case 's':
            $table = 'students';
            $role = 'student';
            break;
        case 't':
            $table = 'teachers';
            $role = 'teacher';
            break;
        case 'a':
            $table = 'admins';
            $role = 'admin';
            break;
        case 'm':
            $table = 'minor_staff';
            $role = 'teacher_staff';
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid identifier format']);
            exit;
    }

    $query = "SELECT id, name, email, mobile, password_hash FROM $table WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $identifier);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        exit;
    }

    $user = $result->fetch_assoc();

    if (!password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        exit;
    }

    // Successful login
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'role' => $role,
        'data' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'mobile' => $user['mobile']
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred', 'error' => $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>
