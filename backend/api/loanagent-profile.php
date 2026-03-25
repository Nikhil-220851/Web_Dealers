<?php
// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once __DIR__ . '/../config/db.php';

if (empty($_SESSION['loan_agent_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access. Please login."]);
    exit();
}

try {
    $agentId = new MongoDB\BSON\ObjectId($_SESSION['loan_agent_id']);
    $agent = $database->loan_agents->findOne(['_id' => $agentId]);

    if ($agent) {
        $data = [
            'firstname' => $agent['firstname'] ?? '',
            'lastname'  => $agent['lastname']  ?? '',
            'email'     => $agent['email']     ?? '',
            'phone'     => $agent['phone']     ?? '',
            'role'      => $_SESSION['role']   ?? 'loan_agent'
        ];
        echo json_encode(["status" => "success", "data" => $data]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Loan Agent not found"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
