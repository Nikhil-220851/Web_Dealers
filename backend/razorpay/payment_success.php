<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require('../vendor/autoload.php');
require('../config/razorpay_config.php');

use Razorpay\Api\Api;

$api = new Api(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET);

$payment_id = $_POST['razorpay_payment_id'] ?? '';
$order_id   = $_POST['razorpay_order_id']   ?? '';
$signature  = $_POST['razorpay_signature']  ?? '';

try {
    $api->utility->verifyPaymentSignature([
        'razorpay_order_id'   => $order_id,
        'razorpay_payment_id' => $payment_id,
        'razorpay_signature'  => $signature
    ]);

    echo json_encode([
        'status'  => 'success',
        'message' => 'Payment Verified Successfully'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status'  => 'failed',
        'message' => $e->getMessage()
    ]);
}
?>