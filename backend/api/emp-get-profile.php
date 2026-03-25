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

if (empty($_SESSION['emp_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access. Please login."]);
    exit();
}

try {
    $empId = new MongoDB\BSON\ObjectId($_SESSION['emp_id']);
    $employee = $database->emp->findOne(['_id' => $empId]);

    if ($employee) {
        $data = [
            'firstname' => $employee['firstname'] ?? '',
            'lastname'  => $employee['lastname']  ?? '',
            'email'     => $employee['email']     ?? '',
            'phone'     => $employee['phone']     ?? '',
            'role'      => $_SESSION['role']      ?? 'bank_employee'
        ];
        echo json_encode(["status" => "success", "data" => $data]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Employee not found"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
