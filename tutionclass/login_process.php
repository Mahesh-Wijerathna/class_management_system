<?php
header('Content-Type: application/json');

// Database configuration
$servername = "127.0.0.1:3307";
$username = "root"; 
$password = "";     
$dbname = "tuition_center_db";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]));
}

// Process form data
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize input
    $email = $conn->real_escape_string(trim($_POST['email']));
    $password = $_POST['password'];
    
    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email format'
        ]);
        exit;
    }
    
    // Check if user exists
    $stmt = $conn->prepare("SELECT id, fullname, password, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Email not found'
        ]);
        exit;
    }
    
    $user = $result->fetch_assoc();
    
    // Verify password
    if (password_verify($password, $user['password'])) {
        // Start session and store user data
        session_start();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['fullname'] = $user['fullname'];
        $_SESSION['email'] = $email;
        $_SESSION['role'] = $user['role'];
        $_SESSION['logged_in'] = true;
        
        // Determine redirect based on role
        $redirect = 'dashboard.php'; // Default
        
        switch ($user['role']) {
            case 'student':
                // echo "<script>alert('Loging successful! You can now log in.'); window.location.href='student_dashboard.php';</script>";
                $redirect = 'registration.php';
                break;
            case 'teacher':
                // echo "<script>alert('Loging successful! You can now log in.'); window.location.href='teacher_dashboard.php';</script>";
                
                
                $redirect = 'teacher_dashboard.php';
                break;
            case 'admin':
                // echo "<script>alert('Loging successful! You can now log in.'); window.location.href='admin_dashboard.php';</script>";
                $redirect = 'registration.php';
                break;
        }
        
        echo json_encode([
            'success' => true,
            'redirect' => $redirect,
            'fullname' => $user['fullname']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Incorrect password'
        ]);
    }
    
    $stmt->close();
    $conn->close();
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
?>