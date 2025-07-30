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
    
    // Validate required fields - ADDED PASSWORD TO REQUIRED FIELDS
    $required = ['name', 'date_of_birth', 'gender', 'school', 'stream', 'mobile', 'address_line1', 'district', 'password'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "$field is required"]);
            exit;
        }
    }
    
    // Sanitize and validate input
    $name = htmlspecialchars(trim($data['name']));
    $date_of_birth = $data['date_of_birth'];
    $gender = in_array($data['gender'], ['Male', 'Female', 'Other']) ? $data['gender'] : 'Other';
    $school = htmlspecialchars(trim($data['school']));
    $stream = htmlspecialchars(trim($data['stream']));
    $mobile = filter_var($data['mobile'], FILTER_SANITIZE_NUMBER_INT);
    $telephone = !empty($data['telephone']) ? filter_var($data['telephone'], FILTER_SANITIZE_NUMBER_INT) : null;
    $address_line1 = htmlspecialchars(trim($data['address_line1']));
    $address_line2 = !empty($data['address_line2']) ? htmlspecialchars(trim($data['address_line2'])) : null;
    $address_line3 = !empty($data['address_line3']) ? htmlspecialchars(trim($data['address_line3'])) : null;
    $district = htmlspecialchars(trim($data['district']));
    $email = !empty($data['email']) ? filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL) : null;
    $mother_name = !empty($data['mother_name']) ? htmlspecialchars(trim($data['mother_name'])) : null;
    $mother_mobile = !empty($data['mother_mobile']) ? filter_var($data['mother_mobile'], FILTER_SANITIZE_NUMBER_INT) : null;
    $mother_telephone = !empty($data['mother_telephone']) ? filter_var($data['mother_telephone'], FILTER_SANITIZE_NUMBER_INT) : null;
    $custom_field1 = !empty($data['custom_field1']) ? htmlspecialchars(trim($data['custom_field1'])) : null;
    $custom_field2 = !empty($data['custom_field2']) ? htmlspecialchars(trim($data['custom_field2'])) : null;
    
    // Handle NIC or Exam options
    $nic = !empty($data['nic']) ? htmlspecialchars(trim($data['nic'])) : null;
    $has_ol = isset($data['has_ol']) ? (bool)$data['has_ol'] : false;
    $has_al = isset($data['has_al']) ? (bool)$data['has_al'] : false;
    
    // Get and validate password - NEW CODE
    $plain_password = $data['password'];
    $hashed_password = password_hash($plain_password, PASSWORD_DEFAULT);
    
    // Validate either NIC or at least one exam option is provided
    if (empty($nic) && !$has_ol && !$has_al) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Either NIC or at least one exam option (O/L or A/L) is required']);
        exit;
    }
    
    // Validate mobile number
    if (!preg_match('/^[0-9]{10}$/', $mobile)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid mobile number format']);
        exit;
    }
    
    // Validate password strength - NEW CODE
    if (strlen($plain_password) < 8) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
        exit;
    }
    
    // Check if mobile number already exists
    $stmt = $conn->prepare("SELECT id FROM students WHERE mobile = ?");
    $stmt->bind_param("s", $mobile);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Mobile number already registered']);
        $stmt->close();
        exit;
    }
    $stmt->close();
    
    // Insert new student - MODIFIED TO INCLUDE PASSWORD FIELDS
    $stmt = $conn->prepare("INSERT INTO students (
        name, date_of_birth, gender, nic, email, school, stream, 
        mobile, telephone, address_line1, address_line2, address_line3, 
        district, mother_name, mother_mobile, mother_telephone, 
        custom_field1, custom_field2, has_ol, has_al, password, password_hash, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
    
    $stmt->bind_param(
        "ssssssssssssssssssiiss",
        $name, $date_of_birth, $gender, $nic, $email, $school, $stream,
        $mobile, $telephone, $address_line1, $address_line2, $address_line3,
        $district, $mother_name, $mother_mobile, $mother_telephone,
        $custom_field1, $custom_field2, $has_ol, $has_al, $plain_password, $hashed_password
    );
    
    if ($stmt->execute()) {
        $student_id = $stmt->insert_id;
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Student registration successful',
            'data' => [
                'id' => $student_id,
                'name' => $name,
                'mobile' => $mobile,
                'has_nic' => !empty($nic),
                'has_ol' => $has_ol,
                'has_al' => $has_al
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