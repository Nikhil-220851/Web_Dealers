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
    $now = new MongoDB\BSON\UTCDateTime();
    
    // 1. Aggregation to find loans with overdue EMIs
    $pipeline = [
        [
            '$match' => [
                'status'   => 'unpaid',
                'due_date' => ['$lt' => $now]
            ]
        ],
        [
            '$group' => [
                '_id'              => '$loan_id',
                'missed_emis'      => ['$sum' => 1],
                'overdue_amount'   => ['$sum' => '$amount'],
                'next_unpaid_date' => ['$min' => '$due_date']
            ]
        ]
    ];

    $overdueCursor = $database->emi_payments->aggregate($pipeline);
    $defaulters = [];

    foreach ($overdueCursor as $overdue) {
        $loanId = (string)$overdue['_id'];
        try {
            $loanObjectId = new MongoDB\BSON\ObjectId($loanId);
        } catch (Exception $e) { continue; }

        $loan = $database->loan_applications->findOne(['_id' => $loanObjectId]);
        if (!$loan) continue;

        $missedCount = $overdue['missed_emis'];
        $statusLabel = ($missedCount >= 3) ? 'Defaulter' : 'Overdue';

        $userId = (string)($loan['user_id'] ?? '');
        $fullName = 'Unknown User';
        if ($userId) {
            $userDoc = $database->users->findOne(['_id' => new MongoDB\BSON\ObjectId($userId)]);
            if ($userDoc) {
                $fname = $userDoc['firstname'] ?? $userDoc['first_name'] ?? '';
                $lname = $userDoc['lastname'] ?? $userDoc['last_name'] ?? '';
                $fullName = trim($fname . ' ' . $lname) ?: ($userDoc['email'] ?? 'User');
            }
        }

        $defaulters[] = [
            'id'               => $loanId,
            'user_id'          => $userId,
            'borrower_name'    => $fullName,
            'amount'           => (float)($loan['loan_amount'] ?? 0),
            'missed_emis'      => $missedCount,
            'overdue_amount'   => round($overdue['overdue_amount'], 2),
            'next_unpaid_date' => $overdue['next_unpaid_date']->toDateTime()->format('Y-m-d'),
            'status_label'     => $statusLabel,
            'data_source'      => 'real'
        ];
    }

    // 2. Backward Compatibility: Fallback for Legacy Loans (approved but no EMI schedule)
    $activeLoans = $database->loan_applications->find([
        'status' => ['$in' => ['approved', 'defaulted']]
    ]);

    foreach ($activeLoans as $app) {
        $loanIdStr = (string)$app['_id'];
        
        // Skip if already processed in real logic
        $alreadyInList = false;
        foreach ($defaulters as $d) {
            if ($d['id'] === $loanIdStr) {
                $alreadyInList = true;
                break;
            }
        }
        if ($alreadyInList) continue;

        // Check if emi_payments exists for this loan
        $hasSchedule = $database->emi_payments->countDocuments(['loan_id' => $loanIdStr]);
        if ($hasSchedule > 0) continue; // No overdue EMIs for this modern loan

        // Legacy age-based logic fallback
        $today = new DateTime();
        $isDefaulter = false;
        $missedPayments = 0;
        
        if (($app['status'] ?? '') === 'defaulted') {
            $isDefaulter = true;
            $missedPayments = ($app['missed_payments'] ?? 0) > 0 ? $app['missed_payments'] : 3;
        } else {
            $appDateRaw = $app['applied_date'] ?? $app['application_date'] ?? null;
            $appDate = null;
            if ($appDateRaw instanceof MongoDB\BSON\UTCDateTime) {
                $appDate = $appDateRaw->toDateTime();
            } elseif (is_string($appDateRaw)) {
                $appDate = new DateTime($appDateRaw);
            }

            if ($appDate) {
                $diff = $today->diff($appDate)->days;
                if ($diff > 30) {
                    $isDefaulter = true;
                    $missedPayments = floor($diff / 30);
                }
            }
        }

        if ($isDefaulter) {
            $amount = floatval($app['loan_amount'] ?? ($app['amount'] ?? 0));
            $tenure = intval($app['loan_tenure'] ?? ($app['tenure'] ?? 12));
            $emiValue = $tenure > 0 ? ($amount / $tenure) * 1.05 : 0;

            $uId = (string)($app['user_id'] ?? '');
            $fName = 'Unknown User';
            if ($uId) {
                $uDoc = $database->users->findOne(['_id' => new MongoDB\BSON\ObjectId($uId)]);
                if ($uDoc) {
                    $fn = $uDoc['firstname'] ?? $uDoc['first_name'] ?? '';
                    $ln = $uDoc['lastname'] ?? $uDoc['last_name'] ?? '';
                    $fName = trim($fn . ' ' . $ln) ?: ($uDoc['email'] ?? 'User');
                }
            }

            $defaulters[] = [
                'id'               => $loanIdStr,
                'user_id'          => $uId,
                'borrower_name'    => $fName,
                'amount'           => $amount,
                'missed_emis'      => (int)$missedPayments,
                'overdue_amount'   => round($missedPayments * $emiValue, 2),
                'next_unpaid_date' => date('Y-m') . '-05 (Est.)',
                'status_label'     => 'Legacy',
                'data_source'      => 'legacy'
            ];
        }
    }

    http_response_code(200);
    echo json_encode(["status" => "success", "data" => $defaulters]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
