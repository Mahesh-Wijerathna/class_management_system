<?php

use PHPUnit\Framework\TestCase;

class RateLimiterTest extends TestCase
{
    private $mockDb;
    private $rateLimiter;

    protected function setUp(): void
    {
        $this->mockDb = $this->createMock(mysqli::class);
        $this->rateLimiter = new RateLimiter($this->mockDb);
    }

    /**
     * @test
     * Test user not locked out when no failed attempts
     */
    public function testUserNotLockedOutWithNoFailedAttempts()
    {
        $userid = 'S001';

        // Mock database query - no failed attempts
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn([
                'failed_attempts' => 0,
                'last_attempt' => null
            ]);

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

        $result = $this->rateLimiter->isLockedOut($userid);

        $this->assertFalse($result);
    }

    /**
     * @test
     * Test user not locked out with few failed attempts
     */
    public function testUserNotLockedOutWithFewFailedAttempts()
    {
        $userid = 'S001';

        // Mock database query - 3 failed attempts (below threshold)
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn([
                'failed_attempts' => 3,
                'last_attempt' => date('Y-m-d H:i:s', strtotime('-5 minutes'))
            ]);

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

        $result = $this->rateLimiter->isLockedOut($userid);

        $this->assertFalse($result);
    }

    /**
     * @test
     * Test user locked out with maximum failed attempts
     */
    public function testUserLockedOutWithMaximumFailedAttempts()
    {
        $userid = 'S001';

        // Mock database query - 5 failed attempts (at threshold)
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn([
                'failed_attempts' => 5,
                'last_attempt' => date('Y-m-d H:i:s', strtotime('-5 minutes'))
            ]);

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

        $result = $this->rateLimiter->isLockedOut($userid);

        $this->assertTrue($result);
    }

    /**
     * @test
     * Test user locked out with more than maximum failed attempts
     */
    public function testUserLockedOutWithMoreThanMaximumFailedAttempts()
    {
        $userid = 'S001';

        // Mock database query - 7 failed attempts (above threshold)
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn([
                'failed_attempts' => 7,
                'last_attempt' => date('Y-m-d H:i:s', strtotime('-5 minutes'))
            ]);

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

        $result = $this->rateLimiter->isLockedOut($userid);

        $this->assertTrue($result);
    }

    /**
     * @test
     * Test user not locked out with old failed attempts
     */
    public function testUserNotLockedOutWithOldFailedAttempts()
    {
        $userid = 'S001';

        // Mock database query - 5 failed attempts but older than 15 minutes
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn([
                'failed_attempts' => 0, // Old attempts are automatically excluded by query
                'last_attempt' => date('Y-m-d H:i:s', strtotime('-20 minutes'))
            ]);

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

        $result = $this->rateLimiter->isLockedOut($userid);

        $this->assertFalse($result);
    }

    /**
     * @test
     * Test recording successful login attempt
     */
    public function testRecordSuccessfulLoginAttempt()
    {
        $userid = 'S001';
        $success = 1;
        $ip = '192.168.1.1';

        // Mock database operations
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('sis', $userid, $success, $ip)
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $this->rateLimiter->recordAttempt($userid, $success, $ip);
        
        // No assertion needed as we're just testing the method executes without error
        $this->assertTrue(true);
    }

    /**
     * @test
     * Test recording failed login attempt
     */
    public function testRecordFailedLoginAttempt()
    {
        $userid = 'S001';
        $success = 0;
        $ip = '192.168.1.1';

        // Mock database operations
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('sis', $userid, $success, $ip)
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $this->rateLimiter->recordAttempt($userid, $success, $ip);
        
        // No assertion needed as we're just testing the method executes without error
        $this->assertTrue(true);
    }

    /**
     * @test
     * Test recording login attempt with default IP
     */
    public function testRecordLoginAttemptWithDefaultIp()
    {
        $userid = 'S001';
        $success = 0;

        // Mock database operations
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('sis', $userid, $success, $this->anything())
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $this->rateLimiter->recordAttempt($userid, $success);
        
        // No assertion needed as we're just testing the method executes without error
        $this->assertTrue(true);
    }

    /**
     * @test
     * Test getting remaining attempts when user has no failed attempts
     */
    public function testGetRemainingAttemptsWithNoFailedAttempts()
    {
        $userid = 'S001';

        // Mock database query - no failed attempts
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn(['failed_attempts' => 0]);

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

        $result = $this->rateLimiter->getRemainingAttempts($userid);

        $this->assertEquals(5, $result);
    }

    /**
     * @test
     * Test getting remaining attempts when user has some failed attempts
     */
    public function testGetRemainingAttemptsWithSomeFailedAttempts()
    {
        $userid = 'S001';

        // Mock database query - 2 failed attempts
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn(['failed_attempts' => 2]);

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

        $result = $this->rateLimiter->getRemainingAttempts($userid);

        $this->assertEquals(3, $result);
    }

    /**
     * @test
     * Test getting remaining attempts when user has maximum failed attempts
     */
    public function testGetRemainingAttemptsWithMaximumFailedAttempts()
    {
        $userid = 'S001';

        // Mock database query - 5 failed attempts
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn(['failed_attempts' => 5]);

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

        $result = $this->rateLimiter->getRemainingAttempts($userid);

        $this->assertEquals(0, $result);
    }

    /**
     * @test
     * Test getting remaining attempts when user has more than maximum failed attempts
     */
    public function testGetRemainingAttemptsWithMoreThanMaximumFailedAttempts()
    {
        $userid = 'S001';

        // Mock database query - 7 failed attempts
        $mockResult = $this->createMock(mysqli_result::class);
        $mockResult->expects($this->once())
            ->method('fetch_assoc')
            ->willReturn(['failed_attempts' => 7]);

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

        $result = $this->rateLimiter->getRemainingAttempts($userid);

        $this->assertEquals(0, $result);
    }

    /**
     * @test
     * Test cleaning old attempts
     */
    public function testCleanOldAttempts()
    {
        // Mock database operations
        $mockStmt = $this->createMock(mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $this->rateLimiter->cleanOldAttempts();
        
        // No assertion needed as we're just testing the method executes without error
        $this->assertTrue(true);
    }

    /**
     * @test
     * Test rate limiter with database connection failure
     */
    public function testRateLimiterWithDatabaseFailure()
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

        // Should not throw exception, should handle gracefully
        $result = $this->rateLimiter->isLockedOut($userid);

        $this->assertFalse($result);
    }

    /**
     * @test
     * Test rate limiter with null user ID
     */
    public function testRateLimiterWithNullUserId()
    {
        $userid = null;

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
            ->method('get_result')
            ->willReturn($this->createMock(mysqli_result::class));

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->rateLimiter->isLockedOut($userid);

        $this->assertFalse($result);
    }

    /**
     * @test
     * Test rate limiter with empty user ID
     */
    public function testRateLimiterWithEmptyUserId()
    {
        $userid = '';

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
            ->method('get_result')
            ->willReturn($this->createMock(mysqli_result::class));

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->rateLimiter->isLockedOut($userid);

        $this->assertFalse($result);
    }
} 