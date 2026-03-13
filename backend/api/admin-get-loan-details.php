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

if (!isset($_GET['loan_id']) || empty($_GET['loan_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Loan ID is required"]);
    exit();
}

try {
    $loanId = new MongoDB\BSON\ObjectId($_GET['loan_id']);
    
    // 1. Fetch Loan Application
    $application = $database->loan_applications->findOne(['_id' => $loanId]);
    if (!$application) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Loan application not found"]);
        exit();
    }

    // 2. Fetch User
    $userId = $application['user_id'] ?? '';
    $user = null;
    $kyc = null;
    $bank = null;

    if (!empty($userId)) {
        try {
            $userObjId = new MongoDB\BSON\ObjectId($userId);
            $user = $database->users->findOne(['_id' => $userObjId]);
            $kyc  = $database->kyc_details->findOne(['user_id' => $userId]);
            $bank = $database->bank_details->findOne(['user_id' => $userId]);
        } catch (Exception $e) {
            // Invalid user ID format, ignore lookup
        }
    }

    // 3. Fetch Loan Product
    $productId = $application['loan_product_id'] ?? '';
    $product = null;
    if (!empty($productId)) {
        try {
            $prodObjId = new MongoDB\BSON\ObjectId($productId);
            $product = $database->loan_products->findOne(['_id' => $prodObjId]);
        } catch (Exception $e) {
            // Invalid product ID format
        }
    }

    // Prepare response data
    $responseData = [
        'application' => [
            'id' => (string) $application['_id'],
            'amount' => $application['loan_amount'] ?? ($application['amount'] ?? 0),
            'tenure' => $application['loan_tenure'] ?? ($application['tenure'] ?? 0),
            'status' => $application['status'] ?? 'pending',
            'applied_date' => isset($application['applied_date']) && $application['applied_date'] instanceof MongoDB\BSON\UTCDateTime 
                              ? $application['applied_date']->toDateTime()->format('Y-m-d') 
                              : ($application['application_date'] ?? ''),
        ],
        'borrower' => [
            'id' => $userId,
            'name' => $application['borrower_name'] ?? ($user ? trim(($user['firstname'] ?? '') . ' ' . ($user['lastname'] ?? '')) : 'Unknown User'),
            'email' => $user['email'] ?? '',
            'phone' => $user['phoneno'] ?? '',
        ],
        'loan_product' => [
            'id' => $productId,
            'bank_name' => $product['bank_name'] ?? ($application['bank_name'] ?? 'Unknown Bank'),
            'loan_type' => $product['loan_type'] ?? ($application['loan_type'] ?? 'Unknown Type'),
            'interest_rate' => $product['interest_rate'] ?? 0,
        ],
        'kyc' => $kyc ? [
            'pan_number' => $kyc['pan_number'] ?? '',
            'aadhaar_number' => $kyc['aadhaar_number'] ?? '',
            'dob' => $kyc['dob'] ?? '',
            'address' => $kyc['address'] ?? ''
        ] : null,
        'bank' => $bank ? [
            'account_holder_name' => $bank['account_holder_name'] ?? '',
            'bank_name' => $bank['bank_name'] ?? '',
            'account_number' => $bank['account_number'] ?? '',
            'ifsc_code' => $bank['ifsc_code'] ?? ''
        ] : null,
        'applicant_details' => clone ($application['applicant_details'] ?? new stdClass()) // Catch-all for extra form fields
    ];

    http_response_code(200);
    echo json_encode(["status" => "success", "data" => $responseData]);

} catch (MongoDB\Driver\Exception\InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid Loan ID format"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
