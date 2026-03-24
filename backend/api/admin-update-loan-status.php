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
$remarks   = trim($data['remarks'] ?? '') ?: ($newStatus === 'approved' ? 'Approved from dashboard' : 'Rejected from dashboard');
$allowedStatuses = ['approved', 'rejected', 'pending', 'closed'];

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

    // Fetch the loan application first
    $loanApp = $database->loan_applications->findOne(['_id' => $objectId]);
    if (!$loanApp) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Loan not found"]);
        exit();
    }

    // ── ELIGIBILITY CHECKS (only when approving) ──
    if ($newStatus === 'approved') {
        $userId = $loanApp['user_id'] ?? '';

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

    // ── UPDATE DATA (prefer stashed: EMI init for approved; include remarks from upstream) ──
    $updateData = [
        'status'      => $newStatus,
        'remarks'     => $remarks,
        'reviewed_by' => $_SESSION['admin_id'],
        'reviewed_at' => new MongoDB\BSON\UTCDateTime(),
        'updated_at'  => new MongoDB\BSON\UTCDateTime()
    ];

    // If approving, initialize EMI data (from stashed)
    if ($newStatus === 'approved' && $loanApp) {
        $amount = (float)($loanApp['loan_amount'] ?? $loanApp['amount'] ?? 0);
        $tenure = (int)($loanApp['loan_tenure'] ?? $loanApp['tenure'] ?? 0);

        $emiAmount = 0;
        if ($tenure > 0) {
            $emiAmount = $amount / $tenure;
        }

        $updateData['emi_amount'] = $emiAmount;
        $updateData['remaining_emis'] = $tenure;
        $updateData['remaining_balance'] = $amount;
        $updateData['loan_start_date'] = new MongoDB\BSON\UTCDateTime();
        $updateData['loan_status'] = 'active';
    }

    $result = $database->loan_applications->updateOne(
        ['_id' => $objectId],
        ['$set' => $updateData]
    );

    if ($result->getModifiedCount() === 1) {
        
        // Create Notification if status is approved or rejected
        if ($loanApp && in_array($newStatus, ['approved', 'rejected'])) {
            $amount = isset($loanApp['loan_amount']) ? $loanApp['loan_amount'] : 0;
            $formattedAmount = number_format((float)$amount);
            
            $message = $newStatus === 'approved' 
                ? "Your loan application for ₹{$formattedAmount} has been approved."
                : "Your loan application has been rejected.";
            
            $notification = [
                'user_id' => (string)$loanApp['user_id'],
                'loan_id' => $loanId,
                'type' => $newStatus === 'approved' ? 'approval' : 'rejection',
                'message' => $message,
                'is_read' => false,
                'created_at' => new MongoDB\BSON\UTCDateTime()
            ];
            
            $database->notifications->insertOne($notification);
        }

        // Log Activity if status is approved or rejected
        if ($loanApp && in_array($newStatus, ['approved', 'rejected'])) {
            try {
                // Fetch the borrower name from the loan application
                $borrower = $loanApp['borrower_name'] ?? 'Borrower';
                $activityType = "loan_" . $newStatus;
                $activityTitle = "Loan " . ucfirst($newStatus);
                $activityDescription = "Loan application for $borrower was " . strtolower($newStatus);

                $database->activities->insertOne([
                    "type" => $activityType,
                    "title" => $activityTitle,
                    "description" => $activityDescription,
                    "reference_id" => $objectId, // Use the ObjectId for reference
                    "created_at" => new MongoDB\BSON\UTCDateTime()
                ]);
            } catch (Exception $e) {
                // Silent fail for activity logging
                error_log("Failed to log activity for loan status update: " . $e->getMessage());
            }
        }

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