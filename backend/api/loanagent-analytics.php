<?php
use MongoDB\BSON\UTCDateTime;

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

// Auth guard
if (empty($_SESSION['loan_agent_id']) || $_SESSION['role'] !== 'loan_agent') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Unauthorized access. Agent role required."]);
    exit();
}

try {
    $agentId = $_SESSION['loan_agent_id'];

    // 1. Overall Stats
    $totalLoans = $database->loan_applications->countDocuments(['assigned_agent_id' => $agentId]);
    $approvedCount = $database->loan_applications->countDocuments(['assigned_agent_id' => $agentId, 'status' => 'approved']);
    $pendingCount = $database->loan_applications->countDocuments(['assigned_agent_id' => $agentId, 'status' => 'pending']);
    $rejectedCount = $database->loan_applications->countDocuments(['assigned_agent_id' => $agentId, 'status' => 'rejected']);
    $reviewCount = $database->loan_applications->countDocuments(['assigned_agent_id' => $agentId, 'status' => 'review']);

    // Total Commission (1% of approved)
    $totalCommPipeline = [
        ['$match' => ['assigned_agent_id' => $agentId, 'status' => 'approved']],
        ['$group' => ['_id' => null, 'totalAmount' => ['$sum' => '$loan_amount']]]
    ];
    $totalCommResult = $database->loan_applications->aggregate($totalCommPipeline)->toArray();
    $totalAmount = !empty($totalCommResult) ? $totalCommResult[0]['totalAmount'] : 0;
    $totalCommission = round($totalAmount * 0.01, 2);

    $approvalRateOverall = ($totalLoans > 0) ? round(($approvedCount / $totalLoans) * 100, 1) : 0;

    // 2. Time-Series Data (Last 6 Months)
    $months = [];
    $monthlyLoans = [];
    $monthlyCommArr = [];
    $approvalRates = [];

    for ($i = 5; $i >= 0; $i--) {
        $date = new DateTime("first day of -$i months 00:00:00");
        $monthName = $date->format('M');
        $start = new MongoDB\BSON\UTCDateTime($date->getTimestamp() * 1000);
        
        $nextDate = clone $date;
        $nextDate->modify('+1 month');
        $end = new MongoDB\BSON\UTCDateTime($nextDate->getTimestamp() * 1000);

        // Monthly counts
        $mTotal = $database->loan_applications->countDocuments([
            'assigned_agent_id' => $agentId,
            'applied_date' => ['$gte' => $start, '$lt' => $end]
        ]);
        $mApproved = $database->loan_applications->countDocuments([
            'assigned_agent_id' => $agentId,
            'status' => 'approved',
            'applied_date' => ['$gte' => $start, '$lt' => $end]
        ]);

        // Monthly commission
        $mCommPipeline = [
            ['$match' => [
                'assigned_agent_id' => $agentId,
                'status' => 'approved',
                'applied_date' => ['$gte' => $start, '$lt' => $end]
            ]],
            ['$group' => ['_id' => null, 'totalAmount' => ['$sum' => '$loan_amount']]]
        ];
        $mCommResult = $database->loan_applications->aggregate($mCommPipeline)->toArray();
        $mAmount = !empty($mCommResult) ? $mCommResult[0]['totalAmount'] : 0;

        $months[] = $monthName;
        $monthlyLoans[] = $mTotal;
        $monthlyCommArr[] = round($mAmount * 0.01, 2);
        $approvalRates[] = ($mTotal > 0) ? round(($mApproved / $mTotal) * 100, 1) : 0;
    }

    echo json_encode([
        "status" => "success",
        "total_loans" => $totalLoans,
        "approved" => $approvedCount,
        "pending" => $pendingCount,
        "rejected" => $rejectedCount,
        "review" => $reviewCount,
        "total_commission" => $totalCommission,
        "months" => $months,
        "monthly_loans" => $monthlyLoans,
        "monthly_commission" => $monthlyCommArr,
        "approval_rate" => $approvalRates,
        "approval_rate_overall" => $approvalRateOverall
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
