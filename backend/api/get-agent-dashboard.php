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

// Auth guard
if (empty($_SESSION['loan_agent_id']) || $_SESSION['role'] !== 'loan_agent') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Unauthorized access. Agent role required."]);
    exit();
}

try {
    $agentId = $_SESSION['loan_agent_id'];

    // 1. Total Loans assigned to this agent
    $totalLoans = $database->loan_applications->countDocuments(['assigned_agent_id' => $agentId]);

    // 2. Approved
    $approvedLoans = $database->loan_applications->countDocuments(['assigned_agent_id' => $agentId, 'status' => 'approved']);

    // 3. Pending
    $pendingLoans = $database->loan_applications->countDocuments(['assigned_agent_id' => $agentId, 'status' => 'pending']);

    // 4. Rejected
    $rejectedLoans = $database->loan_applications->countDocuments(['assigned_agent_id' => $agentId, 'status' => 'rejected']);

    // 5. Total Commission (1% of approved loan_amount)
    $totalCommPipeline = [
        ['$match' => ['assigned_agent_id' => $agentId, 'status' => 'approved']],
        ['$group' => ['_id' => null, 'totalAmount' => ['$sum' => '$loan_amount']]]
    ];
    $totalCommResult = $database->loan_applications->aggregate($totalCommPipeline)->toArray();
    $totalAmount = !empty($totalCommResult) ? $totalCommResult[0]['totalAmount'] : 0;
    $totalCommission = $totalAmount * 0.01;

    // 6. Monthly Commission
    $startOfMonth = new DateTime('first day of this month 00:00:00');
    $endOfMonth = new DateTime('last day of this month 23:59:59');
    $monthlyCommPipeline = [
        ['$match' => [
            'assigned_agent_id' => $agentId,
            'status' => 'approved',
            'applied_date' => [
                '$gte' => new MongoDB\BSON\UTCDateTime($startOfMonth->getTimestamp() * 1000),
                '$lte' => new MongoDB\BSON\UTCDateTime($endOfMonth->getTimestamp() * 1000)
            ]
        ]],
        ['$group' => ['_id' => null, 'totalAmount' => ['$sum' => '$loan_amount']]]
    ];
    $monthlyCommResult = $database->loan_applications->aggregate($monthlyCommPipeline)->toArray();
    $monthlyAmount = !empty($monthlyCommResult) ? $monthlyCommResult[0]['totalAmount'] : 0;
    $monthlyCommission = $monthlyAmount * 0.01;

    // 7. Recent Loans (limit 10)
    $recentOptions = [
        'sort' => ['applied_date' => -1],
        'limit' => 10
    ];
    $recentDocCursor = $database->loan_applications->find(['assigned_agent_id' => $agentId], $recentOptions);
    
    $recentLoans = [];
    foreach ($recentDocCursor as $doc) {
        $commission = ($doc['status'] === 'approved') ? ((float)($doc['loan_amount'] ?? 0) * 0.01) : 0;
        $recentLoans[] = [
            'loan_id' => (string)$doc['_id'],
            'loan_amount' => $doc['loan_amount'] ?? 0,
            'status' => $doc['status'] ?? 'unknown',
            'commission' => $commission
        ];
    }

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data" => [
            "total_loans" => $totalLoans,
            "approved_loans" => $approvedLoans,
            "pending_loans" => $pendingLoans,
            "rejected_loans" => $rejectedLoans,
            "total_commission" => $totalCommission,
            "monthly_commission" => $monthlyCommission,
            "recent_loans" => $recentLoans
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

?>
