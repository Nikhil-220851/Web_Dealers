<?php
// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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

try {
    $adminId = new MongoDB\BSON\ObjectId($_SESSION['admin_id']);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch Admin profile
        $admin = $database->admins->findOne(['_id' => $adminId]);
        if ($admin) {
            $data = [
                'email' => $admin['email'],
                'firstname' => $admin['firstname'] ?? '',
                'lastname' => $admin['lastname'] ?? '',
                'role' => $admin['role'] ?? 'admin'
            ];
            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $data]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Admin not found"]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Update Admin profile / password
        $data = json_decode(file_get_contents("php://input"), true);
        
        $firstname = trim($data['firstname'] ?? '');
        $lastname = trim($data['lastname'] ?? '');
        $password = $data['password'] ?? '';
        
        $updateFields = [];
        if (!empty($firstname)) $updateFields['firstname'] = $firstname;
        if (!empty($lastname)) $updateFields['lastname'] = $lastname;
        if (!empty($password)) {
            $updateFields['password'] = password_hash($password, PASSWORD_DEFAULT);
        }

        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "No fields to update"]);
            exit();
        }

        $result = $database->admins->updateOne(
            ['_id' => $adminId],
            ['$set' => $updateFields]
        );

        // Update session name if changed
        if (!empty($firstname) || !empty($lastname)) {
            $_SESSION['admin_name'] = trim(($firstname ?? '') . ' ' . ($lastname ?? ''));
        }

        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Profile updated successfully"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
