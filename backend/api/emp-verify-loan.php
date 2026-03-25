<?php
use MongoDB\BSON\UTCDateTime;
use MongoDB\BSON\ObjectId;

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

// Auth validation
if (empty($_SESSION['emp_id']) || $_SESSION['role'] !== 'bank_employee') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit();
}

$empId = $_SESSION['emp_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$loanId   = trim($data['loan_id'] ?? '');
$decision = trim($data['decision'] ?? '');
$notes    = trim($data['notes'] ?? '');

if (empty($loanId) || !in_array($decision, ['eligible', 'not_eligible']) || empty($notes)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required verification data."]);
    exit();
}

try {
    $now = new UTCDateTime();
    $objectId = new ObjectId($loanId);

    // Fetch existing loan
    $loan = $database->loan_applications->findOne(['_id' => $objectId]);

    if (!$loan) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Loan application not found."]);
        exit();
    }

    // Re-verification Lock
    if (($loan['employee_verification'] ?? 'pending') !== 'pending') {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Already verified"]);
        exit();
    }

    // Update Loan Document
    $updateResult = $database->loan_applications->updateOne(
        ['_id' => $objectId],
        ['$set' => [
            'employee_verification' => $decision,
            'verified_by' => $empId,
            'verified_at' => $now,
            'verification_notes' => $notes,
            'assigned_employee_id' => $empId, // Lock to this employee if it was unassigned
            'updated_at' => $now
        ]]
    );

    if ($updateResult->getModifiedCount() > 0) {
        
        // Notify Borrower
        $notificationMsg = $decision === 'eligible' 
            ? "Your loan application eligibility has been verified and marked as Eligible." 
            : "Your loan application eligibility has been evaluated as Not Eligible. Please check with an agent.";
            
        // Assuming user_id holds the borrower's identifier
        $database->notifications->insertOne([
            'user_id' => $loan['user_id'] ?? $loan['borrower_id'] ?? null,
            'loan_id' => $loanId,
            'type' => 'verification_update',
            'message' => $notificationMsg,
            'is_read' => false,
            'created_at' => $now
        ]);

        echo json_encode([
            "status"  => "success",
            "message" => "Loan verification successful."
        ]);
        
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to update loan verification."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
