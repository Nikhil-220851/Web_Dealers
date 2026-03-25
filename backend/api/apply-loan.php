<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$userId        = trim($data['userId']        ?? '');
$loanProductId = trim($data['loanProductId'] ?? '');
$loanAmount    = floatval($data['loanAmount']  ?? 0);
$loanTenure    = intval($data['loanTenure']    ?? 0);
$applicantDetails = $data['applicantDetails'] ?? [];
    // Upsert KYC details so they are fixed for future loans
    if (!empty($applicantDetails)) {
        $kycUpdate = [
            'user_id' => $userId,
            'updated_at' => new MongoDB\BSON\UTCDateTime()
        ];
        if (!empty($applicantDetails['f_aadhaar'])) $kycUpdate['aadhaar_number'] = $applicantDetails['f_aadhaar'];
        if (!empty($applicantDetails['f_pan'])) $kycUpdate['pan_number'] = $applicantDetails['f_pan'];
        if (!empty($applicantDetails['f_dob'])) $kycUpdate['dob'] = $applicantDetails['f_dob'];
        if (!empty($applicantDetails['f_address'])) $kycUpdate['address'] = $applicantDetails['f_address'];
        
        $database->kyc_details->updateOne(
            ['user_id' => $userId],
            ['$set' => $kycUpdate],
            ['upsert' => true]
        );
    }

if (!$userId || !$loanProductId || !$loanAmount || !$loanTenure) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "userId, loanProductId, loanAmount and loanTenure are required"]);
    exit();
}

try {
    $now = new MongoDB\BSON\UTCDateTime();
    $dueDate = new DateTime();
    $dueDate->modify('+1 month');

    $doc = [
        "user_id"           => $userId,
        "loan_product_id"   => $loanProductId,
        "loan_amount"       => $loanAmount,
        "loan_tenure"       => $loanTenure,
        "emi_amount"        => $loanAmount / $loanTenure, // Basic calculation
        "remaining_balance" => $loanAmount,
        "remaining_emis"    => $loanTenure,
        "total_emis_paid"   => 0,
        "applicant_details" => $applicantDetails,
        "status"            => "pending",
        "loan_status"       => "applied",
        "applied_date"      => $now,
        "loan_start_date"   => $now,
        "updated_at"        => $now,
        "next_due_date"     => new MongoDB\BSON\UTCDateTime($dueDate->getTimestamp() * 1000),
    ];

    $result = $database->loan_applications->insertOne($doc);

    if ($result->getInsertedCount() > 0) {
        $applicationId = (string) $result->getInsertedId();
        
        // Create notification for loan submission
        $notification = [
            'user_id' => $userId,
            'loan_id' => $applicationId,
            'type' => 'loan_applied',
            'message' => 'Your loan application has been submitted successfully and is under review.',
            'is_read' => false,
            'created_at' => new MongoDB\BSON\UTCDateTime()
        ];
        $database->notifications->insertOne($notification);

        http_response_code(201);
        echo json_encode([
            "status"        => "success",
            "message"       => "Application submitted",
            "applicationId" => $applicationId,
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Insert failed"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
