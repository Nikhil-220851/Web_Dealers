<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';
require_once '../config/razorpay_config.php';
require_once '../api/include/payment_processor.php';
require_once '../vendor/autoload.php';

use Razorpay\Api\Api;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$payment_id = $data['razorpay_payment_id'] ?? '';
$order_id   = $data['razorpay_order_id']   ?? '';
$signature  = $data['razorpay_signature']  ?? '';
$loanId     = $data['loan_id']             ?? '';
$userId     = $data['user_id']             ?? '';
$emiId      = $data['emi_id']              ?? '';

if (empty($payment_id) || empty($order_id) || empty($signature) || empty($loanId) || empty($userId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required payment details"]);
    exit();
}

try {
    $api = new Api(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET);
    
    // 1. Verify Razorpay Signature
    $api->utility->verifyPaymentSignature([
        'razorpay_order_id'   => $order_id,
        'razorpay_payment_id' => $payment_id,
        'razorpay_signature'  => $signature
    ]);

    // 2. Process EMI Payment in MongoDB
    // Note: We use 'Razorpay' as the payment method here
    $result = processEmiPaymentData($database, $loanId, $userId, 'Razorpay', $payment_id, $emiId);

    if ($result['status'] === 'success') {
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode($result);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "status" => "error", 
        "message" => "Signature verification failed: " . $e->getMessage()
    ]);
}
?>
