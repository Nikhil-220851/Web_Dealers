<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$userId        = trim($data['userId']        ?? '');
$loanProductId = trim($data['loanProductId'] ?? '');
$loanAmount    = floatval($data['loanAmount']  ?? 0);
$loanTenure    = intval($data['loanTenure']    ?? 0);
$applicantDetails = $data['applicantDetails'] ?? [];

if (!$userId || !$loanProductId || !$loanAmount || !$loanTenure) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "userId, loanProductId, loanAmount and loanTenure are required"]);
    exit();
}

try {
    $doc = [
        "user_id"           => $userId,
        "loan_product_id"   => $loanProductId,
        "loan_amount"       => $loanAmount,
        "loan_tenure"       => $loanTenure,
        "applicant_details" => $applicantDetails,
        "status"            => "pending",
        "applied_date"      => new MongoDB\BSON\UTCDateTime(),
    ];

    $result = $database->loan_applications->insertOne($doc);

    if ($result->getInsertedCount() > 0) {
        http_response_code(201);
        echo json_encode([
            "status"        => "success",
            "message"       => "Application submitted",
            "applicationId" => (string) $result->getInsertedId(),
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Insert failed"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
