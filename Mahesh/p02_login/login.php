<?php
include 'config.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST["username"];
    $password = md5($_POST["password"]);

    $sql = "SELECT * FROM users WHERE username='$username' AND password='$password'";
    $result = $conn->query($sql);

    if ($result && $result->num_rows == 1) {
        echo "Login successful!";
    } else {
        echo "Invalid credentials.";
    }
}
?>
<form method="POST">
  <input type="text" name="username" placeholder="Username" required /><br/>
  <input type="password" name="password" placeholder="Password" required /><br/>
  <button type="submit">Login</button>
</form>
