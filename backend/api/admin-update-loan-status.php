<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once '../config/db.php';

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data      = json_decode(file_get_contents("php://input"), true);
$loanId    = trim($data['loan_id'] ?? '');
$newStatus = trim($data['status']  ?? '');
$remarks   = trim($data['remarks'] ?? '');

$allowedStatuses = ['approved', 'rejected', 'pending'];

if (empty($loanId) || empty($newStatus)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Loan ID and status are required"]);
    exit();
}

if (!in_array($newStatus, $allowedStatuses)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid status value"]);
    exit();
}

try {
    $objectId = new MongoDB\BSON\ObjectId($loanId);

    // Fetch the loan first
    $loan = $database->loan_applications->findOne(['_id' => $objectId]);
    if (!$loan) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Loan not found"]);
        exit();
    }

    // ── ELIGIBILITY CHECKS (only when approving) ──
    if ($newStatus === 'approved') {
        $userId = $loan['user_id'] ?? '';

        // 1. KYC must be completed
        $kyc = $database->kyc_details->findOne(['user_id' => $userId]);
        if (!$kyc) {
            echo json_encode([
                "status"  => "error",
                "message" => "Cannot approve: Borrower KYC is not completed"
            ]);
            exit();
        }

        // 2. Bank details must exist
        $bank = $database->bank_details->findOne(['user_id' => $userId]);
        if (!$bank) {
            echo json_encode([
                "status"  => "error",
                "message" => "Cannot approve: Borrower bank details are missing"
            ]);
            exit();
        }

        // 3. No defaulted loans
        $defaulted = $database->loan_applications->countDocuments([
            'user_id' => $userId,
            'status'  => 'defaulted'
        ]);
        if ($defaulted > 0) {
            echo json_encode([
                "status"  => "error",
                "message" => "Cannot approve: Borrower has $defaulted defaulted loan(s)"
            ]);
            exit();
        }
    }

    // ── UPDATE STATUS ──
    $result = $database->loan_applications->updateOne(
        ['_id' => $objectId],
        ['$set' => [
            'status'      => $newStatus,
            'remarks'     => $remarks,
            'reviewed_by' => $_SESSION['admin_id'],
            'reviewed_at' => new MongoDB\BSON\UTCDateTime(),
            'updated_at'  => new MongoDB\BSON\UTCDateTime()
        ]]
    );

    if ($result->getModifiedCount() === 1) {
        http_response_code(200);
        echo json_encode([
            "status"  => "success",
            "message" => "Loan " . $newStatus . " successfully"
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            "status"  => "error",
            "message" => "Loan not found or status already set to this value"
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>