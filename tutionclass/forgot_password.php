<?php
// Simple forgot password page that sends reset link
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
    
    if ($email) {
        // Generate reset token (in a real app, store this in database)
        $token = bin2hex(random_bytes(32));
        $reset_link = "https://yoursite.com/reset_password.php?token=$token";
        
        // Send email (pseudo-code)
        // mail($email, "Password Reset", "Click here to reset: $reset_link");
        
        echo "<p>If an account exists with this email, we've sent a reset link.</p>";
    } else {
        echo "<p>Please enter a valid email address.</p>";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Forgot Password</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        input[type="email"] { width: 100%; padding: 8px; }
        button { padding: 8px 15px; background: #3498db; color: white; border: none; }
    </style>
</head>
<body>
    <h2>Forgot Password</h2>
    <form method="POST">
        <div class="form-group">
            <label>Email:</label>
            <input type="email" name="email" required>
        </div>
        <button type="submit">Send Reset Link</button>
    </form>
    <p><a href="login.php">Back to Login</a></p>
</body>
</html>