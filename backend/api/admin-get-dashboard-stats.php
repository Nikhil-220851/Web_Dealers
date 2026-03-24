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

try {
    // Total Borrowers (users collection)
    $totalBorrowers = $database->users->countDocuments();

    // Loan Stats
    $totalLoans = $database->loan_applications->countDocuments();
    $approvedLoans = $database->loan_applications->countDocuments(['status' => 'approved']);
    $rejectedLoans = $database->loan_applications->countDocuments(['status' => 'rejected']);
    $pendingLoans = $database->loan_applications->countDocuments(['status' => 'pending']);

    // Calculate total loan amount (optional, assume we sum up the requested amount)
    // For simplicity, we can fetch all and sum or use aggregation
    $pipeline = [
        ['$group' => ['_id' => null, 'totalAmount' => ['$sum' => '$amount']]]
    ];
    $amountResult = $database->loan_applications->aggregate($pipeline)->toArray();
    $totalAmount = !empty($amountResult) ? $amountResult[0]['totalAmount'] : 0;

    // Recent 5 Applications
    $recentAppsCursor = $database->loan_applications->find(
        [], 
        [
            'sort' => ['application_date' => -1],
            'limit' => 5
        ]
    );

    $recentApps = [];
    foreach ($recentAppsCursor as $app) {
        $recentApps[] = [
            'id' => (string) $app['_id'],
            'borrower_id' => $app['user_id'] ?? '',
            'borrower_name' => $app['borrower_name'] ?? 'Unknown User',
            'loan_type' => $app['loan_type'] ?? '',
            'amount' => $app['amount'] ?? 0,
            'status' => $app['status'] ?? 'pending',
            'application_date' => $app['application_date'] ?? ''
        ];
    }

    $stats = [
        "totalBorrowers" => $totalBorrowers,
        "totalLoans" => $totalLoans,
        "approvedLoans" => $approvedLoans,
        "rejectedLoans" => $rejectedLoans,
        "pendingLoans" => $pendingLoans,
        "totalAmount" => $totalAmount,
        "recentApplications" => $recentApps
    ];

    http_response_code(200);
    echo json_encode(["status" => "success", "data" => $stats]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
