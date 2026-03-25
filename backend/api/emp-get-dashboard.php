<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

try {
    // Pipeline for basic metrics
    $pipeline = [
        ['$match' => ['assigned_employee_id' => $empId]],
        ['$facet' => [
            'total_assigned' => [['$count' => 'count']],
            'pending_verifications' => [
                ['$match' => ['employee_verification' => 'pending']],
                ['$count' => 'count']
            ],
            'verified_loans' => [
                ['$match' => ['employee_verification' => ['$ne' => 'pending']]],
                ['$count' => 'count']
            ]
        ]]
    ];

    $cursor = $database->loan_applications->aggregate($pipeline);
    $results = iterator_to_array($cursor);

    $metrics = $results[0];

    $totalAssigned = $metrics['total_assigned'][0]['count'] ?? 0;
    $pendingVerifications = $metrics['pending_verifications'][0]['count'] ?? 0;
    $verifiedLoans = $metrics['verified_loans'][0]['count'] ?? 0;

    // Get recent loans assigned to this employee
    $recentLoansCursor = $database->loan_applications->find(
        ['assigned_employee_id' => $empId],
        [
            'sort'  => ['created_at' => -1],
            'limit' => 5,
            'projection' => [
                '_id' => 1,
                'loan_amount' => 1,
                'status' => 1,
                'employee_verification' => 1
            ]
        ]
    );

    $recentLoans = [];
    foreach ($recentLoansCursor as $loan) {
        $recentLoans[] = [
            'loan_id' => (string) $loan['_id'],
            'loan_amount' => $loan['loan_amount'] ?? 0,
            'status' => $loan['status'] ?? 'pending',
            'verification_status' => $loan['employee_verification'] ?? 'pending'
        ];
    }

    echo json_encode([
        "status" => "success",
        "data"   => [
            "total_assigned" => $totalAssigned,
            "pending_verifications" => $pendingVerifications,
            "verified_loans" => $verifiedLoans,
            "recent_loans" => $recentLoans
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}

?>
