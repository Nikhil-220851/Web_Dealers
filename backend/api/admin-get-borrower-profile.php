<?php
// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once '../config/db.php';

// Check if admin is logged in
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

$userId = trim($_GET['user_id'] ?? '');

if (empty($userId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID is required"]);
    exit();
}

try {
    $userObjId = new MongoDB\BSON\ObjectId($userId);

    // 1. Fetch User Data
    $user = $database->users->findOne(['_id' => $userObjId]);
    if (!$user) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found"]);
        exit();
    }

    // 2. Fetch KYC
    $kyc = $database->kyc_details->findOne(['user_id' => $userId]);

    // 3. Fetch Bank
    $bank = $database->bank_details->findOne(['user_id' => $userId]);

    // 4. Fetch Loan Applications History
    $loansCursor = $database->loan_applications->find(['user_id' => $userId]);
    $loanHistory = [];
    foreach ($loansCursor as $loan) {
        $loanHistory[] = [
            'id' => (string) $loan['_id'],
            'amount' => $loan['loan_amount'] ?? ($loan['amount'] ?? 0),
            'status' => $loan['status'] ?? 'pending',
            'applied_date' => isset($loan['applied_date']) && $loan['applied_date'] instanceof MongoDB\BSON\UTCDateTime
                              ? $loan['applied_date']->toDateTime()->format('Y-m-d') 
                              : ($loan['application_date'] ?? 'N/A')
        ];
    }

    // Prepare response payload
    $profileData = [
        'personal' => [
            'id' => (string) $user['_id'],
            'name' => trim(($user['firstname'] ?? '') . ' ' . ($user['lastname'] ?? '')),
            'email' => $user['email'] ?? '',
            'phone' => $user['phoneno'] ?? '',
            'joined' => isset($user['createdAt']) && $user['createdAt'] instanceof MongoDB\BSON\UTCDateTime
                        ? $user['createdAt']->toDateTime()->format('Y-m-d')
                        : 'N/A'
        ],
        'kyc' => $kyc ? [
            'pan_number' => $kyc['pan_number'] ?? '',
            'aadhaar_number' => $kyc['aadhaar_number'] ?? '',
            'dob' => $kyc['dob'] ?? '',
            'address' => $kyc['address'] ?? ''
        ] : null,
        'bank' => $bank ? [
            'account_holder_name' => $bank['account_holder_name'] ?? '',
            'bank_name' => $bank['bank_name'] ?? '',
            'account_number' => $bank['account_number'] ?? '',
            'ifsc_code' => $bank['ifsc_code'] ?? ''
        ] : null,
        'loans' => $loanHistory
    ];

    http_response_code(200);
    echo json_encode(["status" => "success", "data" => $profileData]);

} catch (MongoDB\Driver\Exception\InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid User ID format"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
