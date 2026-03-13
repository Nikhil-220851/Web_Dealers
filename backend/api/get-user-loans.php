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
    $cursor = $database->loan_applications->find(['user_id' => $userId]);

    $loans = [];
    foreach ($cursor as $app) {
        $productId = $app['loan_product_id'] ?? '';
        $product   = null;

        // Try to fetch matching loan product
        if ($productId) {
            try {
                if (preg_match('/^[a-f\d]{24}$/i', $productId)) {
                    $product = $database->loan_products->findOne(['_id' => new MongoDB\BSON\ObjectId($productId)]);
                }
            } catch (Exception $ignored) {}
        }

        $date = '';
        if (isset($app['applied_date']) && $app['applied_date'] instanceof MongoDB\BSON\UTCDateTime) {
            $date = $app['applied_date']->toDateTime()->format('d M Y');
        }

        $loans[] = [
            'id'           => (string) $app['_id'],
            'loan_type'    => $product['loan_type']     ?? 'Unknown',
            'bank_name'    => $product['bank_name']     ?? 'Unknown',
            'interest_rate'=> $product['interest_rate'] ?? 0,
            'loan_amount'  => $app['loan_amount']       ?? 0,
            'loan_tenure'  => $app['loan_tenure']       ?? 0,
            'status'       => $app['status']            ?? 'pending',
            'applied_date' => $date,
        ];
    }

    echo json_encode(["status" => "success", "data" => $loans]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
