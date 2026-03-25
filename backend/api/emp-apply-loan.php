<?php

use MongoDB\BSON\UTCDateTime;

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once '../config/db.php';

// Auth validation for Employee
if (empty($_SESSION['emp_id']) || $_SESSION['role'] !== 'bank_employee') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Unauthorized access. Bank employee role required."]);
    exit();
}

$empId = $_SESSION['emp_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$b_name    = trim($data['borrower_name'] ?? '');
$b_phone   = trim($data['borrower_phone'] ?? '');
$b_email   = trim($data['borrower_email'] ?? '');
$b_address = trim($data['borrower_address'] ?? '');

$k_aadhaar = trim($data['kyc_aadhaar'] ?? '');
$k_pan     = trim($data['kyc_pan'] ?? '');

$e_type    = trim($data['emp_type'] ?? '');
$e_income  = floatval($data['emp_income'] ?? 0);
$e_company = trim($data['emp_company'] ?? '');

$l_amount  = floatval($data['loan_amount'] ?? 0);
$l_purpose = trim($data['loan_purpose'] ?? '');
$l_tenure  = intval($data['loan_tenure'] ?? 0);

$bk_acc    = trim($data['bank_account'] ?? '');
$bk_ifsc   = trim($data['bank_ifsc'] ?? '');
$bk_name   = trim($data['bank_name'] ?? '');

// Server-side validation
if (empty($b_name) || empty($b_phone) || empty($k_aadhaar) || empty($k_pan) || $l_amount <= 0 || $l_tenure <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required fields or invalid amount/tenure"]);
    exit();
}

if (!preg_match('/^\d{10}$/', $b_phone)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Phone must be 10 digits"]);
    exit();
}

if (!preg_match('/^\d{12}$/', $k_aadhaar)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Aadhaar must be 12 digits"]);
    exit();
}

$k_pan = strtoupper($k_pan);
if (!preg_match('/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/', $k_pan)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid PAN format"]);
    exit();
}

try {
    $now = new UTCDateTime();

    // 1. Borrower Logic
    $borrower = $database->users->findOne(['phone' => $b_phone]);
    if ($borrower) {
        $userId = (string) $borrower['_id'];
        
        $database->users->updateOne(
            ['_id' => $borrower['_id']],
            ['$set' => [
                'name' => $b_name,
                'email' => $b_email,
                'address' => $b_address,
                'updated_at' => $now
            ]]
        );
    } else {
        $newUser = [
            'name' => $b_name,
            'phone' => $b_phone,
            'email' => $b_email,
            'address' => $b_address,
            'role' => 'borrower',
            'created_at' => $now,
            'password' => password_hash($b_phone, PASSWORD_DEFAULT)
        ];
        $insertUser = $database->users->insertOne($newUser);
        $userId = (string) $insertUser->getInsertedId();
    }

    if (!$userId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Borrower ID required"]);
        exit();
    }

    // 2. KYC Details
    $database->kyc_details->updateOne(
        ['user_id' => $userId],
        ['$set' => [
            'aadhaar_number' => $k_aadhaar,
            'pan_number' => $k_pan,
            'status' => 'verified',
            'updated_at' => $now
        ]],
        ['upsert' => true]
    );

    // 3. Bank Details
    $database->bank_details->updateOne(
        ['user_id' => $userId],
        ['$set' => [
            'account_number' => $bk_acc,
            'ifsc_code' => $bk_ifsc,
            'bank_name' => $bk_name,
            'updated_at' => $now
        ]],
        ['upsert' => true]
    );

    // 4. Create Loan Document
    $dueDate = new DateTime();
    $dueDate->modify('+1 month');

    $loanDoc = [
        "user_id"           => $userId,
        "borrower_id"       => $userId,
        "borrower_name"     => $b_name,
        "assigned_employee_id" => $empId,
        "created_by"        => "employee",
        "loan_amount"       => $l_amount,
        "tenure"            => $l_tenure,
        "loan_tenure"       => $l_tenure,
        "purpose"           => $l_purpose,
        "status"            => "pending",
        "loan_status"       => "applied",
        "employment_type"   => $e_type,
        "monthly_income"    => $e_income,
        "company_name"      => $e_company,
        "bank_details"      => [
            "account_number" => $bk_acc,
            "ifsc"           => $bk_ifsc,
            "bank_name"      => $bk_name
        ],
        "emi_amount"        => $l_amount / $l_tenure,
        "remaining_balance" => $l_amount,
        "remaining_emis"    => $l_tenure,
        "total_emis_paid"   => 0,
        "applied_date"      => $now,
        "created_at"        => $now,
        "updated_at"        => $now,
        "next_due_date"     => new UTCDateTime($dueDate->getTimestamp() * 1000),
        "employee_verification" => "pending",
        "verified_by"       => null,
        "verified_at"       => null,
        "verification_notes"=> ""
    ];

    $result = $database->loan_applications->insertOne($loanDoc);

    if ($result->getInsertedCount() > 0) {
        http_response_code(201);
        echo json_encode([
            "status"  => "success",
            "message" => "Loan application submitted successfully by Employee",
            "loan_id" => (string) $result->getInsertedId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to insert loan application"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
