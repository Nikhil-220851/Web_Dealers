<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/db.php';

try {
    $loanId = $_GET['loanId'] ?? '';

    if (empty($loanId)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "loanId is required"]);
        exit();
    }

    $objectId = new MongoDB\BSON\ObjectId($loanId);
    $doc = $database->loan_products->findOne(['_id' => $objectId]);

    if (!$doc) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Loan product not found"]);
        exit();
    }

    $loan = [
        'id'              => (string) $doc['_id'],
        'loan_type'       => $doc['loan_type']       ?? '',
        'bank_name'       => $doc['bank_name']        ?? '',
        'interest_rate'   => $doc['interest_rate']    ?? 0,
        'max_amount'      => $doc['max_amount']       ?? 0,
        'min_amount'      => $doc['min_amount']       ?? 0,
        'processing_fee'  => $doc['processing_fee']   ?? 0,
        'tenure'          => $doc['tenure']           ?? 0,
        'min_salary'      => $doc['min_salary']       ?? 0,
        'credit_score'    => $doc['credit_score']     ?? 0,
        'employment_type' => $doc['employment_type']  ?? '',
    ];

    echo json_encode(["status" => "success", "data" => $loan]);

} catch (MongoDB\Driver\Exception\InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid loanId format"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
