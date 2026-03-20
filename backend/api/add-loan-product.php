<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

session_start();
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

// Admin check
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid request data"]);
    exit;
}

$loan_name = $data['loan_name'] ?? '';
$bank_name = $data['bank_name'] ?? '';
$loan_type = $data['loan_type'] ?? '';
$interest_rate = (float)($data['interest_rate'] ?? 0);
$tenure = (int)($data['tenure'] ?? 0);
$min_amount = (float)($data['min_amount'] ?? 0);
$max_amount = (float)($data['max_amount'] ?? 0);
$processing_fee = (float)($data['processing_fee'] ?? 0);
$description = $data['description'] ?? '';

// Validation
if (empty($loan_name) || empty($bank_name) || empty($loan_type)) {
    echo json_encode(["status" => "error", "message" => "Loan name, Bank name, and Type are required"]);
    exit;
}
if ($interest_rate <= 0 || $tenure <= 0) {
    echo json_encode(["status" => "error", "message" => "Invalid interest rate or tenure"]);
    exit;
}
if ($min_amount >= $max_amount) {
    echo json_encode(["status" => "error", "message" => "Min amount must be less than max amount"]);
    exit;
}

try {
    // Insert Loan Product
    $insertResult = $database->loan_products->insertOne([
        "loan_name" => $loan_name,
        "bank_name" => $bank_name,
        "loan_type" => $loan_type,
        "interest_rate" => $interest_rate,
        "tenure" => $tenure,
        "min_amount" => $min_amount,
        "max_amount" => $max_amount,
        "processing_fee" => $processing_fee,
        "description" => $description,
        "status" => "active",
        "created_at" => new MongoDB\BSON\UTCDateTime()
    ]);

    if ($insertResult->getInsertedCount() > 0) {
        // Log Activity
        $database->activities->insertOne([
            "type" => "loan_scheme_created",
            "title" => "New Loan Scheme",
            "description" => "New scheme '$loan_name' added for $bank_name",
            "reference_id" => $insertResult->getInsertedId(),
            "created_at" => new MongoDB\BSON\UTCDateTime()
        ]);

        echo json_encode(["status" => "success", "message" => "Loan scheme added successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to add loan scheme"]);
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
