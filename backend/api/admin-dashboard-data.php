<?php
// CORS headers
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

// Check if admin is logged in
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

try {
    $now = new DateTime();
    $nowBson = new MongoDB\BSON\UTCDateTime($now->getTimestamp() * 1000);
    $successStatuses = ['approved', 'active', 'accepted', 'disbursed'];

    // 1. KPIs
    $totalApplications = $database->loan_applications->countDocuments([]);
    $pendingCount = $database->loan_applications->countDocuments(['status' => 'pending']);
    $approvedCount = $database->loan_applications->countDocuments(['status' => ['$in' => $successStatuses]]);
    $activeLoansCount = $database->loan_applications->countDocuments(['loan_status' => 'active']);
    
    // Disbursed Amount
    $disbursedPipeline = [
        ['$match' => ['status' => ['$in' => $successStatuses]]],
        ['$group' => ['_id' => null, 'total' => ['$sum' => '$loan_amount']]]
    ];
    $disbursedResult = $database->loan_applications->aggregate($disbursedPipeline)->toArray();
    $totalDisbursed = !empty($disbursedResult) ? ($disbursedResult[0]['total'] ?? 0) : 0;

    // Defaulters Count
    $defaultersCount = $database->loan_applications->countDocuments([
        'status' => ['$in' => $successStatuses],
        'loan_status' => 'active',
        'next_due_date' => ['$lt' => $nowBson]
    ]);

    $kpis = [
        "totalApplications" => $totalApplications,
        "pending" => $pendingCount,
        "approved" => $approvedCount,
        "disbursed" => $totalDisbursed,
        "activeLoans" => $activeLoansCount,
        "defaulters" => $defaultersCount
    ];

    // 2. MINI CHARTS
    // Loan Applications (Last 7 Days)
    $sevenDaysAgo = (new DateTime())->modify('-7 days');
    $sevenDaysAgoBson = new MongoDB\BSON\UTCDateTime($sevenDaysAgo->getTimestamp() * 1000);
    
    $trendPipeline = [
        ['$match' => ['applied_date' => ['$gte' => $sevenDaysAgoBson]]],
        ['$project' => [
            'dateStr' => ['$dateToString' => ['format' => '%Y-%m-%d', 'date' => '$applied_date']]
        ]],
        ['$group' => ['_id' => '$dateStr', 'count' => ['$sum' => 1]]],
        ['$sort' => ['_id' => 1]]
    ];
    $trendResult = $database->loan_applications->aggregate($trendPipeline)->toArray();
    
    $loanTrends = ['labels' => [], 'data' => []];
    $trendsMap = [];
    foreach ($trendResult as $row) {
        $trendsMap[$row['_id']] = $row['count'];
    }

    for ($i = 6; $i >= 0; $i--) {
        $d = (new DateTime())->modify("-$i days");
        $ds = $d->format('Y-m-d');
        $loanTrends['labels'][] = $d->format('D');
        $loanTrends['data'][] = $trendsMap[$ds] ?? 0;
    }

    // Status Distribution
    $statusPipeline = [
        ['$group' => ['_id' => '$status', 'count' => ['$sum' => 1]]]
    ];
    $statusResult = $database->loan_applications->aggregate($statusPipeline)->toArray();
    $statusDist = ['Pending' => 0, 'Approved' => 0, 'Rejected' => 0];
    foreach ($statusResult as $row) {
        $s = strtolower($row['_id'] ?? 'pending');
        if (in_array($s, $successStatuses)) $statusDist['Approved'] += $row['count'];
        elseif ($s === 'rejected') $statusDist['Rejected'] += $row['count'];
        else $statusDist['Pending'] += $row['count'];
    }

    $miniCharts = [
        "loanTrends" => $loanTrends,
        "statusDistribution" => [
            "labels" => array_keys($statusDist),
            "data" => array_values($statusDist)
        ]
    ];

    // 3. PENDING APPROVALS (Top 5) — fetch borrower_name from users, add loan_type
    $pendingCursor = $database->loan_applications->find(
        ['status' => 'pending'],
        ['sort' => ['applied_date' => -1], 'limit' => 5]
    );
    $pendingApprovals = [];
    foreach ($pendingCursor as $loan) {
        $userId = $loan['user_id'] ?? '';
        $borrowerName = $loan['borrower_name'] ?? 'Unknown';
        if ($userId) {
            try {
                $user = $database->users->findOne(['_id' => new MongoDB\BSON\ObjectId($userId)], ['projection' => ['firstname' => 1, 'lastname' => 1, 'name' => 1]]);
                if ($user) {
                    $borrowerName = trim(($user['firstname'] ?? '') . ' ' . ($user['lastname'] ?? '')) ?: ($user['name'] ?? 'Unknown');
                }
            } catch (Exception $e) {}
        }
        $productId = $loan['loan_product_id'] ?? '';
        $loanType = 'Unknown';
        if ($productId && preg_match('/^[a-f\d]{24}$/i', $productId)) {
            $product = $database->loan_products->findOne(['_id' => new MongoDB\BSON\ObjectId($productId)]);
            $loanType = $product['loan_type'] ?? $loan['loan_type'] ?? 'Unknown';
        }
        $dateRaw = $loan['applied_date'] ?? $loan['application_date'] ?? null;
        $dateStr = ($dateRaw instanceof MongoDB\BSON\UTCDateTime) ? $dateRaw->toDateTime()->format('d M Y') : 'N/A';
        $pendingApprovals[] = [
            'id' => (string)$loan['_id'],
            'borrower_name' => $borrowerName,
            'loan_type' => ucfirst(strtolower($loanType)),
            'amount' => $loan['loan_amount'] ?? $loan['amount'] ?? 0,
            'date' => $dateStr
        ];
    }

    // 4. DEFAULTERS (Top 5) — add missed_emis, last_paid_date, total_due; sort by highest overdue first
    $defaultersCursor = $database->loan_applications->find(
        [
            'status' => ['$in' => $successStatuses],
            'loan_status' => 'active',
            'next_due_date' => ['$lt' => $nowBson]
        ],
        ['sort' => ['next_due_date' => 1], 'limit' => 10]
    );
    $defaultersPreview = [];
    foreach ($defaultersCursor as $loan) {
        $dueDate = ($loan['next_due_date'] instanceof MongoDB\BSON\UTCDateTime) ? $loan['next_due_date']->toDateTime() : null;
        $daysOverdue = $dueDate ? max(0, (int)$now->diff($dueDate)->days) : 0;
        $tenure = (int)($loan['loan_tenure'] ?? $loan['tenure'] ?? 0);
        $totalPaid = (int)($loan['total_emis_paid'] ?? 0);
        $emiAmount = (float)($loan['emi_amount'] ?? 0);
        $missedEmis = $tenure > 0 ? max(0, (int)ceil($daysOverdue / 30) - ($totalPaid > 0 ? 0 : 1)) : 0;
        if ($daysOverdue > 0 && $totalPaid === 0) $missedEmis = max(1, (int)ceil($daysOverdue / 30));
        $totalDue = $emiAmount * max(1, $missedEmis);
        $lastPaidDate = null;
        $lastPay = $database->{'payment-history'}->findOne(
            ['loan_id' => (string)$loan['_id']],
            ['sort' => ['created_at' => -1], 'projection' => ['payment_date' => 1, 'created_at' => 1]]
        );
        if ($lastPay && isset($lastPay['payment_date'])) $lastPaidDate = $lastPay['payment_date'];
        elseif ($lastPay && isset($lastPay['created_at']) && $lastPay['created_at'] instanceof MongoDB\BSON\UTCDateTime) {
            $lastPaidDate = $lastPay['created_at']->toDateTime()->format('Y-m-d');
        }
        $userId = $loan['user_id'] ?? '';
        $borrowerName = $loan['borrower_name'] ?? 'Unknown';
        if ($userId) {
            try {
                $user = $database->users->findOne(['_id' => new MongoDB\BSON\ObjectId($userId)], ['projection' => ['firstname' => 1, 'lastname' => 1, 'name' => 1]]);
                if ($user) {
                    $borrowerName = trim(($user['firstname'] ?? '') . ' ' . ($user['lastname'] ?? '')) ?: ($user['name'] ?? 'Unknown');
                }
            } catch (Exception $e) {}
        }
        $defaultersPreview[] = [
            'id' => (string)$loan['_id'],
            'borrower_name' => $borrowerName,
            'days_overdue' => $daysOverdue,
            'amount' => $emiAmount,
            'missed_emis' => $missedEmis,
            'last_paid_date' => $lastPaidDate,
            'total_due' => $totalDue
        ];
    }
    usort($defaultersPreview, fn($a, $b) => ($b['days_overdue'] ?? 0) - ($a['days_overdue'] ?? 0));
    $defaultersPreview = array_slice($defaultersPreview, 0, 5);

    // 5. RECENT ACTIVITY (Top 10 - from dedicated collection)
    $activities = [];
    try {
        $cursor = $database->activities->find([], [
            'sort' => ['created_at' => -1],
            'limit' => 10
        ]);
        
        foreach ($cursor as $doc) {
            $ts = ($doc['created_at'] instanceof MongoDB\BSON\UTCDateTime) ? $doc['created_at']->toDateTime()->getTimestamp() : 0;
            $activities[] = [
                'type' => $doc['type'] ?? 'info',
                'title' => $doc['title'] ?? 'Activity',
                'description' => $doc['description'] ?? '',
                'time' => $ts * 1000 // ms
            ];
        }
    } catch (Exception $e) {
        // fallback to empty
    }
    $recentActivities = $activities;


    echo json_encode([
        "status" => "success",
        "data" => [
            "kpis" => [
                "totalApplications" => $totalApplications ?? 0,
                "pending"           => $pendingCount ?? 0,
                "approved"          => $approvedCount ?? 0,
                "disbursed"         => $totalDisbursed ?? 0,
                "activeLoans"       => $activeLoansCount ?? 0,
                "defaulters"        => $defaultersCount ?? 0
            ],
            "miniCharts" => [
                "loanTrends"         => $loanTrends ?? [],
                "statusDistribution" => [
                    "labels" => isset($statusDist) ? array_keys($statusDist) : [],
                    "data"   => isset($statusDist) ? array_values($statusDist) : []
                ]
            ],
            "pendingApprovals"  => $pendingApprovals ?? [],
            "defaultersPreview" => $defaultersPreview ?? [],
            "recentActivities"  => $recentActivities ?? []
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

function time_elapsed_string($timestamp) {
    $diff = time() - $timestamp;
    if ($diff < 60) return "just now";
    $units = [
        31536000 => 'year',
        2592000 => 'month',
        604800 => 'week',
        86400 => 'day',
        3600 => 'hour',
        60 => 'minute'
    ];
    foreach ($units as $unit => $text) {
        if ($diff < $unit) continue;
        $numberOfUnits = floor($diff / $unit);
        return $numberOfUnits . ' ' . $text . (($numberOfUnits > 1) ? 's' : '') . ' ago';
    }
    return "recently";
}
?>
