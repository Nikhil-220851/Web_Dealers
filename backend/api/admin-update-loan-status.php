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

// Check if admin is logged in
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

// Parse JSON body
$data = json_decode(file_get_contents("php://input"), true);
$loanId = trim($data['loan_id'] ?? '');
$newStatus = trim($data['status'] ?? '');

$allowedStatuses = ['approved', 'rejected', 'pending'];

if (empty($loanId) || empty($newStatus)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Loan ID and new status are required"]);
    exit();
}

if (!in_array($newStatus, $allowedStatuses)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid status value"]);
    exit();
}

try {
    $objectId = new MongoDB\BSON\ObjectId($loanId);
    
    // Update the existing document
    $result = $database->loan_applications->updateOne(
        ['_id' => $objectId],
        ['$set' => ['status' => $newStatus, 'updated_at' => new MongoDB\BSON\UTCDateTime()]]
    );

    if ($result->getModifiedCount() === 1) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Loan status updated successfully"]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Loan not found or status already set to this value"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
