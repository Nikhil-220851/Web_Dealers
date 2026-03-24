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

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

try {
    $adminId = new MongoDB\BSON\ObjectId($_SESSION['admin_id']);
    $admin = $database->admins->findOne(['_id' => $adminId]);

    if (!$admin) {
        echo json_encode(["status" => "error", "message" => "Admin not found"]);
        exit();
    }

    // Since we are not doing file uploads anymore, we can use JSON input
    $data = json_decode(file_get_contents("php://input"), true);
    
    $firstname = trim($data['first_name'] ?? '');
    $lastname  = trim($data['last_name'] ?? '');
    $phone     = trim($data['phone'] ?? '');
    $current_password = $data['current_password'] ?? '';
    $new_password     = $data['new_password'] ?? '';

    $updateData = [];
    if ($firstname) $updateData['firstname'] = $firstname;
    if ($lastname)  $updateData['lastname'] = $lastname;
    if ($phone)     $updateData['phone'] = $phone;

    // Password Update Logic
    if (!empty($new_password)) {
        if (empty($current_password)) {
            echo json_encode(["status" => "error", "message" => "Current password is required to set a new password"]);
            exit();
        }
        if (!password_verify($current_password, $admin['password'])) {
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
        $database->admins->updateOne(
            ['_id' => $adminId],
            ['$set' => $updateData]
        );
        
        // Update session name if changed
        if (isset($updateData['firstname']) || isset($updateData['lastname'])) {
            $f = $updateData['firstname'] ?? $admin['firstname'] ?? '';
            $l = $updateData['lastname'] ?? $admin['lastname'] ?? '';
            $_SESSION['admin_name'] = trim($f . ' ' . $l);
        }

        echo json_encode(["status" => "success", "message" => "Profile updated successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "No changes detected"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
