


<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Database configuration
$servername = "127.0.0.1:3307";
$username = "root";
$password = "";
$dbname = "tuition_center_db";

// Create connection
try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    
    // Only handle POST requests
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }
    
    // Get JSON input
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON input");
    }
    
    // Validate required fields
    $required = ['fullname', 'email', 'password', 'role'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "$field is required"]);
            exit;
        }
    }
    
    // Sanitize and validate input
    $fullname = htmlspecialchars(trim($data['fullname']));
    $email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
    $password = $data['password'];
    $role = in_array($data['role'], ['student', 'teacher', 'parent', 'admin']) ? $data['role'] : 'student';
    
    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit;
    }
    
    // Validate password strength
    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
        exit;
    }
    
    // Hash the password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Check if email exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Email already exists']);
        $stmt->close();
        exit;
    }
    $stmt->close();
    
    // Insert new user
    $stmt = $conn->prepare("INSERT INTO users (fullname, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())");
    $stmt->bind_param("ssss", $fullname, $email, $hashed_password, $role);
    
    if ($stmt->execute()) {
        $user_id = $stmt->insert_id;
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'id' => $user_id,
                'fullname' => $fullname,
                'email' => $email,
                'role' => $role
            ]
        ]);
    } else {
        throw new Exception("Registration failed: " . $stmt->error);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred',
        'error' => $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>