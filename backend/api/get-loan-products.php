<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Safe error logging (does not break JSON)
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(200); 
    exit(); 
}

require_once '../config/db.php';

try {
    $query = [];
    if (!empty($_GET['loanType']) && $_GET['loanType'] !== 'All Types') {
        $query['loan_type'] = $_GET['loanType'];
    }
    if (!empty($_GET['bankName']) && $_GET['bankName'] !== 'All Banks') {
        $query['bank_name'] = $_GET['bankName'];
    }

    $cursor = $database->loan_products->find($query, ['sort' => ['interest_rate' => 1]]);

    $loans = [];
    foreach ($cursor as $doc) {
        $loans[] = [
            'id'              => (string) $doc['_id'],
            'loan_name'       => $doc['loan_name']       ?? ($doc['loan_type'] ?? "Unnamed Loan"),
            'loan_type'       => $doc['loan_type']       ?? "General",
            'bank_name'       => $doc['bank_name']       ?? "Unknown Bank",
            'interest_rate'   => (float)($doc['interest_rate'] ?? 0),
            'tenure'          => (int)($doc['tenure']          ?? 0),
            'min_amount'      => (float)($doc['min_amount']    ?? 0),
            'max_amount'      => (float)($doc['max_amount']    ?? 0),
            'processing_fee'  => (float)($doc['processing_fee'] ?? 0),
            'description'     => $doc['description']     ?? ""
        ];
    }

    echo json_encode([
        "status" => "success",
        "data" => $loans
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "System error: " . $e->getMessage()
    ]);
}
