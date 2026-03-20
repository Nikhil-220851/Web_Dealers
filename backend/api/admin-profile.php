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

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

try {
    $adminId = new MongoDB\BSON\ObjectId($_SESSION['admin_id']);
    $admin = $database->admins->findOne(['_id' => $adminId]);

    if ($admin) {
        $data = [
            'firstname' => $admin['firstname'] ?? '',
            'lastname'  => $admin['lastname'] ?? '',
            'email'     => $admin['email'] ?? '',
            'phone'     => $admin['phone'] ?? '',
            'avatar_url' => $admin['avatar_url'] ?? '',
            'role'      => $admin['role'] ?? 'admin'
        ];
        echo json_encode(["status" => "success", "data" => $data]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Admin not found"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
