<?php

use PHPUnit\Framework\TestCase;

class UserControllerTest extends TestCase
{
    private $mockDb;
    private $userController;
    private $mockUserModel;
    private $mockStudentModel;
    private $mockRateLimiter;

    protected function setUp(): void
    {
        // Create mock database connection
        $this->mockDb = $this->createMock(mysqli::class);
        
        // Create mock models
        $this->mockUserModel = $this->createMock(UserModel::class);
        $this->mockStudentModel = $this->createMock(StudentModel::class);
        $this->mockRateLimiter = $this->createMock(RateLimiter::class);
        
        // Create UserController instance
        $this->userController = new UserController($this->mockDb);
    }

    /**
     * @test
     * Test user registration with valid data
     */
    public function testRegisterUserWithValidData()
    {
        $role = 'student';
        $password = 'testPassword123';
        $studentData = [
            'firstName' => 'John',
            'lastName' => 'Doe',
            'email' => 'john.doe@example.com',
            'mobile' => '0712345678'
        ];

        // Mock UserModel behavior
        $this->mockUserModel->expects($this->once())
            ->method('createUser')
            ->with($role, $password)
            ->willReturn(true);

        $this->mockUserModel->userid = 'S001';
        $this->mockUserModel->role = $role;

        // Mock StudentModel behavior
        $this->mockStudentModel->expects($this->once())
            ->method('createStudent')
            ->with('S001', $studentData)
            ->willReturn(true);

        $result = $this->userController->register($role, $password, $studentData);
        $response = json_decode($result, true);

        $this->assertTrue($response['success']);
        $this->assertEquals('S001', $response['userid']);
        $this->assertEquals($role, $response['role']);
    }

    /**
     * @test
     * Test user registration failure
     */
    public function testRegisterUserFailure()
    {
        $role = 'teacher';
        $password = 'testPassword123';

        // Mock UserModel behavior for failure
        $this->mockUserModel->expects($this->once())
            ->method('createUser')
            ->with($role, $password)
            ->willReturn(false);

        $result = $this->userController->register($role, $password);
        $response = json_decode($result, true);

        $this->assertFalse($response['success']);
        $this->assertEquals('User creation failed', $response['message']);
    }

    /**
     * @test
     * Test student registration with student data creation failure
     */
    public function testRegisterStudentWithDataCreationFailure()
    {
        $role = 'student';
        $password = 'testPassword123';
        $studentData = [
            'firstName' => 'John',
            'lastName' => 'Doe',
            'email' => 'john.doe@example.com',
            'mobile' => '0712345678'
        ];

        // Mock UserModel behavior for success
        $this->mockUserModel->expects($this->once())
            ->method('createUser')
            ->with($role, $password)
            ->willReturn(true);

        $this->mockUserModel->userid = 'S001';

        // Mock StudentModel behavior for failure
        $this->mockStudentModel->expects($this->once())
            ->method('createStudent')
            ->with('S001', $studentData)
            ->willReturn(false);

        // Mock UserModel deleteUser method
        $this->mockUserModel->expects($this->once())
            ->method('deleteUser')
            ->with('S001')
            ->willReturn(true);

        $result = $this->userController->register($role, $password, $studentData);
        $response = json_decode($result, true);

        $this->assertFalse($response['success']);
        $this->assertEquals('Student data creation failed', $response['message']);
    }

    /**
     * @test
     * Test successful login
     */
    public function testSuccessfulLogin()
    {
        $userid = 'S001';
        $password = 'testPassword123';
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $userData = [
            'userid' => $userid,
            'password' => $hashedPassword,
            'role' => 'student'
        ];

        // Mock rate limiter - not locked out
        $this->mockRateLimiter->expects($this->once())
            ->method('isLockedOut')
            ->with($userid)
            ->willReturn(false);

        // Mock UserModel behavior
        $this->mockUserModel->expects($this->once())
            ->method('getUserById')
            ->with($userid)
            ->willReturn($userData);

        // Mock rate limiter record attempt for success
        $this->mockRateLimiter->expects($this->once())
            ->method('recordAttempt')
            ->with($userid, 1);

        $result = $this->userController->login($userid, $password);
        $response = json_decode($result, true);

        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('accessToken', $response);
        $this->assertArrayHasKey('refreshToken', $response);
        $this->assertEquals($userid, $response['user']['userid']);
        $this->assertEquals('student', $response['user']['role']);
    }

