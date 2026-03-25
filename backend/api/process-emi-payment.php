<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$rawBody = file_get_contents("php://input");
$data = json_decode(file_get_contents("php://input"), true);
$loanId = trim($data['loan_id'] ?? '');
$paymentMethod = trim($data['payment_method'] ?? '');

session_start();
$sessionUserId = isset($_SESSION['user_id']) ? trim((string)$_SESSION['user_id']) : '';
$userId = $sessionUserId ?: trim($data['user_id'] ?? $data['userId'] ?? '');

if ($paymentMethod === '') {
    $paymentMethod = 'UPI';
}

if (empty($loanId) || empty($userId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Loan ID and User ID are required"]);
    exit();
}

try {
    $loanObjectId = new MongoDB\BSON\ObjectId($loanId);
    $userObjectId = null;
    try { $userObjectId = new MongoDB\BSON\ObjectId($userId); } catch (Exception $ignored) {}
    
    // Fetch loan
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
    if ($loanStatus !== 'active' || !in_array($status, ['approved', 'active'], true)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Loan is not active"]);
        exit();
    }
    
    $tenure = (int)($loan['loan_tenure'] ?? ($loan['tenure'] ?? 0));
    $remainingEmis = (int)($loan['remaining_emis'] ?? 0);
    $totalPaid = (int)($loan['total_emis_paid'] ?? 0);

    if ($tenure > 0 && $totalPaid >= $tenure) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "All EMIs have already been paid for this loan"]);
        exit();
    }
    
    $loanAmount = (float)($loan['loan_amount'] ?? 0);
    $emiFallback = $tenure > 0 ? $loanAmount / $tenure : 0;
    $emiAmount = !empty($loan['emi_amount']) ? (float)$loan['emi_amount'] : $emiFallback;

    // Enforce monthly restriction and next due date cooling period
    $now = new DateTime('now');
    $nextDueRaw = $loan['next_due_date'] ?? null;
    $nextDue = null;
    if ($nextDueRaw instanceof MongoDB\BSON\UTCDateTime) {
        $nextDue = $nextDueRaw->toDateTime();
    } elseif (is_string($nextDueRaw) && trim($nextDueRaw) !== '') {
        $nextDue = new DateTime($nextDueRaw);
    } else {
        $nextDue = new DateTime('now'); // default to now if unset
    }

    $nowDate = new DateTime($now->format('Y-m-d'));
    $nextDueDateOnly = new DateTime($nextDue->format('Y-m-d'));

    if ($totalPaid > 0 && $nowDate < $nextDueDateOnly) {
        // Technically already paid if we are before the next due date and have paid at least 1 EMI
        $diff = $nextDue->getTimestamp() - $now->getTimestamp();
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "EMI already paid for the current cycle. Next EMI is due on " . $nextDue->format('d M Y'),
            "data" => [
                "seconds_remaining" => $diff > 0 ? $diff : 0,
                "next_due_date" => $nextDue->format(DateTime::ATOM)
            ]
        ]);
        exit();
    }

    // EMI number is next in sequence
    $emiNumber = $totalPaid + 1;
    if ($tenure > 0 && $emiNumber > $tenure) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "EMI count exceeds tenure."]);
        exit();
    }

    // Current billing cycle month/year (for reporting only)
    $currentMonth = $nextDue->format('F'); // Lock payment record to the month it's due
    $currentYear = (int)$nextDue->format('Y');
    
    // BACKEND CHECK: Reject double payments for same cycle
    $alreadyPaid = $database->{'payment-history'}->findOne([
        'loan_id' => $loanId,
        'payment_month' => $currentMonth,
        'payment_year' => $currentYear
    ]);
    
    if ($alreadyPaid) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "EMI already paid for this cycle ($currentMonth $currentYear)"]);
        exit();
    }
    
    // Insert new payment record
    $transactionId = 'TXN' . strtoupper(bin2hex(random_bytes(5)));
    $paymentDate = $now->format('Y-m-d');
    
    // Safer Date Calculation (P1M avoids weird 31st month skips): nextDueDate = today + 1 month
    $nextDueDate = (clone $now)->add(new DateInterval('P1M'));
    
    $paymentRecord = [
        'loan_id' => $loanId,
        'user_id' => $userId,
        'emi_amount' => $emiAmount,
        'payment_month' => $currentMonth,
        'payment_year' => $currentYear,
        'payment_date' => $paymentDate,
        'transaction_id' => $transactionId,
        'payment_method' => $paymentMethod,
        'payment_status' => ($tenure > 0 && $emiNumber === $tenure) ? 'completed' : 'success',
        'emi_number' => $emiNumber,
        'next_due_date' => new MongoDB\BSON\UTCDateTime($nextDueDate->getTimestamp() * 1000),
        'total_emis_paid' => $emiNumber,
        'created_at' => new MongoDB\BSON\UTCDateTime($now->getTimestamp() * 1000)
    ];
    
    $database->{'payment-history'}->insertOne($paymentRecord);
    
    // Update Loan Progress
    $newRemainingEmis = $remainingEmis > 0 ? $remainingEmis - 1 : max(0, $tenure - $emiNumber);
    $newRemainingBalance = max(0, (float)($loan['remaining_balance'] ?? 0) - $emiAmount);
    
    $updateData = [
        'remaining_emis' => $newRemainingEmis,
        'remaining_balance' => $newRemainingBalance,
        'total_emis_paid' => $emiNumber,
        'next_due_date' => new MongoDB\BSON\UTCDateTime($nextDueDate->getTimestamp() * 1000),
        'last_paid_date' => new MongoDB\BSON\UTCDateTime($now->getTimestamp() * 1000),
        'emi_status' => 'paid',
        'updated_at' => new MongoDB\BSON\UTCDateTime($now->getTimestamp() * 1000)
    ];
    
    // Loan Completion
    if ($tenure > 0 && $emiNumber >= $tenure) {
        $updateData['loan_status'] = 'completed';
        $updateData['status'] = 'inactive';
    }
    
    $database->loan_applications->updateOne(
        ['_id' => $loanObjectId],
        ['$set' => $updateData]
    );

    // Update Credit Score automatically when EMI is paid successfully
    $user = $database->users->findOne(['_id' => $userObjectId]);
    $currentScore = isset($user['credit_score']) ? (int)$user['credit_score'] : 726;
    $newCreditScore = min(900, $currentScore + 15);
    
    $database->users->updateOne(
        ['_id' => $userObjectId],
        ['$set' => ['credit_score' => $newCreditScore]]
    );

    // Create notification for borrower
    try {
        $formattedAmt = number_format($emiAmount);
        $msg = ($tenure > 0 && $emiNumber >= $tenure)
            ? "Your loan has been fully paid. Congratulations!"
            : "Your EMI of ₹{$formattedAmt} was processed successfully. Next due: " . $nextDueDate->format('d M Y');
        $database->notifications->insertOne([
            'user_id' => $userId,
            'loan_id' => $loanId,
            'type' => ($tenure > 0 && $emiNumber >= $tenure) ? 'loan_completed' : 'emi_paid',
            'message' => $msg,
            'is_read' => false,
            'created_at' => new MongoDB\BSON\UTCDateTime($now->getTimestamp() * 1000)
        ]);
    } catch (Exception $e) { /* silent */ }

    // Log Activity
    try {
        $borrower = $loan['borrower_name'] ?? 'Borrower';
        $formattedAmt = number_format($emiAmount);
        $database->activities->insertOne([
            "type" => "emi_paid",
            "title" => "EMI Payment Received",
            "description" => "$borrower paid EMI of ₹$formattedAmt",
            "reference_id" => $loanObjectId,
            "created_at" => new MongoDB\BSON\UTCDateTime()
        ]);
    } catch (Exception $e) {
        // silent fail
    }
    
    echo json_encode([
        "status" => "success", 
        "message" => "EMI Payment processed successfully",
        "data" => [
            "transaction_id" => $transactionId,
            "amount" => $emiAmount,
            "emi_number" => $emiNumber,
            "payment_month" => $currentMonth,
            "payment_year" => $currentYear,
            "payment_date" => $paymentDate,
            "payment_method" => $paymentMethod,
            "next_due_date" => $nextDueDate->format(DateTime::ATOM),
            "total_emis_paid" => $emiNumber,
            "loan_completed" => ($tenure > 0 && $emiNumber >= $tenure),
            "new_credit_score" => $newCreditScore
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "System error: " . $e->getMessage()]);
}
?>
