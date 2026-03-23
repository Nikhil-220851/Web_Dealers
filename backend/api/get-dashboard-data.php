<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';

$userId = trim($_GET['userId'] ?? '');
if (!$userId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "userId is required"]);
    exit();
}

try {
    $now = new DateTime();
    // 1. Fetch User Profile
    $objectId = new MongoDB\BSON\ObjectId($userId);
    $user = $database->users->findOne(['_id' => $objectId]);

    if (!$user) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found"]);
        exit();
    }

    $userData = [
        'firstname' => $user['firstname'] ?? 'User',
        'lastname'  => $user['lastname']  ?? '',
    ];

    // 2. Fetch all loan applications for calculations
    // Support both string and ObjectId for user_id to be safe
    $query = [
        '$or' => [
            ['user_id' => $userId],
            ['user_id' => $objectId]
        ]
    ];
    $cursor = $database->loan_applications->find($query);
    $allLoans = iterator_to_array($cursor);

    $totalLoans = count($allLoans);
    $activeLoansCount = 0;
    $pendingLoansCount = 0;
    $totalAmountBorrowed = 0;
    $activeLoansList = [];
    $recentApplications = [];

    // Sort by date for recent applications (if applied_date exists)
    usort($allLoans, function($a, $b) {
        $dateA = $a['applied_date'] ?? new MongoDB\BSON\UTCDateTime(0);
        $dateB = $b['applied_date'] ?? new MongoDB\BSON\UTCDateTime(0);
        return $dateB->toDateTime() <=> $dateA->toDateTime();
    });

    foreach ($allLoans as $app) {
        $status = strtolower($app['status'] ?? 'pending');
        $amount = (float)($app['loan_amount'] ?? 0);

        // Success statuses that should be counted as active/approved
        $isSuccess = in_array($status, ['active', 'approved', 'accepted']);

        if ($isSuccess) {
            $activeLoansCount++;
            $totalAmountBorrowed += $amount;
        } elseif ($status === 'pending') {
            $pendingLoansCount++;
        }

        // Get product details for more info
        $productId = $app['loan_product_id'] ?? '';
        $product = null;
        if ($productId && preg_match('/^[a-f\d]{24}$/i', $productId)) {
            $product = $database->loan_products->findOne(['_id' => new MongoDB\BSON\ObjectId($productId)]);
        }

        $dateStr = '';
        if (isset($app['applied_date'])) {
            if ($app['applied_date'] instanceof MongoDB\BSON\UTCDateTime) {
                $dateStr = $app['applied_date']->toDateTime()->format('d M Y');
            } else {
                $dateStr = (string)$app['applied_date'];
            }
        }

        $tenure = (int)($app['loan_tenure'] ?? ($app['tenure'] ?? 0));
        $emiFallback = $tenure > 0 ? $amount / $tenure : 0;
        $totalPaid = (int)($app['total_emis_paid'] ?? 0);

        $nextDueRaw = $app['next_due_date'] ?? null;
        $nextDueStr = null;
        $nextDueDt = null;
        if ($nextDueRaw instanceof MongoDB\BSON\UTCDateTime) {
            $nextDueDt = $nextDueRaw->toDateTime();
            $nextDueStr = $nextDueDt->format(DATE_ATOM);
        } elseif (is_string($nextDueRaw) && trim($nextDueRaw) !== '') {
            $nextDueDt = new DateTime($nextDueRaw);
            $nextDueStr = $nextDueDt->format(DATE_ATOM);
        }
        $emiStatus = "pending";
        if ($nextDueDt && $isSuccess) {
            $nowDate = new DateTime($now->format('Y-m-d'));
            $nextDueDateOnly = new DateTime($nextDueDt->format('Y-m-d'));
            
            if ($totalPaid === 0) {
                $emiStatus = "pending";
            } elseif ($nowDate < $nextDueDateOnly) {
                $emiStatus = "paid";
            } elseif ($nowDate == $nextDueDateOnly) {
                $emiStatus = "pending";
            } else {
                $emiStatus = "overdue";
            }
        }
        
        $isOverdue = ($emiStatus === "overdue");

        $loanInfo = [
            'id'                => (string) $app['_id'],
            'loan_type'         => $product['loan_type'] ?? 'Unknown',
            'bank_name'         => $product['bank_name'] ?? 'Unknown',
            'interest_rate'     => $product['interest_rate'] ?? 0,
            'amount'            => $amount,
            'tenure'            => $tenure,
            'status'            => $status,
            'applied_date'      => $dateStr,
            'emi_amount'        => !empty($app['emi_amount']) ? $app['emi_amount'] : $emiFallback,
            'remaining_emis'    => isset($app['remaining_emis']) ? $app['remaining_emis'] : max(0, $tenure - $totalPaid),
            'remaining_balance' => isset($app['remaining_balance']) ? $app['remaining_balance'] : $amount,
            'loan_start_date'   => isset($app['loan_start_date']) ? (string)$app['loan_start_date'] : null,
            'total_emis_paid'   => $totalPaid,
            'next_due_date'     => $nextDueStr,
            'emi_status'        => $emiStatus,
            'is_overdue'        => $isOverdue
        ];

        // Any approved/active loan should go into the active list for the hero section
        if ($isSuccess) {
            $activeLoansList[] = $loanInfo;
        }

        if (count($recentApplications) < 5) {
            $recentApplications[] = $loanInfo;
        }
    }

    // 3. Loan Recommendations (Top 3 products user hasn't applied for, or just latest)
    $recCursor = $database->loan_products->find([], ['limit' => 3]);
    $recommendations = [];
    foreach ($recCursor as $prod) {
        $recommendations[] = [
            'id'            => (string) $prod['_id'],
            'loan_type'     => $prod['loan_type'] ?? '',
            'bank_name'     => $prod['bank_name'] ?? '',
            'interest_rate' => $prod['interest_rate'] ?? 0,
        ];
    }

    // 4. EMI Overview (Simplified: sum of monthly EMIs for active loans)
    // EMI Calculation: [P x R x (1+R)^N]/[(1+R)^N-1]
    $totalMonthlyEMI = 0;
    foreach ($activeLoansList as $loan) {
        $P = $loan['amount'];
        $r = ($loan['interest_rate'] / 100) / 12;
        $n = $loan['tenure'] * 12;
        if ($r > 0 && $n > 0) {
            $emi = ($P * $r * pow(1 + $r, $n)) / (pow(1 + $r, $n) - 1);
            $totalMonthlyEMI += $emi;
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "user" => $userData,
            "summary" => [
                "totalLoans" => $totalLoans,
                "activeLoans" => $activeLoansCount,
                "pendingLoans" => $pendingLoansCount,
                "totalAmount" => $totalAmountBorrowed,
                "monthlyEMI" => round($totalMonthlyEMI, 2)
            ],
            "activeLoans" => $activeLoansList,
            "recentApplications" => $recentApplications,
            "recommendations" => $recommendations
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
