<?php

// ════════════════════════════════════════════════════════════════════════
// GET CUSTOMER DETAILS API
// Fetches detailed borrower/loan info for a specific loan ID.
// ════════════════════════════════════════════════════════════════════════

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once '../config/db.php';

// 1. Security Check
if (empty($_SESSION['loan_agent_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

$agentId = $_SESSION['loan_agent_id'];
$loanId  = $_GET['id'] ?? '';

if (empty($loanId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Loan ID is required"]);
    exit();
}

try {
    // 2. Fetch Loan and Verify Ownership
    $loan = $database->loan_applications->findOne(['_id' => new MongoDB\BSON\ObjectId($loanId)]);

    if (!$loan) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Loan not found"]);
        exit();
    }

    if ($loan['assigned_agent_id'] !== $agentId) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Access Denied: This loan is not assigned to you."]);
        exit();
    }

    $userId = (string) ($loan['borrower_id'] ?? $loan['user_id']);

    // 3. Fetch Personal Info
    $user = $database->users->findOne(['_id' => new MongoDB\BSON\ObjectId($userId)]);

    // 4. Fetch KYC Info
    $kyc = $database->kyc_details->findOne(['user_id' => $userId]);

    // 5. Fetch Bank Info
    $bank = $database->bank_details->findOne(['user_id' => $userId]);

    // 6. Response Construction
    $response = [
        "personal" => [
            "name"    => $user['name']    ?? 'N/A',
            "phone"   => $user['phone']   ?? 'N/A',
            "email"   => $user['email']   ?? 'N/A',
            "address" => $user['address'] ?? 'N/A'
        ],
        "loan" => [
            "amount"      => (float) ($loan['loan_amount'] ?? 0),
            "tenure"      => (int)   ($loan['loan_tenure'] ?? 0),
            "status"      => strtoupper($loan['status'] ?? 'PENDING'),
            "purpose"     => $loan['purpose'] ?? 'N/A',
            "applied_at"  => ($loan['applied_date'] instanceof MongoDB\BSON\UTCDateTime) 
                             ? $loan['applied_date']->toDateTime()->format('d M Y, h:i A') 
                             : 'N/A'
        ],
        "kyc" => [
            "aadhaar" => $kyc['aadhaar_number'] ?? 'N/A',
            "pan"     => $kyc['pan_number']     ?? 'N/A',
            "status"  => $kyc['status']         ?? 'Pending Verfication'
        ],
        "bank" => [
            "account" => $bank['account_number'] ?? 'N/A',
            "ifsc"    => $bank['ifsc_code']      ?? 'N/A',
            "bank"    => $bank['bank_name']      ?? 'N/A'
        ]
    ];

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data"   => $response
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
