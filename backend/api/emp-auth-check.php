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

if (!empty($_SESSION['emp_id']) && $_SESSION['role'] === 'bank_employee') {
    http_response_code(200);
    echo json_encode([
        "loggedIn" => true,
        "employee" => [
            "id"    => $_SESSION['emp_id'],
            "name"  => $_SESSION['emp_name']  ?? 'Employee',
            "email" => $_SESSION['emp_email'] ?? '',
            "role"  => $_SESSION['role']      ?? 'bank_employee',
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
