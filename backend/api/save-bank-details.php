<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

// Parse JSON body
$data = json_decode(file_get_contents("php://input"), true);

$userId             = trim($data['userId']             ?? '');
$accountHolderName  = trim($data['accountHolderName']  ?? '');
$accountNumber      = trim($data['accountNumber']      ?? '');
$bankName           = trim($data['bankName']           ?? '');
$ifscCode           = trim(strtoupper($data['ifscCode'] ?? ''));
$branchName         = trim($data['branchName']         ?? '');

// ── VALIDATION ──────────────────────────────────────────────

if (empty($userId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID is required"]);
    exit();
}

if (empty($accountHolderName) || empty($accountNumber) || empty($bankName) || empty($ifscCode)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Account holder name, account number, bank name, and IFSC code are required"]);
    exit();
}

// IFSC format validation: 4 letters + 0 + 6 alphanumeric
if (!preg_match('/^[A-Z]{4}0[A-Z0-9]{6}$/', $ifscCode)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid IFSC code format (e.g. SBIN0001234)"]);
    exit();
}

// Account number: 9–18 digits
if (!preg_match('/^\d{9,18}$/', $accountNumber)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Account number must be 9–18 digits"]);
    exit();
}

// ── DATABASE UPSERT ─────────────────────────────────────────

try {
    $result = $database->bank_details->updateOne(
        ['user_id' => $userId],
        [
            '$set' => [
                'user_id'             => $userId,
                'account_holder_name' => $accountHolderName,
                'account_number'      => $accountNumber,
                'bank_name'           => $bankName,
                'ifsc_code'           => $ifscCode,
                'branch_name'         => $branchName,
                'updated_at'          => new MongoDB\BSON\UTCDateTime(),
            ]
        ],
        ['upsert' => true]
    );

    http_response_code(200);
    echo json_encode([
        "status"  => "success",
        "message" => "Bank details saved successfully",
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
