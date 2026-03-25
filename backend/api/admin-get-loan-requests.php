<?php
// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
    // Improved aggregation pipeline
    $pipeline = [
        ['$sort' => ['applied_date' => -1]],
        [
            '$lookup' => [
                'from' => 'users',
                'localField' => 'user_id',
                'foreignField' => '_id',
                'as' => 'borrower'
            ]
        ],
        [
            '$unwind' => [
                'path' => '$borrower',
                'preserveNullAndEmptyArrays' => true
            ]
        ],
        [
            '$lookup' => [
                'from' => 'loan_products',
                'localField' => 'loan_product_id',
                'foreignField' => '_id',
                'as' => 'product'
            ]
        ],
        [
            '$unwind' => [
                'path' => '$product',
                'preserveNullAndEmptyArrays' => true
            ]
        ],
        [
            '$addFields' => [
                'borrower_name_unified' => [
                    '$ifNull' => ['$borrower.name', '$borrower.firstname', '$borrower_name', 'Unknown User']
                ],
                'loan_type_unified' => [
                    '$ifNull' => ['$product.loan_type', '$loan_type', 'Unknown']
                ],
                'bank_name_unified' => [
                    '$ifNull' => ['$product.bank_name', '$bank_name', 'Unknown Bank']
                ]
            ]
        ],
        [
            '$project' => [
                '_id' => 1,
                'user_id' => 1,
                'borrower_name' => '$borrower_name_unified',
                'loan_type' => '$loan_type_unified',
                'bank_name' => '$bank_name_unified',
                'amount' => ['$ifNull' => ['$loan_amount', '$amount', 0]],
                'tenure' => ['$ifNull' => ['$loan_tenure', '$tenure', 0]],
                'status' => ['$ifNull' => ['$status', 'pending']],
                'employee_verification' => ['$ifNull' => ['$employee_verification', 'pending']],
                'verification_notes' => ['$ifNull' => ['$verification_notes', '']],
                'verified_at' => 1,
                'applied_date' => 1
            ]
        ]
    ];

    $cursor = $database->loan_applications->aggregate($pipeline);

    $loanRequests = [];
    foreach ($cursor as $app) {
        $loanRequests[] = [
            'id'               => (string) $app['_id'],
            'borrower_id'      => (string) $app['user_id'],
            'borrower_name'    => $app['borrower_name'],
            'loan_type'        => $app['loan_type'],
            'bank_name'        => $app['bank_name'],
            'amount'           => $app['amount'],
            'tenure'           => $app['tenure'],
            'status'           => $app['status'],
            'employee_verification' => $app['employee_verification'],
            'verification_notes' => $app['verification_notes'],
            'verified_at' => isset($app['verified_at']) && $app['verified_at'] instanceof MongoDB\BSON\UTCDateTime
                                  ? $app['verified_at']->toDateTime()->format('Y-m-d H:i:s')
                                  : null,
            'application_date' => isset($app['applied_date']) && $app['applied_date'] instanceof MongoDB\BSON\UTCDateTime
                                  ? $app['applied_date']->toDateTime()->format('Y-m-d')
                                  : ($app['application_date'] ?? '')
        ];
    }

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data"   => $loanRequests
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
