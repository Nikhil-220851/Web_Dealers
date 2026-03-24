<?php


require __DIR__ . '/../vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');


$envPath = __DIR__ . '/../../.env';

if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        [$key, $value] = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
} else {
    echo json_encode(["status" => "error", "message" => ".env file not found"]);
    exit;
}

/* ── Read values from .env ───────────────────────────────────── */
$mongoUri = $_ENV['MONGO_URI'] ?? '';
$mongoDb  = $_ENV['MONGO_DB']  ?? 'Loan_Management_System';

if (empty($mongoUri)) {
    echo json_encode(["status" => "error", "message" => "MONGO_URI not set in .env"]);
    exit;
}

try {

    /* ── 1. MongoDB connection ──────────────────────────────────── */
    $client     = new MongoDB\Client($mongoUri);
    $db         = $client->$mongoDb;
    $usersCol   = $db->users;
    $loanCol    = $db->loan_applications;
    $productCol = $db->loan_products;

    /* ── 2. Validate email param ────────────────────────────────── */
    if (empty(trim($_GET['email'] ?? ''))) {
        echo json_encode(["status" => "error", "message" => "Email not provided"]);
        exit;
    }
    $email = trim($_GET['email']);

    /* ── 3. Find user ───────────────────────────────────────────── */
    $user = $usersCol->findOne(["email" => $email]);
    if (!$user) {
        echo json_encode(["status" => "error", "message" => "User not found"]);
        exit;
    }
    $userId = (string)$user->_id;

    /* ── 4. Find active loan for this user ──────────────────────── */
    $loan = $loanCol->findOne(["user_id" => $userId]);
    if (!$loan) {
        echo json_encode(["status" => "no-loan"]);
        exit;
    }

    /* ── 5. Get loan product (interest rate, product name) ──────── */
    $product = $productCol->findOne([
        "_id" => new MongoDB\BSON\ObjectId((string)$loan["loan_product_id"])
    ]);

    /* ── 6. Extract core loan fields ────────────────────────────── */
    $principal    = (float)($loan["loan_amount"]          ?? 0);
    $tenureMonths = (int)  ($loan["loan_tenure"]          ?? 0);
    $annualRate   = (float)($product["interest_rate"]     ?? 0);
    $loanType     = (string)($loan["loan_type"]           ?? $product["product_name"] ?? "Loan");
    $bankName     = (string)($loan["bank"]                ?? $product["bank"]         ?? "");
    $loanAppId    = (string)$loan["_id"];

    /* ── 7. EMI calculation ─────────────────────────────────────── */
    $monthlyRate = ($annualRate / 100) / 12;

    if ($monthlyRate == 0 || $tenureMonths == 0) {
        $emi = $tenureMonths > 0 ? $principal / $tenureMonths : 0;
    } else {
        $emi = $principal
             * $monthlyRate
             * pow(1 + $monthlyRate, $tenureMonths)
             / (pow(1 + $monthlyRate, $tenureMonths) - 1);
    }

    /* ── 8. Build YEARLY schedule ───────────────────────────────── */
    $balance          = $principal;
    $cumPrincipal     = 0;
    $cumInterest      = 0;
    $totalYears       = (int)ceil($tenureMonths / 12);
    $startYear        = (int)date('Y');

    $labels           = [];
    $principalData    = [];
    $interestData     = [];
    $balanceData      = [];
    $cumPrincipalData = [];
    $cumInterestData  = [];
    $breakevenYear    = null;
    $halfwayYear      = null;

    for ($yr = 0; $yr < $totalYears; $yr++) {
        $yearPrincipal = 0;
        $yearInterest  = 0;
        $monthStart    = $yr * 12 + 1;
        $monthEnd      = min(($yr + 1) * 12, $tenureMonths);

        for ($m = $monthStart; $m <= $monthEnd; $m++) {
            if ($balance <= 0) break;
            $interestComp  = $balance * $monthlyRate;
            $principalComp = min($emi - $interestComp, $balance);
            $balance      -= $principalComp;
            $yearPrincipal += $principalComp;
            $yearInterest  += $interestComp;
            $cumPrincipal  += $principalComp;
            $cumInterest   += $interestComp;
        }

        $currentYear        = $startYear + $yr;
        $labels[]           = (string)$currentYear;
        $principalData[]    = (int)round($yearPrincipal);
        $interestData[]     = (int)round($yearInterest);
        $balanceData[]      = (int)round(max(0, $balance));
        $cumPrincipalData[] = (int)round($cumPrincipal);
        $cumInterestData[]  = (int)round($cumInterest);

        if (!$breakevenYear && $cumPrincipal >= $cumInterest) {
            $breakevenYear = $currentYear;
        }
        if (!$halfwayYear && ($principal - max(0, $balance)) >= $principal / 2) {
            $halfwayYear = $currentYear;
        }
    }

    /* ── 9. Summary totals ──────────────────────────────────────── */
    $totalPayment  = (int)round($emi * $tenureMonths);
    $totalInterest = (int)round($totalPayment - $principal);
    $tenureYears   = round($tenureMonths / 12, 1);

    /* ── 10. Send response ──────────────────────────────────────── */
    echo json_encode([
        "status"           => "success",

        "loanId"           => $loanAppId,
        "loanType"         => $loanType,
        "bank"             => $bankName,

        "loanAmount"       => $principal,
        "loanTenure"       => $tenureMonths,
        "tenureYears"      => $tenureYears,
        "interestRate"     => $annualRate,
        "emi"              => (int)round($emi),
        "totalPayment"     => $totalPayment,
        "totalInterest"    => $totalInterest,

        "breakevenYear"    => $breakevenYear,
        "halfwayYear"      => $halfwayYear,
        "costPerLakh"      => (int)round($totalInterest / ($principal / 100000)),

        "labels"           => $labels,
        "principalData"    => $principalData,
        "interestData"     => $interestData,
        "balanceData"      => $balanceData,
        "cumPrincipalData" => $cumPrincipalData,
        "cumInterestData"  => $cumInterestData,
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ]);
}
?>