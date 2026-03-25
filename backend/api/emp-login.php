<?php

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

$email    = trim($data['email']    ?? '');
$password =      $data['password'] ?? '';

// Validate required fields
if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email and password are required"]);
    exit();
}

try {
    // Find employee ONLY in emp collection
    $user = $database->emp->findOne(['email' => $email]);

    if ($user) {
        // Verify hashed password
        if (password_verify($password, $user['password'])) {
            // Set independent employee session variables
            $_SESSION['emp_id']    = (string) $user['_id'];
            $_SESSION['emp_email'] = $user['email'];
            $_SESSION['emp_name']  = $user['name'] ?? trim(($user['firstname'] ?? '') . ' ' . ($user['lastname'] ?? ''));
            $_SESSION['role']      = 'bank_employee'; // Distinct role tracking

            http_response_code(200);
            echo json_encode([
                "status"   => "success",
                "message"  => "Login successful",
                "employee" => [
                    "id"        => (string) $user['_id'],
                    "name"      => $_SESSION['emp_name'],
                    "email"     => $user['email'],
                    "role"      => $_SESSION['role'],
                    "firstname" => $user['firstname'] ?? '',
                    "lastname"  => $user['lastname']  ?? '',
                ]
            ]);
        } else {
            // Wrong password
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
        }
    } else {
        // Employee not found
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
