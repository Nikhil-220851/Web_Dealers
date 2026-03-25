<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';
require_once '../api/include/payment_processor.php';

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$loanId = trim($data['loan_id'] ?? '');
$paymentMethod = trim($data['payment_method'] ?? 'UPI');

session_start();
$sessionUserId = isset($_SESSION['user_id']) ? trim((string)$_SESSION['user_id']) : '';
$userId = $sessionUserId ?: trim($data['user_id'] ?? $data['userId'] ?? '');

if (empty($loanId) || empty($userId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Loan ID and User ID are required"]);
    exit();
}

// Call shared logic
$result = processEmiPaymentData($database, $loanId, $userId, $paymentMethod);

if ($result['status'] === 'success') {
    echo json_encode([
        "status" => "success",
        "message" => "EMI Payment processed successfully",
        "data" => $result['data']
    ]);
} else {
    http_response_code(400);
    echo json_encode($result);
}
?>
