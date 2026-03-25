<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';

$userId = trim($_GET['userId'] ?? '');

if (empty($userId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "userId is required"]);
    exit();
}

try {
    $cursor = $database->{'payment-history'}->find(
        ['user_id' => $userId],
        ['sort' => ['created_at' => -1]]
    );
    
    $payments = [];
    foreach ($cursor as $doc) {
        $payments[] = [
            'id' => (string)$doc['_id'],
            'loan_id' => $doc['loan_id'] ?? '',
            'amount' => $doc['emi_amount'] ?? 0,
            'emi_number' => isset($doc['emi_number']) ? (int)$doc['emi_number'] : null,
            'total_emis_paid' => isset($doc['total_emis_paid']) ? (int)$doc['total_emis_paid'] : null,
            'payment_month' => $doc['payment_month'] ?? '',
            'payment_year' => $doc['payment_year'] ?? '',
            'date' => $doc['payment_date'] ?? '',
            'transaction_id' => $doc['transaction_id'] ?? '',
            'method' => $doc['payment_method'] ?? 'Unknown',
            'status' => $doc['payment_status'] ?? 'paid',
            'created_at' => (isset($doc['created_at']) && is_object($doc['created_at']) && method_exists($doc['created_at'], 'toDateTime')) 
                ? $doc['created_at']->toDateTime()->format('c') 
                : ($doc['created_at'] ?? null)
        ];
    }
    
    echo json_encode(["status" => "success", "data" => $payments]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
