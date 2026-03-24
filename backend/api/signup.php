<?php

use MongoDB\BSON\UTCDateTime;

// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

// Get raw POST data (JSON body)
$data = json_decode(file_get_contents("php://input"), true);

// Extract fields
$firstname = trim($data['firstname'] ?? '');
$lastname  = trim($data['lastname']  ?? '');
$phoneno   = trim($data['phoneno']   ?? '');
$email     = trim($data['email']     ?? '');
$password  =      $data['password']  ?? '';

// ── VALIDATION ──────────────────────────────────────────────

// Required fields
if (empty($firstname) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "First name, email, and password are required"]);
    exit();
}

// Email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid email format"]);
    exit();
}

// Phone number format (10 digits, optional)
if (!empty($phoneno) && !preg_match('/^\d{10}$/', $phoneno)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Phone number must be exactly 10 digits"]);
    exit();
}

// Password minimum length
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Password must be at least 6 characters long"]);
    exit();
}

// ── DATABASE OPERATIONS ─────────────────────────────────────

try {
    // Check if email already exists
    $existingUser = $database->users->findOne(['email' => $email]);
    if ($existingUser) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "An account with this email already exists"]);
        exit();
    }

    // Hash the password securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Build the user document
    $userDocument = [
        'firstname' => $firstname,
        'lastname'  => $lastname,
        'phoneno'   => $phoneno,
        'email'     => $email,
        'password'  => $hashedPassword,
        'createdAt' => new UTCDateTime()
    ];

    // Insert new user into the users collection
    $result = $database->users->insertOne($userDocument);

    if ($result->getInsertedCount() === 1) {
        http_response_code(201);
        echo json_encode([
            "status"  => "success",
            "message" => "Account created successfully",
            "userId"  => (string) $result->getInsertedId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to create account. Please try again."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
