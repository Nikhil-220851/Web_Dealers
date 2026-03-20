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

require_once '../config/db.php';

// Only allow POST requests for creating a notification
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$userId = trim($data['user_id'] ?? '');
$loanId = trim($data['loan_id'] ?? '');
$type = trim($data['type'] ?? '');
$message = trim($data['message'] ?? '');

$allowedTypes = ['approval', 'rejection', 'emi_due', 'overdue', 'warning'];

if (empty($userId) || empty($loanId) || empty($type) || empty($message)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "user_id, loan_id, type, and message are required"]);
    exit();
}

if (!in_array($type, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid notification type"]);
    exit();
}

try {
    // Construct the notification document
    $notification = [
        'user_id' => $userId,
        'loan_id' => $loanId,
        'type' => $type,
        'message' => $message,
        'is_read' => false,
        'created_at' => new MongoDB\BSON\UTCDateTime()
    ];

    // Insert into the notifications collection
    $result = $database->notifications->insertOne($notification);

    if ($result->getInsertedCount() === 1) {
        http_response_code(201);
        echo json_encode([
            "status" => "success", 
            "message" => "Notification created successfully",
            "notification_id" => (string) $result->getInsertedId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to create notification"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
