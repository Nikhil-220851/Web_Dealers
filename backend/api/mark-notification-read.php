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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$notificationId = trim($data['notification_id'] ?? '');

if (empty($notificationId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "notification_id is required"]);
    exit();
}

$userId = $_SESSION['user_id'] ?? $data['user_id'] ?? '';

if (empty($userId)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit();
}

try {
    $objectId = new MongoDB\BSON\ObjectId($notificationId);

    // Make sure we only update notifications belonging to this user
    $result = $database->notifications->updateOne(
        ['_id' => $objectId, 'user_id' => $userId],
        ['$set' => ['is_read' => true]]
    );

    if ($result->getModifiedCount() === 1 || $result->getMatchedCount() === 1) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Notification marked as read"]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Notification not found or access denied"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