    /**
     * @test
     * Test login with locked out account
     */
    public function testLoginWithLockedOutAccount()
    {
        $userid = 'S001';
        $password = 'testPassword123';

        // Mock rate limiter - account is locked out
        $this->mockRateLimiter->expects($this->once())
            ->method('isLockedOut')
            ->with($userid)
            ->willReturn(true);

        // Mock rate limiter record attempt
        $this->mockRateLimiter->expects($this->once())
            ->method('recordAttempt')
            ->with($userid, 0);

        $result = $this->userController->login($userid, $password);
        $response = json_decode($result, true);

        $this->assertFalse($response['success']);
        $this->assertStringContainsString('Account temporarily locked', $response['message']);
    }

    /**
     * @test
     * Test login with invalid credentials
     */
    public function testLoginWithInvalidCredentials()
    {
        $userid = 'S001';
        $password = 'wrongPassword';

        // Mock rate limiter - not locked out
        $this->mockRateLimiter->expects($this->once())
            ->method('isLockedOut')
            ->with($userid)
            ->willReturn(false);

        // Mock UserModel behavior - user not found
        $this->mockUserModel->expects($this->once())
            ->method('getUserById')
            ->with($userid)
            ->willReturn(null);

        // Mock rate limiter record attempt for failure
        $this->mockRateLimiter->expects($this->once())
            ->method('recordAttempt')
            ->with($userid, 0);

        $result = $this->userController->login($userid, $password);
        $response = json_decode($result, true);

        $this->assertFalse($response['success']);
        $this->assertEquals('Invalid credentials', $response['message']);
    }

    /**
     * @test
     * Test login with wrong password
     */
    public function testLoginWithWrongPassword()
    {
        $userid = 'S001';
        $password = 'wrongPassword';
        $hashedPassword = password_hash('correctPassword', PASSWORD_DEFAULT);

        $userData = [
            'userid' => $userid,
            'password' => $hashedPassword,
            'role' => 'student'
        ];

        // Mock rate limiter - not locked out
        $this->mockRateLimiter->expects($this->once())
            ->method('isLockedOut')
            ->with($userid)
            ->willReturn(false);

        // Mock UserModel behavior
        $this->mockUserModel->expects($this->once())
            ->method('getUserById')
            ->with($userid)
            ->willReturn($userData);

        // Mock rate limiter record attempt for failure
        $this->mockRateLimiter->expects($this->once())
            ->method('recordAttempt')
            ->with($userid, 0);

        $result = $this->userController->login($userid, $password);
        $response = json_decode($result, true);

        $this->assertFalse($response['success']);
        $this->assertEquals('Invalid credentials', $response['message']);
    }

    /**
     * @test
     * Test successful token refresh
     */
    public function testSuccessfulTokenRefresh()
    {
        $refreshToken = 'valid_refresh_token';
        $userid = 'S001';

        // Mock database query for refresh token validation
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn([
                'userid' => $userid,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+1 hour'))
            ]);

        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('get_result')
            ->willReturn($mockResult);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userController->refreshToken($refreshToken);
        $response = json_decode($result, true);

        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('accessToken', $response);
        $this->assertArrayHasKey('refreshToken', $response);
    }

    /**
     * @test
     * Test token refresh with invalid token
     */
    public function testTokenRefreshWithInvalidToken()
    {
        $refreshToken = 'invalid_refresh_token';

        // Mock database query for refresh token validation - no result
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn(null);

        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('get_result')
            ->willReturn($mockResult);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userController->refreshToken($refreshToken);
        $response = json_decode($result, true);

        $this->assertFalse($response['success']);
        $this->assertEquals('Invalid refresh token', $response['message']);
    }

    /**
     * @test
     * Test successful logout
     */
    public function testSuccessfulLogout()
    {
        $refreshToken = 'valid_refresh_token';

        // Mock database query for refresh token deletion
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('affected_rows')
            ->willReturn(1);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userController->logout($refreshToken);
        $response = json_decode($result, true);

        $this->assertTrue($response['success']);
        $this->assertEquals('Logged out successfully', $response['message']);
    }

    /**
     * @test
     * Test logout with invalid token
     */
    public function testLogoutWithInvalidToken()
    {
        $refreshToken = 'invalid_refresh_token';

        // Mock database query for refresh token deletion - no rows affected
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('affected_rows')
            ->willReturn(0);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userController->logout($refreshToken);
        $response = json_decode($result, true);

        $this->assertFalse($response['success']);
        $this->assertEquals('Invalid refresh token', $response['message']);
    }

