<?php

use PHPUnit\Framework\TestCase;

class UserModelTest extends TestCase
{
    private $mockDb;
    private $userModel;

    protected function setUp(): void
    {
        $this->mockDb = $this->createMock(mysqli::class);
        $this->userModel = new UserModel($this->mockDb);
    }

    /**
     * @test
     * Test successful user creation
     */
    public function testCreateUserSuccess()
    {
        $role = 'student';
        $password = 'testPassword123';
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Mock database operations
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('sss', $this->anything(), $hashedPassword, $role)
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userModel->createUser($role, $password);

        $this->assertTrue($result);
        $this->assertNotEmpty($this->userModel->userid);
        $this->assertEquals($role, $this->userModel->role);
    }

    /**
     * @test
     * Test user creation failure
     */
    public function testCreateUserFailure()
    {
        $role = 'teacher';
        $password = 'testPassword123';

        // Mock database operations for failure
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(false);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userModel->createUser($role, $password);

        $this->assertFalse($result);
    }

    /**
     * @test
     * Test successful user retrieval by ID
     */
    public function testGetUserByIdSuccess()
    {
        $userid = 'S001';
        $expectedUserData = [
            'userid' => $userid,
            'password' => password_hash('testPassword', PASSWORD_DEFAULT),
            'role' => 'student',
            'created_at' => '2024-01-01 00:00:00'
        ];

        // Mock database operations
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn($expectedUserData);

        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('s', $userid)
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('get_result')
            ->willReturn($mockResult);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userModel->getUserById($userid);

        $this->assertEquals($expectedUserData, $result);
    }

    /**
     * @test
     * Test user retrieval by ID - user not found
     */
    public function testGetUserByIdNotFound()
    {
        $userid = 'NONEXISTENT';

        // Mock database operations - no result
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn(null);

        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('s', $userid)
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('get_result')
            ->willReturn($mockResult);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userModel->getUserById($userid);

        $this->assertNull($result);
    }

    /**
     * @test
     * Test successful user update
     */
    public function testUpdateUserSuccess()
    {
        $userid = 'S001';
        $newPassword = 'newPassword123';
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

        // Mock database operations
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('ss', $hashedPassword, $userid)
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('affected_rows')
            ->willReturn(1);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userModel->updateUser($userid, null, $newPassword);

        $this->assertTrue($result);
    }

    /**
     * @test
     * Test user update failure
     */
    public function testUpdateUserFailure()
    {
        $userid = 'S001';
        $newPassword = 'newPassword123';

        // Mock database operations for failure
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(false);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userModel->updateUser($userid, null, $newPassword);

        $this->assertFalse($result);
    }

    /**
     * @test
     * Test successful user deletion
     */
    public function testDeleteUserSuccess()
    {
        $userid = 'S001';

        // Mock database operations
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('s', $userid)
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('affected_rows')
            ->willReturn(1);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userModel->deleteUser($userid);

        $this->assertTrue($result);
    }

    /**
     * @test
     * Test user deletion failure
     */
    public function testDeleteUserFailure()
    {
        $userid = 'S001';

        // Mock database operations for failure
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('s', $userid)
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(false);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userModel->deleteUser($userid);

        $this->assertFalse($result);
    }

    /**
     * @test
     * Test successful retrieval of all users
     */
    public function testGetAllUsersSuccess()
    {
        $expectedUsers = [
            [
                'userid' => 'S001',
                'role' => 'student',
                'created_at' => '2024-01-01 00:00:00'
            ],
            [
                'userid' => 'T001',
                'role' => 'teacher',
                'created_at' => '2024-01-02 00:00:00'
            ]
        ];

        // Mock database operations
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->exactly(3))
            ->method('fetch_assoc')
            ->willReturnOnConsecutiveCalls($expectedUsers[0], $expectedUsers[1], null);

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

        $result = $this->userModel->getAllUsers();

        $this->assertEquals($expectedUsers, $result);
    }

    /**
     * @test
     * Test retrieval of all users failure
     */
    public function testGetAllUsersFailure()
    {
        // Mock database operations for failure
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(false);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userModel->getAllUsers();

        $this->assertFalse($result);
    }

    /**
     * @test
     * Test OTP storage and retrieval
     */
    public function testOtpStorageAndRetrieval()
    {
        $userid = 'S001';
        $otp = '123456';

        // Mock database operations for OTP storage
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('ss', $otp, $userid)
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('affected_rows')
            ->willReturn(1);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userModel->storeOtp($userid, $otp);

        $this->assertTrue($result);
    }

    /**
     * @test
     * Test OTP validation
     */
    public function testOtpValidation()
    {
        $userid = 'S001';
        $otp = '123456';
        $expectedOtpData = [
            'otp' => $otp,
            'otp_created_at' => date('Y-m-d H:i:s', strtotime('-5 minutes'))
        ];

        // Mock database operations
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn($expectedOtpData);

        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('s', $userid)
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('get_result')
            ->willReturn($mockResult);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userModel->getOtpData($userid);

        $this->assertEquals($expectedOtpData, $result);
    }

    /**
     * @test
     * Test OTP cleanup
     */
    public function testOtpCleanup()
    {
        $userid = 'S001';

        // Mock database operations
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('s', $userid)
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('affected_rows')
            ->willReturn(1);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->userModel->clearOtp($userid);

        $this->assertTrue($result);
    }

    /**
     * @test
     * Test user ID generation
     */
    public function testUserIdGeneration()
    {
        $role = 'student';
        $expectedPattern = '/^S\d{3}$/';

        // Mock database operations for getting next ID
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn(['next_id' => 1]);

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

        $userid = $this->userModel->generateUserId($role);

        $this->assertMatchesRegularExpression($expectedPattern, $userid);
    }

    /**
     * @test
     * Test teacher ID generation
     */
    public function testTeacherIdGeneration()
    {
        $role = 'teacher';
        $expectedPattern = '/^T\d{3}$/';

        // Mock database operations for getting next ID
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn(['next_id' => 1]);

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

        $userid = $this->userModel->generateUserId($role);

        $this->assertMatchesRegularExpression($expectedPattern, $userid);
    }

    /**
     * @test
     * Test admin ID generation
     */
    public function testAdminIdGeneration()
    {
        $role = 'admin';
        $expectedPattern = '/^A\d{3}$/';

        // Mock database operations for getting next ID
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn(['next_id' => 1]);

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

        $userid = $this->userModel->generateUserId($role);

        $this->assertMatchesRegularExpression($expectedPattern, $userid);
    }
} 