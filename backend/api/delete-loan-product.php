<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(200); 
    exit(); 
}

require_once '../config/db.php';

// Safe error logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = trim($data['id'] ?? '');

    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Loan product ID is required"]);
        exit();
    }

    // 1. Safety Check: Is this scheme used in any loan applications?
    // Note: loan_product_id is stored as a string in loan_applications
    $usageCount = $database->loan_applications->countDocuments(['loan_product_id' => $id]);

    if ($usageCount > 0) {
        http_response_code(409); // Conflict
        echo json_encode([
            "status" => "error", 
            "message" => "This loan scheme is currently linked to $usageCount active or past applications and cannot be deleted."
        ]);
        exit();
    }

    // 2. Perform Deletion
    $deleteResult = $database->loan_products->deleteOne(['_id' => new MongoDB\BSON\ObjectId($id)]);

    if ($deleteResult->getDeletedCount() === 1) {
        echo json_encode([
            "status" => "success",
            "message" => "Loan scheme deleted successfully"
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Loan scheme not found or already deleted"
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "System error: " . $e->getMessage()
    ]);
}
?>