    /**
     * @test
     * Test successful password reset with OTP
     */
    public function testSuccessfulPasswordResetWithOtp()
    {
        $mobile = '0712345678';
        $otp = '123456';
        $newPassword = 'newPassword123';

        // Mock database query for OTP validation
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn([
                'userid' => 'S001',
                'otp' => $otp,
                'otp_created_at' => date('Y-m-d H:i:s', strtotime('-5 minutes'))
            ]);

        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->exactly(2))
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('get_result')
            ->willReturn($mockResult);
        $mockStmt->expects($this->once())
            ->method('affected_rows')
            ->willReturn(1);

        $this->mockDb->expects($this->exactly(2))
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userController->resetPasswordWithOtp($mobile, $otp, $newPassword);
        $response = json_decode($result, true);

        $this->assertTrue($response['success']);
        $this->assertEquals('Password reset successfully', $response['message']);
    }

    /**
     * @test
     * Test password reset with expired OTP
     */
    public function testPasswordResetWithExpiredOtp()
    {
        $mobile = '0712345678';
        $otp = '123456';
        $newPassword = 'newPassword123';

        // Mock database query for OTP validation - expired OTP
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn([
                'userid' => 'S001',
                'otp' => $otp,
                'otp_created_at' => date('Y-m-d H:i:s', strtotime('-20 minutes'))
            ]);

        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('get_result')
            ->willReturn($mockResult);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userController->resetPasswordWithOtp($mobile, $otp, $newPassword);
        $response = json_decode($result, true);

        $this->assertFalse($response['success']);
        $this->assertEquals('OTP has expired', $response['message']);
    }

    /**
     * @test
     * Test password reset with invalid OTP
     */
    public function testPasswordResetWithInvalidOtp()
    {
        $mobile = '0712345678';
        $otp = 'wrong_otp';
        $newPassword = 'newPassword123';

        // Mock database query for OTP validation - no result
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn(null);

        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('get_result')
            ->willReturn($mockResult);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userController->resetPasswordWithOtp($mobile, $otp, $newPassword);
        $response = json_decode($result, true);

        $this->assertFalse($response['success']);
        $this->assertEquals('Invalid OTP', $response['message']);
    }

    /**
     * @test
     * Test successful OTP sending for forgot password
     */
    public function testSuccessfulOtpSendingForForgotPassword()
    {
        $mobile = '0712345678';

        // Mock database query for user lookup
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn([
                'userid' => 'S001',
                'role' => 'student'
            ]);

        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->exactly(2))
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('get_result')
            ->willReturn($mockResult);
        $mockStmt->expects($this->once())
            ->method('affected_rows')
            ->willReturn(1);

        $this->mockDb->expects($this->exactly(2))
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userController->sendOtpForForgotPassword($mobile);
        $response = json_decode($result, true);

        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('otp', $response);
        $this->assertEquals('S001', $response['userid']);
    }

    /**
     * @test
     * Test OTP sending for non-existent mobile number
     */
    public function testOtpSendingForNonExistentMobile()
    {
        $mobile = '0712345678';

        // Mock database query for user lookup - no result
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn(null);

        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('get_result')
            ->willReturn($mockResult);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userController->sendOtpForForgotPassword($mobile);
        $response = json_decode($result, true);

        $this->assertFalse($response['success']);
        $this->assertEquals('Mobile number not found', $response['message']);
    }

    /**
     * @test
     * Test token validation with valid token
     */
    public function testValidTokenValidation()
    {
        $validToken = 'valid_jwt_token';
        $userid = 'S001';

        // Mock JWT decode
        $decodedToken = (object) [
            'userid' => $userid,
            'exp' => time() + 3600
        ];

        // Mock UserModel behavior
        $this->mockUserModel->expects($this->once())
            ->method('getUserById')
            ->with($userid)
            ->willReturn([
                'userid' => $userid,
                'role' => 'student'
            ]);

        $result = $this->userController->validateToken($validToken);
        $response = json_decode($result, true);

        $this->assertTrue($response['success']);
        $this->assertEquals($userid, $response['user']['userid']);
    }

    /**
     * @test
     * Test token validation with expired token
     */
    public function testExpiredTokenValidation()
    {
        $expiredToken = 'expired_jwt_token';

        $result = $this->userController->validateToken($expiredToken);
        $response = json_decode($result, true);

        $this->assertFalse($response['success']);
        $this->assertEquals('Token has expired', $response['message']);
    }

    /**
     * @test
     * Test token validation with invalid token
     */
    public function testInvalidTokenValidation()
    {
        $invalidToken = 'invalid_jwt_token';

        $result = $this->userController->validateToken($invalidToken);
        $response = json_decode($result, true);

        $this->assertFalse($response['success']);
        $this->assertEquals('Invalid token', $response['message']);
    }
} 