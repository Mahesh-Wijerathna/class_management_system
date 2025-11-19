<?php
require_once __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: false');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	http_response_code(200);
	exit();
}

// Lightweight debug logger (writes to container /tmp)
function _dbg($msg) {
    $t = date('Y-m-d H:i:s');
    @file_put_contents('/tmp/hall_request_debug.log', "[$t] $msg\n", FILE_APPEND);
}
_dbg('hall_request.php start. Method=' . $_SERVER['REQUEST_METHOD']);

// GLOBAL AUTHENTICATION MIDDLEWARE
// Require authentication for hall_request endpoints
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
_dbg('got headers, authHeader present? ' . ($authHeader ? 'yes' : 'no'));

if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
	http_response_code(401);
	echo json_encode(['success' => false, 'message' => 'Missing or invalid authorization token']);
	exit;
}
$globalToken = $matches[1];

_dbg('token length: ' . strlen($globalToken));

// Validate the token with the auth backend
$tokenValidation = @file_get_contents('http://host.docker.internal:8081/routes.php/validate_token', false, stream_context_create([
	'http' => [
		'method' => 'POST',
		'header' => 'Content-Type: application/json',
		'content' => json_encode(['token' => $globalToken])
	]
]));
$validationResult = $tokenValidation ? json_decode($tokenValidation, true) : null;
_dbg('raw tokenValidation: ' . ($tokenValidation ? $tokenValidation : '(empty)'));
_dbg('validationResult present? ' . ($validationResult ? 'yes' : 'no'));
if (!$validationResult || !$validationResult['success']) {
	http_response_code(401);
	echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
	exit;
}

// Store user data from token for use in the script
$currentUser = $validationResult['data'] ?? null; // e.g., ['userid' => 'T001', 'role' => 'teacher']
_dbg('currentUser: ' . json_encode($currentUser));

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
	_dbg('POST handler start');
	// Create a new hall request
	$data = json_decode(file_get_contents('php://input'), true);
	$teacher_id = $data['teacher_id'] ?? null;
	$subject = $data['subject'] ?? '';
	$class_name = $data['class_name'] ?? '';
	$date = $data['date'] ?? null;
	$start_time = $data['start_time'] ?? null;
	$end_time = $data['end_time'] ?? null;
	$status = 'pending';

	// If requester is a teacher, enforce teacher_id to be their own id
	if (isset($currentUser['role']) && $currentUser['role'] === 'teacher') {
		$teacher_id = $currentUser['userid'] ?? $teacher_id;
	}

	if (!$teacher_id || !$date || !$start_time || !$end_time) {
    _dbg('POST missing fields - teacher_id:' . ($teacher_id?:'(null)') . ' date:' . ($date?:'(null)'));
		echo json_encode(['success' => false, 'message' => 'Missing required fields']);
		exit;
	}

	$sql = "INSERT INTO hall_requests (teacher_id, subject, class_name, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
	$stmt = $conn->prepare($sql);
	_dbg('POST prepare done? ' . ($stmt ? 'yes' : 'no'));
	if (!$stmt) {
		http_response_code(500);
		echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $conn->error]);
		exit;
	}
	$stmt->bind_param("sssssss", $teacher_id, $subject, $class_name, $date, $start_time, $end_time, $status);
	if ($stmt->execute()) {
		echo json_encode(['success' => true, 'message' => 'Request submitted successfully']);
	} else {
		http_response_code(500);
		echo json_encode(['success' => false, 'error' => 'Execute failed: ' . $stmt->error]);
	}
	exit;

}

if ($method === 'PUT') {
	_dbg('PUT handler start');
	// Admin approve/reject a hall request
	$data = json_decode(file_get_contents('php://input'), true);
	$id = $data['id'] ?? null;
	$status = $data['status'] ?? null;
	if (!$id || !in_array($status, ['approved', 'rejected'])) {
		echo json_encode(['success' => false, 'message' => 'Missing or invalid id/status']);
		exit;
	}

	// Only admin can approve/reject
	if (!isset($currentUser['role']) || $currentUser['role'] !== 'admin') {
		http_response_code(403);
		echo json_encode(['success' => false, 'message' => 'Forbidden: insufficient permissions']);
		exit;
	}
	$sql = "UPDATE hall_requests SET status = ? WHERE id = ?";
	$stmt = $conn->prepare($sql);
	_dbg('PUT prepare done? ' . ($stmt ? 'yes' : 'no'));
	if (!$stmt) {
		http_response_code(500);
		echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $conn->error]);
		exit;
	}
	$stmt->bind_param("si", $status, $id);
	if ($stmt->execute()) {
		echo json_encode(['success' => true, 'message' => 'Request status updated']);
	} else {
		http_response_code(500);
		echo json_encode(['success' => false, 'error' => 'Execute failed: ' . $stmt->error]);
	}
	exit;
}

if ($method === 'GET') {
	_dbg('GET handler start, teacher_id param: ' . ($teacher_id ?? '(none)'));
	// If teacher_id is provided, get only that teacher's requests. Otherwise, get all requests (admin)
	$teacher_id = $_GET['teacher_id'] ?? null;

	// If requester is not admin and no teacher_id provided, restrict to their own requests
	if ((!isset($currentUser['role']) || $currentUser['role'] !== 'admin') && !$teacher_id) {
		$teacher_id = $currentUser['userid'] ?? null;
	}

	if ($teacher_id) {
		// If requester is a teacher, ensure they only fetch their own requests
		if (isset($currentUser['role']) && $currentUser['role'] === 'teacher' && $teacher_id !== ($currentUser['userid'] ?? '')) {
			http_response_code(403);
			echo json_encode(['success' => false, 'message' => 'Forbidden: cannot access other teacher requests']);
			exit;
		}
		$sql = "SELECT * FROM hall_requests WHERE teacher_id = ? ORDER BY date DESC, start_time DESC";
		$stmt = $conn->prepare($sql);
		if (!$stmt) {
			http_response_code(500);
			echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $conn->error]);
			exit;
		}
		$stmt->bind_param("s", $teacher_id);
		if (!$stmt->execute()) {
			http_response_code(500);
			echo json_encode(['success' => false, 'error' => 'Execute failed: ' . $stmt->error]);
			exit;
		}
		$result = $stmt->get_result();
	} else {
		// Only admin can fetch all requests
		if (!isset($currentUser['role']) || $currentUser['role'] !== 'admin') {
			http_response_code(403);
			echo json_encode(['success' => false, 'message' => 'Forbidden: insufficient permissions']);
			exit;
		}
		$sql = "SELECT * FROM hall_requests ORDER BY date DESC, start_time DESC";
		_dbg('admin query SQL: ' . $sql);
		// Enable mysqli exceptions to capture any fatal DB errors
		mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
		try {
			$result = $conn->query($sql);
			_dbg('admin query result: ok');
		} catch (Exception $e) {
			_dbg('admin query exception: ' . $e->getMessage());
			http_response_code(500);
			echo json_encode(['success' => false, 'error' => 'Query exception: ' . $e->getMessage()]);
			exit;
		} finally {
			// Restore default reporting (do not throw exceptions elsewhere)
			mysqli_report(MYSQLI_REPORT_OFF);
		}
	}
	$requests = [];
	if ($result) {
		while ($row = $result->fetch_assoc()) {
			$requests[] = $row;
		}
	}
	echo json_encode(['success' => true, 'requests' => $requests]);
	exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request method']);
exit;
