<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/db.php';

$userId = trim($_GET['userId'] ?? '');
if (!$userId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "userId is required"]);
    exit();
}

    try {
    // Build query to handle both string/ObjectId and both user_id/borrower_id fields
    $query = [
        '$or' => [
            ['user_id' => $userId],
            ['borrower_id' => $userId],
        ]
    ];

    // If it's a valid 24-char hex string, also try matching as ObjectId
    if (preg_match('/^[a-f\d]{24}$/i', $userId)) {
        try {
            $objId = new MongoDB\BSON\ObjectId($userId);
            $query['$or'][] = ['user_id' => $objId];
            $query['$or'][] = ['borrower_id' => $objId];
        } catch (Exception $ignored) {}
    }

    $cursor = $database->loan_applications->find(
        $query,
        ['sort' => ['applied_date' => -1]]
    );

    $loans = [];
    foreach ($cursor as $app) {
        $productId = $app['loan_product_id'] ?? '';
        $product   = null;

        if ($productId) {
            try {
                if (preg_match('/^[a-f\d]{24}$/i', $productId)) {
                    $product = $database->loan_products->findOne([
                        '_id' => new MongoDB\BSON\ObjectId($productId)
                    ]);
                }
            } catch (Exception $ignored) {}
        }

        // Applied date
        $appliedDate = '';
        if (isset($app['applied_date']) &&
            $app['applied_date'] instanceof MongoDB\BSON\UTCDateTime) {
            $appliedDate = $app['applied_date']->toDateTime()->format('d M Y');
        }

        // Reviewed date — set when admin approves or rejects
        $reviewedAt = '';
        if (isset($app['reviewed_at']) &&
            $app['reviewed_at'] instanceof MongoDB\BSON\UTCDateTime) {
            $reviewedAt = $app['reviewed_at']->toDateTime()->format('d M Y');
        }

        $loans[] = [
            'id'            => (string) $app['_id'],
            'loan_type'     => $product['loan_type']     ?? ($app['loan_type']     ?? 'Unknown'),
            'bank_name'     => $product['bank_name']     ?? ($app['bank_name']     ?? 'Unknown'),
            'interest_rate' => $product['interest_rate'] ?? ($app['interest_rate'] ?? 0),
            'loan_amount'   => $app['loan_amount']       ?? 0,
            'loan_tenure'   => $app['loan_tenure']       ?? 0,
            'status'        => $app['status']            ?? 'pending',
            'remarks'       => $app['remarks']           ?? '',   // admin reason
            'applied_date'  => $appliedDate,
            'reviewed_at'   => $reviewedAt,                       // decision date
        ];
    }

    echo json_encode(["status" => "success", "data" => $loans]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>