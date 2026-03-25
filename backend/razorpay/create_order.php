<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

try {

    require __DIR__ . '/../vendor/autoload.php';

    if (!class_exists('Razorpay\Api\Api')) {
        throw new Exception("Razorpay SDK not installed properly");
    }

    $keyId = "rzp_test_SV5ZCgjwvjwrzG";
    $keySecret = "H6SbERqgqTivpbFWA7z5AGeH";

    if (!isset($_GET['amount'])) {
        throw new Exception("Amount missing");
    }

    $amount = (int) $_GET['amount'];

    $api = new Razorpay\Api\Api($keyId, $keySecret);

    $order = $api->order->create([
        'receipt' => 'order_' . rand(1000,9999),
        'amount' => $amount,
        'currency' => 'INR'
    ]);

    echo json_encode([
        "success" => true,
        "order_id" => $order['id']
    ]);

} catch (Throwable $e) {

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}