<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$userId = trim($_GET['userId'] ?? '');

if (empty($userId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "userId is required"]);
    exit();
}

try {
    // Convert string ID to MongoDB ObjectId
    $objectId = new MongoDB\BSON\ObjectId($userId);

    // Fetch user document
    $user = $database->users->findOne(['_id' => $objectId]);

    if (!$user) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found"]);
        exit();
    }

    // Fetch bank details linked to this user
    $bankDoc = $database->bank_details->findOne(['user_id' => $userId]);

    // Fetch KYC details linked to this user
    $kycDoc = $database->kyc_details->findOne(['user_id' => $userId]);

    // Build response — convert BSON documents to plain arrays
    $userData = [
        'id'        => (string) $user['_id'],
        'firstname' => $user['firstname'] ?? '',
        'lastname'  => $user['lastname']  ?? '',
        'email'     => $user['email']     ?? '',
        'phoneno'   => $user['phoneno']   ?? '',
        'createdAt' => isset($user['createdAt'])
                        ? (string) $user['createdAt']->toDateTime()->format('Y-m-d')
                        : '',
    ];

    $bankData = null;
    if ($bankDoc) {
        $bankData = [
            'accountHolderName' => $bankDoc['account_holder_name'] ?? '',
            'accountNumber'     => $bankDoc['account_number']      ?? '',
            'bankName'          => $bankDoc['bank_name']           ?? '',
            'ifscCode'          => $bankDoc['ifsc_code']           ?? '',
            'branchName'        => $bankDoc['branch_name']         ?? '',
        ];
    }

    $kycData = null;
    if ($kycDoc) {
        $kycData = [
            'aadhaarNumber' => $kycDoc['aadhaar_number'] ?? '',
            'panNumber'     => $kycDoc['pan_number']     ?? '',
            'dob'           => $kycDoc['dob']            ?? '',
            'address'       => $kycDoc['address']        ?? '',
        ];
    }

    http_response_code(200);
    echo json_encode([
        "status"      => "success",
        "user"        => $userData,
        "bankDetails" => $bankData,
        "kycDetails"  => $kycData,
    ]);

} catch (MongoDB\Driver\Exception\InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid userId format"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
