<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

require('../vendor/autoload.php');
require('../config/razorpay_config.php');

use Razorpay\Api\Api;

try {
    $api = new Api(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET);

    $amount = isset($_GET['amount']) ? intval($_GET['amount']) : 820000;

    $order = $api->order->create([
        'receipt'         => 'rcpt_' . time(),
        'amount'          => $amount,
        'currency'        => 'INR',
        'payment_capture' => 1
    ]);

    echo json_encode([
        'success'  => true,
        'order_id' => $order['id'],
        'amount'   => $order['amount'],
        'currency' => $order['currency']
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}
?>