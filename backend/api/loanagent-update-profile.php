<?php
// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

    if (!$agent) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Loan Agent not found"]);
        exit();
    }

    $data = json_decode(file_get_contents("php://input"), true);
    
    $firstname = trim($data['first_name'] ?? '');
    $lastname  = trim($data['last_name']  ?? '');
    $phone     = trim($data['phone']      ?? '');
    $current_password = $data['current_password'] ?? '';
    $new_password     = $data['new_password']     ?? '';

    $updateData = [];
    if (!empty($firstname)) $updateData['firstname'] = $firstname;
    if (!empty($lastname))  $updateData['lastname']  = $lastname;
    if (!empty($phone))     $updateData['phone']     = $phone;

    // Optional: Refresh name field if used for faster lookups
    if (!empty($firstname) || !empty($lastname)) {
        $f = $firstname ?: ($agent['firstname'] ?? '');
        $l = $lastname  ?: ($agent['lastname']  ?? '');
        $updateData['name'] = trim($f . ' ' . $l);
    }

    // Password Update logic
    if (!empty($new_password)) {
        if (empty($current_password)) {
            echo json_encode(["status" => "error", "message" => "Current password is required to change password"]);
            exit();
        }
        if (!password_verify($current_password, $agent['password'])) {
            echo json_encode(["status" => "error", "message" => "Incorrect current password"]);
            exit();
        }
        if (strlen($new_password) < 6) {
            echo json_encode(["status" => "error", "message" => "New password must be at least 6 characters"]);
            exit();
        }
        $updateData['password'] = password_hash($new_password, PASSWORD_DEFAULT);
    }

    if (!empty($updateData)) {
        $database->loan_agents->updateOne(
            ['_id' => $agentId],
            ['$set' => $updateData]
        );
        
        // Reflect in current session
        if (isset($updateData['name'])) {
            $_SESSION['loan_agent_name'] = $updateData['name'];
        }

        echo json_encode(["status" => "success", "message" => "Profile updated successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "No changes detected"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
