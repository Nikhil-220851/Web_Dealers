<?php

use MongoDB\BSON\UTCDateTime;

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once '../config/db.php';

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

// Parse JSON body
$data = json_decode(file_get_contents("php://input"), true);

$firstname = trim($data['firstname'] ?? '');
$lastname  = trim($data['lastname']  ?? '');
$email     = trim($data['email']     ?? '');
$phone     = trim($data['phone']     ?? '');
$password  =       $data['password'] ?? '';

// ── VALIDATION ──────────────────────────────────────────────

if (empty($firstname) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "First name, email, and password are required"]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid email format"]);
    exit();
}

if (!empty($phone) && !preg_match('/^\d{10}$/', $phone)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Phone number must be exactly 10 digits"]);
    exit();
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Password must be at least 8 characters long"]);
    exit();
}

// ── DATABASE OPERATIONS ─────────────────────────────────────

try {
    // Check duplicate email ONLY in loan_agents collection
    $existing = $database->loan_agents->findOne(['email' => $email]);
    if ($existing) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "An agent account with this email already exists"]);
        exit();
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Build agent document
    $agentDocument = [
        'firstname'  => $firstname,
        'lastname'   => $lastname,
        'name'       => trim($firstname . ' ' . $lastname),
        'email'      => $email,
        'phone'      => $phone,
        'role'       => 'LOAN_AGENT',
        'password'   => $hashedPassword,
        'status'     => 'active',
        'created_at' => new UTCDateTime(),
    ];

    // Insert into loan_agents collection
    $result = $database->loan_agents->insertOne($agentDocument);

    if ($result->getInsertedCount() === 1) {
        http_response_code(201);
        echo json_encode([
            "status"  => "success",
            "message" => "Agent account created successfully",
            "agentId" => (string) $result->getInsertedId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to create agent account. Please try again."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
