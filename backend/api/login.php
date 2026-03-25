<?php
require_once '../config/db.php';
/** @var MongoDB\Database $database */
global $database;
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

// Start session handling
session_start();

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

// Get raw POST data
$data = json_decode(file_get_contents("php://input"), true);

$email    = trim($data['email']    ?? '');
$password =      $data['password'] ?? '';

// Validate fields
if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email and password are required"]);
    exit();
}

try {
    // Find the user by email
    $user = $database->users->findOne(['email' => $email]);

    if ($user) {
        // Verify the password hash
        if (password_verify($password, $user['password'])) {
            // Set session variables
            $_SESSION['user_id']    = (string) $user['_id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['firstname']  = $user['firstname'] ?? '';

            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "message" => "Login successful",
                "user" => [
                    "id"        => (string) $user['_id'],
                    "firstname" => $user['firstname'] ?? '',
                    "lastname"  => $user['lastname']  ?? '',
                    "email"     => $user['email'],
                    "phoneno"   => $user['phoneno']   ?? ''
                ]
            ]);
        } else {
            // Invalid password
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
        }
    } else {
        // Active user not found
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
