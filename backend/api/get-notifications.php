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
require_once '../config/db.php';

// Verify session or check query parameter (for simplicity we check session or get parameter if session not used effectively)
$userId = $_SESSION['user_id'] ?? $_GET['user_id'] ?? $_GET['userId'] ?? '';

if (empty($userId)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized: Please log in. user_id is required."]);
    exit();
}

try {
    $filter = ['user_id' => $userId];
    $options = [
        'sort' => ['created_at' => -1] // Latest first
    ];

    $cursor = $database->notifications->find($filter, $options);
    $notifications = [];
    $unreadCount = 0;

    foreach ($cursor as $doc) {
        $notifications[] = [
            'id' => (string)$doc['_id'],
            'loan_id' => $doc['loan_id'],
            'type' => $doc['type'],
            'message' => $doc['message'],
            'remarks' => $doc['remarks'] ?? 'None',
            'is_read' => $doc['is_read'],
            'created_at' => $doc['created_at']->toDateTime()->format('Y-m-d H:i:s')
        ];
        if (!$doc['is_read']) {
            $unreadCount++;
        }
    }

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data" => $notifications,
        "unread_count" => $unreadCount
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
