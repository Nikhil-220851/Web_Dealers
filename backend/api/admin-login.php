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
    // Find admin by email in admins collection
    $admin = $database->admins->findOne(['email' => $email]);

    if ($admin) {
        // Verify hashed password
        if (password_verify($password, $admin['password'])) {
            // Set admin session variables
            $_SESSION['admin_id']    = (string) $admin['_id'];
            $_SESSION['admin_email'] = $admin['email'];
            $_SESSION['admin_name']  = $admin['name']      ?? trim(($admin['firstname'] ?? '') . ' ' . ($admin['lastname'] ?? ''));
            $_SESSION['admin_role']  = $admin['role']      ?? 'admin';

            http_response_code(200);
            echo json_encode([
                "status"  => "success",
                "message" => "Login successful",
                "admin"   => [
                    "id"        => (string) $admin['_id'],
                    "name"      => $_SESSION['admin_name'],
                    "email"     => $admin['email'],
                    "role"      => $_SESSION['admin_role'],
                    "firstname" => $admin['firstname'] ?? '',
                    "lastname"  => $admin['lastname']  ?? '',
                ]
            ]);
        } else {
            // Wrong password
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
        }
    } else {
        // Admin not found
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
