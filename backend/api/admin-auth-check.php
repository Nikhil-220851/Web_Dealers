<?php

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

if (!empty($_SESSION['admin_id'])) {
    http_response_code(200);
    echo json_encode([
        "loggedIn" => true,
        "admin"    => [
            "id"    => $_SESSION['admin_id'],
            "name"  => $_SESSION['admin_name']  ?? 'Admin',
            "email" => $_SESSION['admin_email'] ?? '',
            "role"  => $_SESSION['admin_role']  ?? 'admin',
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        "loggedIn" => false,
        "message"  => "Not authenticated"
    ]);
}

?>
