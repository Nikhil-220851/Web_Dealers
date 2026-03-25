<?php
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

try {
    require('../vendor/autoload.php');

    $client = new MongoDB\Client("mongodb://localhost:27017");
    $db = $client->LMS; // ← change to your database name

    // Get loan_id from request
    $loan_id = $_GET['loan_id'] ?? 'LN-2024-001';

    // Fetch from loan_applications
    $loan = $db->loan_applications->findOne(['loan_id' => $loan_id]);

    if (!$loan) {
        echo json_encode(['success' => false, 'error' => 'Loan not found']);
        exit;
    }

    // Fetch EMI amount from loan_products
    $product = $db->loan_products->findOne(['product_id' => $loan['product_id']]);

    echo json_encode([
        'success'    => true,
        'loan_id'    => $loan['loan_id'],
        'emi_amount' => $loan['emi_amount'], // amount in ₹
        'loan_name'  => $product['name'] ?? 'Loan EMI'
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>vvv<?php
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

try {
    require('../vendor/autoload.php');

    $client = new MongoDB\Client("mongodb://localhost:27017");
    $db = $client->LMS; // ← change to your database name

    // Get loan_id from request
    $loan_id = $_GET['loan_id'] ?? 'LN-2024-001';

    // Fetch from loan_applications
    $loan = $db->loan_applications->findOne(['loan_id' => $loan_id]);

    if (!$loan) {
        echo json_encode(['success' => false, 'error' => 'Loan not found']);
        exit;
    }

    // Fetch EMI amount from loan_products
    $product = $db->loan_products->findOne(['product_id' => $loan['product_id']]);

    echo json_encode([
        'success'    => true,
        'loan_id'    => $loan['loan_id'],
        'emi_amount' => $loan['emi_amount'], // amount in ₹
        'loan_name'  => $product['name'] ?? 'Loan EMI'
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>