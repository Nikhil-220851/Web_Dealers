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

// Start session to check auth
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Use __DIR__ for reliable path resolution
$dbConfigPath = __DIR__ . '/../config/db.php';
if (!file_exists($dbConfigPath)) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database configuration file not found at $dbConfigPath"]);
    exit();
}
require_once $dbConfigPath;

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access. Please log in again."]);
    exit();
}

try {
    $now = new DateTime();
    // Instantiate MongoDB BSON types dynamically to keep editor/linter happy.
    $utcClass = 'MongoDB\\BSON\\UTCDateTime';
    $nowBson = class_exists($utcClass) ? new $utcClass($now->getTimestamp() * 1000) : $now;

    // ─────────────────────────────────────────────
    // SUMMARY COUNTS
    // ─────────────────────────────────────────────
    $totalLoans    = $database->loan_applications->countDocuments([]);
    
    // Statuses that count as "approved" or "active money out"
    $successStatuses = ['approved', 'active', 'accepted', 'disbursed'];
    $approvedLoans = $database->loan_applications->countDocuments(['status' => ['$in' => $successStatuses]]);
    
    $amtPipeline = [
        ['$match' => ['status' => ['$in' => $successStatuses]]],
        ['$group' => ['_id' => null, 'total' => ['$sum' => '$loan_amount']]]
    ];
    $amtResult = $database->loan_applications->aggregate($amtPipeline)->toArray();
    $totalAmount = !empty($amtResult) ? ($amtResult[0]['total'] ?? 0) : 0;

    // ─────────────────────────────────────────────
    // 1. LOAN APPLICATION TRENDS
    // ─────────────────────────────────────────────
    $trendPipeline = [
        ['$project' => [
            'date' => ['$ifNull' => ['$applied_date', $nowBson]]
        ]],
        ['$project' => [
            'dateStr' => ['$dateToString' => ['format' => '%Y-%m-%d', 'date' => '$date']]
        ]],
        ['$group' => ['_id' => '$dateStr', 'count' => ['$sum' => 1]]],
        ['$sort'  => ['_id' => 1]],
        ['$limit' => 30]
    ];
    $trendResult = $database->loan_applications->aggregate($trendPipeline)->toArray();
    $loanTrends = ['labels' => [], 'data' => []];

    if (!empty($trendResult)) {
        foreach ($trendResult as $row) {
            $dt = DateTime::createFromFormat('Y-m-d', $row['_id']);
            $loanTrends['labels'][] = $dt ? $dt->format('d M') : $row['_id'];
            $loanTrends['data'][]   = (int)$row['count'];
        }
    } else {
        $loanTrends['labels'][] = $now->format('d M');
        $loanTrends['data'][]   = (int)$totalLoans;
    }

    // ─────────────────────────────────────────────
    // 2. STATUS DISTRIBUTION
    // ─────────────────────────────────────────────
    $statusPipeline = [
        ['$group' => ['_id' => '$status', 'count' => ['$sum' => 1]]]
    ];
    $statusResult = $database->loan_applications->aggregate($statusPipeline)->toArray();
    $defaultStatus = ['pending' => 0, 'approved' => 0, 'rejected' => 0];
    foreach ($statusResult as $row) {
        $key = strtolower((string)($row['_id'] ?? 'unknown'));
        // Mapping various success statuses to 'approved' bucket
        if (in_array($key, ['active', 'accepted', 'approved', 'disbursed'])) {
            $key = 'approved';
        }
        if (array_key_exists($key, $defaultStatus)) {
            $defaultStatus[$key] += (int)$row['count'];
        }
    }
    $statusDistribution = ['labels' => [], 'data' => []];
    foreach ($defaultStatus as $sKey => $cnt) {
        $statusDistribution['labels'][] = ucfirst($sKey);
        $statusDistribution['data'][]   = $cnt;
    }

    // ─────────────────────────────────────────────
    // 3. LOAN TYPE DISTRIBUTION
    // ─────────────────────────────────────────────
    // `loan_applications` documents don't store `loan_type`.
    // The loan type lives on `loan_products`, referenced by `loan_product_id`.
    $typePipeline = [
        [
            '$addFields' => [
                // Convert product id string -> ObjectId for $lookup
                'product_oid' => [
                    '$convert' => [
                        'input' => '$loan_product_id',
                        'to' => 'objectId',
                        'onError' => null,
                        'onNull' => null
                    ]
                ]
            ]
        ],
        [
            '$lookup' => [
                'from' => 'loan_products',
                'localField' => 'product_oid',
                'foreignField' => '_id',
                'as' => 'product'
            ]
        ],
        [
            '$unwind' => [
                'path' => '$product',
                'preserveNullAndEmptyArrays' => true
            ]
        ],
        [
            '$group' => [
                '_id' => '$product.loan_type',
                'count' => ['$sum' => 1]
            ]
        ]
    ];
    $typeResult = [];
    try {
        $typeResult = $database->loan_applications->aggregate($typePipeline)->toArray();
    } catch (Exception $e) {
        // Fallback for older MongoDB versions / conversion issues:
        // Manually join loan_applications -> loan_products in PHP.
        $typeCounts = [];
        $oidClass = 'MongoDB\\BSON\\ObjectId';
        $cursor = $database->loan_applications->find([], ['limit' => 5000]);

        foreach ($cursor as $app) {
            $prodId = $app['loan_product_id'] ?? null;
            $rawType = null;

            if ($prodId && class_exists($oidClass) && preg_match('/^[a-f\d]{24}$/i', (string)$prodId)) {
                $product = $database->loan_products->findOne([
                    '_id' => new $oidClass((string)$prodId)
                ]);
                $rawType = $product['loan_type'] ?? null;
            }

            $key = $rawType !== null ? (string)$rawType : null;
            if (!isset($typeCounts[$key])) $typeCounts[$key] = 0;
            $typeCounts[$key] += 1;
        }

        foreach ($typeCounts as $k => $cnt) {
            $typeResult[] = ['_id' => $k === 'null' ? null : $k, 'count' => $cnt];
        }
    }
    $loanTypes = ['labels' => [], 'data' => []];
    if (!empty($typeResult)) {
        $countsByLabel = [];
        $labelOrder = [];

        foreach ($typeResult as $row) {
            $rawType = $row['_id'] ?? null;
            $typeStr = is_string($rawType) ? trim($rawType) : (string)$rawType;

            $lower = strtolower($typeStr);
            if (!$rawType || $lower === 'null' || $lower === '') {
                $label = 'Unknown';
            } elseif (strpos($lower, 'personal') !== false) {
                $label = 'Personal';
            } elseif (strpos($lower, 'home') !== false) {
                $label = 'Home';
            } elseif (strpos($lower, 'car') !== false || strpos($lower, 'vehicle') !== false) {
                $label = 'Car';
            } elseif (strpos($lower, 'education') !== false) {
                $label = 'Education';
            } elseif (strpos($lower, 'business') !== false) {
                $label = 'Business';
            } else {
                $label = ucfirst($typeStr);
            }

            if (!isset($countsByLabel[$label])) {
                $countsByLabel[$label] = 0;
                $labelOrder[] = $label;
            }
            $countsByLabel[$label] += (int)$row['count'];
        }

        $loanTypes['labels'] = $labelOrder;
        $loanTypes['data'] = array_map(fn($lbl) => (int)$countsByLabel[$lbl], $labelOrder);
    } else {
        $loanTypes['labels'][] = 'No Data';
        $loanTypes['data'][]   = 0;
    }

    // ─────────────────────────────────────────────
    // 4. MONTHLY AMOUNT DISBURSED
    // ─────────────────────────────────────────────
    $disbursedPipeline = [
        ['$match' => ['status' => ['$in' => $successStatuses]]],
        ['$project' => [
            'date' => ['$ifNull' => ['$applied_date', $nowBson]],
            'loan_amount' => 1
        ]],
        ['$project' => [
            'month' => ['$month' => '$date'],
            'year'  => ['$year'  => '$date'],
            'loan_amount' => 1
        ]],
        ['$group' => [
            '_id' => ['month' => '$month', 'year' => '$year'],
            'totalAmount' => ['$sum' => '$loan_amount']
        ]],
        ['$sort' => ['_id.year' => 1, '_id.month' => 1]]
    ];
    $disbursedResult = $database->loan_applications->aggregate($disbursedPipeline)->toArray();
    $monthlyDisbursed = ['labels' => [], 'data' => []];
    $monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (!empty($disbursedResult)) {
        foreach ($disbursedResult as $row) {
            $m = (int)($row['_id']['month'] ?? 0);
            $y = (int)($row['_id']['year'] ?? 0);
            $label = ($m > 0 && $m < 13) ? ($monthNames[$m] . ' ' . $y) : "Month $m $y";
            $monthlyDisbursed['labels'][] = $label;
            $monthlyDisbursed['data'][]   = round((float)$row['totalAmount'], 2);
        }
    } else {
        $monthlyDisbursed['labels'][] = 'No Data';
        $monthlyDisbursed['data'][]   = 0;
    }

    // ─────────────────────────────────────────────
    // 5. EMI PAYMENT TREND
    // ─────────────────────────────────────────────
    $emiPipeline = [
        ['$project' => [
            'dateStr' => ['$substr' => ['$payment_date', 0, 10]],
            'emi_amount' => 1
        ]],
        ['$match' => ['dateStr' => ['$ne' => null, '$ne' => '']]],
        ['$group' => [
            '_id'       => '$dateStr',
            'totalPaid' => ['$sum' => '$emi_amount']
        ]],
        ['$sort'  => ['_id' => 1]],
        ['$limit' => 30]
    ];
    $emiResult = $database->{'payment-history'}->aggregate($emiPipeline)->toArray();
    $emiTrends = ['labels' => [], 'data' => []];
    if (!empty($emiResult)) {
        foreach ($emiResult as $row) {
            $dt = DateTime::createFromFormat('Y-m-d', $row['_id']);
            $emiTrends['labels'][] = $dt ? $dt->format('d M') : $row['_id'];
            $emiTrends['data'][]   = round((float)$row['totalPaid'], 2);
        }
    } else {
        $emiTrends['labels'][] = 'No Data';
        $emiTrends['data'][]   = 0;
    }

    // ─────────────────────────────────────────────
    // 6. DEFAULTERS LIST
    // ─────────────────────────────────────────────
    $defaulters = [];
    $overdueCursor = $database->loan_applications->find([
        'status'        => ['$in' => $successStatuses],
        'next_due_date' => ['$lt' => $nowBson]
    ]);

    foreach ($overdueCursor as $loan) {
        $userFirstName = 'User';
        $userId = $loan['user_id'] ?? '';
        if (!empty($userId)) {
            try {
                $oidClass = 'MongoDB\\BSON\\ObjectId';
                $userDoc = $database->users->findOne([
                    '_id' => class_exists($oidClass) ? new $oidClass((string)$userId) : (string)$userId
                ]);
                $userFirstName = $userDoc['firstname'] ?? $userDoc['first_name'] ?? 'User';
            } catch (Exception $e) { $userFirstName = 'Error Loading Name'; }
        }
        $dueDate = (is_object($loan['next_due_date']) && method_exists($loan['next_due_date'], 'toDateTime'))
          ? $loan['next_due_date']->toDateTime()
          : null;
        $daysOverdue = $dueDate ? max(0, (int)$now->diff($dueDate)->days) : 0;
        
        $defaulters[] = [
            'id'            => (string)$loan['_id'],
            'borrower_name' => $userFirstName,
            'emi_amount'    => round((float)($loan['emi_amount'] ?? 0), 2),
            'amount'        => round((float)($loan['loan_amount'] ?? 0), 2),
            'due_date'      => $dueDate ? $dueDate->format('d M Y') : 'N/A',
            'days_overdue'  => $daysOverdue
        ];
    }

    echo json_encode([
        "status" => "success",
        "data"   => [
            "summary" => [
                "totalLoans"    => (int)$totalLoans,
                "approvedLoans" => (int)$approvedLoans,
                "totalAmount"   => round((float)$totalAmount, 2)
            ],
            "loanTrends"         => $loanTrends,
            "statusDistribution" => $statusDistribution,
            "loanTypes"          => $loanTypes,
            "monthlyDisbursed"   => $monthlyDisbursed,
            "emiTrends"          => $emiTrends,
            "defaulters"         => $defaulters
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server aggregation error: " . $e->getMessage()]);
}
