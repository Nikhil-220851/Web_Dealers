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
    // Find agent ONLY in loan_agents collection
    $user = $database->loan_agents->findOne(['email' => $email]);

    if ($user) {
        // Verify hashed password
        if (password_verify($password, $user['password'])) {
            // Set independent loan agent session variables
            $_SESSION['loan_agent_id'] = (string) $user['_id'];
            $_SESSION['loan_agent_email'] = $user['email'];
            $_SESSION['loan_agent_name']  = $user['name'] ?? trim(($user['firstname'] ?? '') . ' ' . ($user['lastname'] ?? ''));
            $_SESSION['role']  = 'loan_agent'; // Distinct role tracking

            http_response_code(200);
            echo json_encode([
                "status"  => "success",
                "message" => "Login successful",
                "agent"   => [
                    "id"        => (string) $user['_id'],
                    "name"      => $_SESSION['loan_agent_name'],
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
        // Agent not found
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
