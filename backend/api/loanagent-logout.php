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

// Unset only loan agent session variables
unset($_SESSION['loan_agent_id']);
unset($_SESSION['loan_agent_email']);
unset($_SESSION['loan_agent_name']);

// If role was specifically 'loan_agent', unset it. 
// Do not blindly unset $_SESSION['role'] if it might belong to an admin login.
if (isset($_SESSION['role']) && $_SESSION['role'] === 'loan_agent') {
    unset($_SESSION['role']);
}

// Optionally, if session is empty, destroy it
if (empty($_SESSION)) {
    session_destroy();
}

http_response_code(200);
echo json_encode([
    "status"  => "success",
    "message" => "Agent logged out successfully"
]);

?>
