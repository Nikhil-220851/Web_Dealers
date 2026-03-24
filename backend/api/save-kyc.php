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

$userId        = trim($data['userId']        ?? '');
$aadhaarNumber = trim($data['aadhaarNumber'] ?? '');
$panNumber     = trim(strtoupper($data['panNumber'] ?? ''));
$dob           = trim($data['dob']           ?? '');
$address       = trim($data['address']       ?? '');

// ── VALIDATION ──────────────────────────────────────────────

if (empty($userId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID is required"]);
    exit();
}

// At least one KYC field must be provided
if (empty($aadhaarNumber) && empty($panNumber) && empty($dob) && empty($address)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "At least one KYC field is required"]);
    exit();
}

// Aadhaar: exactly 12 digits (spaces allowed and stripped for validation)
if (!empty($aadhaarNumber)) {
    $aadhaarDigits = preg_replace('/\s+/', '', $aadhaarNumber);
    if (!preg_match('/^\d{12}$/', $aadhaarDigits)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Aadhaar number must be exactly 12 digits"]);
        exit();
    }
}

// PAN: 10 characters – 5 letters, 4 digits, 1 letter
if (!empty($panNumber)) {
    if (!preg_match('/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/', $panNumber)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid PAN format (e.g. ABCDE1234F)"]);
        exit();
    }
}

// DOB: validate date format YYYY-MM-DD if provided
if (!empty($dob)) {
    $dobDate = DateTime::createFromFormat('Y-m-d', $dob);
    if (!$dobDate || $dobDate->format('Y-m-d') !== $dob) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid date of birth format (expected YYYY-MM-DD)"]);
        exit();
    }
    // Must be at least 18 years old
    $today = new DateTime();
    $age   = $today->diff($dobDate)->y;
    if ($age < 18) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "You must be at least 18 years old"]);
        exit();
    }
}

// ── DATABASE UPSERT ─────────────────────────────────────────

try {
    // Build the update document with only provided fields
    $setFields = ['user_id' => $userId, 'updated_at' => new MongoDB\BSON\UTCDateTime()];
    if (!empty($aadhaarNumber)) $setFields['aadhaar_number'] = $aadhaarNumber;
    if (!empty($panNumber))     $setFields['pan_number']     = $panNumber;
    if (!empty($dob))           $setFields['dob']            = $dob;
    if (!empty($address))       $setFields['address']        = $address;

    $result = $database->kyc_details->updateOne(
        ['user_id' => $userId],
        ['$set'    => $setFields],
        ['upsert'  => true]
    );

    http_response_code(200);
    echo json_encode([
        "status"  => "success",
        "message" => "KYC details saved successfully",
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
