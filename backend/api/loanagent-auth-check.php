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

if (!empty($_SESSION['loan_agent_id']) && isset($_SESSION['role']) && $_SESSION['role'] === 'loan_agent') {
    http_response_code(200);
    echo json_encode([
        "loggedIn" => true,
        "agent"    => [
            "id"    => $_SESSION['loan_agent_id'],
            "name"  => $_SESSION['loan_agent_name']  ?? 'Agent',
            "email" => $_SESSION['loan_agent_email'] ?? '',
            "role"  => $_SESSION['role']  ?? 'loan_agent',
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
