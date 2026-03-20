<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['POST', 'DELETE'])) {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$userId = trim($data['userId'] ?? $data['user_id'] ?? '');

if (empty($userId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "userId is required"]);
    exit();
}

try {
    $objectId = new MongoDB\BSON\ObjectId($userId);
    $user = $database->users->findOne(['_id' => $objectId]);
    if (!$user) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found"]);
        exit();
    }

    $database->users->deleteOne(['_id' => $objectId]);
    $database->kyc_details->deleteMany(['user_id' => $userId]);
    $database->bank_details->deleteMany(['user_id' => $userId]);
    $database->notifications->deleteMany(['user_id' => $userId]);
    $database->{'payment-history'}->deleteMany(['user_id' => $userId]);
    $database->loan_applications->deleteMany(['user_id' => $userId]);

    echo json_encode(["status" => "success", "message" => "Account deleted successfully"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
