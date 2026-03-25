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

/**
 * Resolve a user id from session (preferred) or query string (fallback for existing frontend).
 */
session_start();
$sessionUserId = isset($_SESSION['user_id']) ? trim((string)$_SESSION['user_id']) : '';

$loanId = trim($_GET['loan_id'] ?? '');
$userId = $sessionUserId ?: trim($_GET['user_id'] ?? $_GET['userId'] ?? '');

if ($loanId === '' || $userId === '') {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "loan_id and user_id are required"]);
    exit();
}

try {
    $loanObjectId = new MongoDB\BSON\ObjectId($loanId);
    $userObjectId = null;
    try { $userObjectId = new MongoDB\BSON\ObjectId($userId); } catch (Exception $ignored) {}

    $loan = $database->loan_applications->findOne([
        '_id' => $loanObjectId,
        '$or' => array_values(array_filter([
            ['user_id' => $userId],
            $userObjectId ? ['user_id' => $userObjectId] : null
        ]))
    ]);

    if (!$loan) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Loan not found"]);
        exit();
    }

    $loanStatus = strtolower((string)($loan['loan_status'] ?? ''));
    $status = strtolower((string)($loan['status'] ?? ''));
    if (!in_array($loanStatus, ['active', 'in-progress', ''], true) || !in_array($status, ['approved', 'active'], true)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Loan is not active"]);
        exit();
    }

    $tenure = (int)($loan['loan_tenure'] ?? ($loan['tenure'] ?? 0));
    $totalPaid = (int)($loan['total_emis_paid'] ?? 0);
    $remainingEmis = $tenure > 0 ? max(0, $tenure - $totalPaid) : (int)($loan['remaining_emis'] ?? 0);

    if ($tenure > 0 && $totalPaid >= $tenure) {
        echo json_encode([
            "status" => "success",
            "data" => [
                "loan_id" => $loanId,
                "loan_amount" => (float)($loan['loan_amount'] ?? 0),
                "emi_amount" => !empty($loan['emi_amount']) ? (float)$loan['emi_amount'] : ($tenure > 0 ? ((float)($loan['loan_amount'] ?? 0) / $tenure) : 0),
                "remaining_emis" => 0,
                "remaining_balance" => (float)($loan['remaining_balance'] ?? 0),
                "next_emi_month" => null,
                "next_emi_year" => null,
                "loan_completed" => true,
                "total_emis_paid" => $totalPaid
            ]
        ]);
        exit();
    }

    $loanAmount = (float)($loan['loan_amount'] ?? 0);
    
    // Fallback for emi_amount if missing from DB
    $emiFallback = $tenure > 0 ? $loanAmount / $tenure : 0;
    $emiAmount = !empty($loan['emi_amount']) ? (float)$loan['emi_amount'] : $emiFallback;
    $remainingBalance = (float)($loan['remaining_balance'] ?? 0);

    // Use next_due_date stored on the loan for consistency with repayment logic
    $nextDueRaw = $loan['next_due_date'] ?? null;
    $due = null;
    if ($nextDueRaw instanceof MongoDB\BSON\UTCDateTime) {
        $due = $nextDueRaw->toDateTime();
    } elseif (is_string($nextDueRaw) && trim($nextDueRaw) !== '') {
        $due = new DateTime($nextDueRaw);
    } else {
        // Fallback: allow immediate payment and set due as now for display
        $due = new DateTime('now');
    }

    $now = new DateTime('now');
    $nowDate = new DateTime($now->format('Y-m-d'));
    $nextDueDateOnly = new DateTime($due->format('Y-m-d'));
    
    $emiStatus = "pending";
    if ($totalPaid === 0) {
        $emiStatus = "pending";
    } elseif ($nowDate < $nextDueDateOnly) {
        $emiStatus = "paid";
    } elseif ($nowDate == $nextDueDateOnly) {
        $emiStatus = "pending";
    } else {
        $emiStatus = "overdue";
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "loan_id" => $loanId,
            "loan_amount" => $loanAmount,
            "emi_amount" => $emiAmount,
            "remaining_emis" => $remainingEmis,
            "remaining_balance" => $remainingBalance,
            "next_emi_month" => $due->format('F'),
            "next_emi_year" => (int)$due->format('Y'),
            "loan_completed" => false,
            "total_emis_paid" => $totalPaid,
            "emi_status" => $emiStatus
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "System error: " . $e->getMessage()]);
}


