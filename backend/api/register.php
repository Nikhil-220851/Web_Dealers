<?php

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

// Get raw POST data
$data = json_decode(file_get_contents("php://input"), true);

// Extract fields
$fullName = $data['fullName'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

// Basic validation
if (empty($fullName) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "All fields are required"]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid email format"]);
    exit();
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Password must be at least 6 characters long"]);
    exit();
}

try {
    // Check if user already exists
    $existingUser = $database->users->findOne(['email' => $email]);
    if ($existingUser) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "User with this email already exists"]);
        exit();
    }

    // Hash the password securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user
    $result = $database->users->insertOne([
        'fullName' => $fullName,
        'email' => $email,
        'password' => $hashedPassword
    ]);

    if ($result->getInsertedCount() === 1) {
        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "message" => "User registered successfully",
            "userId" => (string) $result->getInsertedId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to register user"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
