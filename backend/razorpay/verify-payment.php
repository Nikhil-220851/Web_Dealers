<?php
// ================================================================
//  verify_payment.php
//  Place in: backend/verify_payment.php
//
//  SECURITY RULES:
//  1. NEVER hardcode API keys in PHP files
//  2. Store secrets in .env or config.php (outside public root)
//  3. Add config.php to .gitignore
// ================================================================

// ── 1. Load config (outside web root, never committed to Git) ──
// File path example: C:/xampp/htdocs/config.php  OR  /var/www/config.php
// Structure of config.php shown at the bottom of this file

$config_path = __DIR__ . '/api/razorpay_config.php'; // go 2 levels up from backend/

if (!file_exists($config_path)) {
    error_log('[LoanPro] config.php not found at: ' . $config_path);
    $msg = urlencode('Server configuration error. Please contact support.');
    header('Location: ../payment_success.html?status=failed&msg=' . $msg);
    exit;
}

require_once $config_path;

// $RAZORPAY_KEY_SECRET is now loaded from config.php
// $DB_HOST, $DB_USER, $DB_PASS, $DB_NAME are also loaded from there

// ── 2. Accept only POST requests ──
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

// ── 3. Read POST values ──
$payment_id = trim($_POST['razorpay_payment_id'] ?? '');
$order_id   = trim($_POST['razorpay_order_id']   ?? '');
$signature  = trim($_POST['razorpay_signature']  ?? '');

// ── 4. Validate that all fields are present ──
if (empty($payment_id) || empty($order_id) || empty($signature)) {
    $msg = urlencode('Incomplete payment details received. Please try again.');
    header('Location: ../payment_success.html?status=failed&msg=' . $msg);
    exit;
}

// ── 5. Verify Razorpay signature ──
//    Razorpay signs: order_id + "|" + payment_id using your secret
$generated_signature = hash_hmac(
    'sha256',
    $order_id . '|' . $payment_id,
    RAZORPAY_KEY_SECRET     // loaded from config.php, NOT hardcoded
);

if (!hash_equals($generated_signature, $signature)) {
    // Signature mismatch = tampered or fake payment
    error_log('[LoanPro] Signature mismatch for order: ' . $order_id);
    $msg = urlencode('Payment verification failed. Possible tampering detected.');
    header('Location: ../payment_success.html?status=failed&msg=' . $msg);
    exit;
}

// ── 6. Signature verified → update DB ──
try {

    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

    if ($conn->connect_error) {
        throw new Exception('DB connection failed: ' . $conn->connect_error);
    }

    // ── 6a. Look up the loan linked to this Razorpay order ──
    $stmt = $conn->prepare(
        "SELECT loan_id, customer_id, emi_amount FROM loans
         WHERE razorpay_order_id = ? AND status != 'paid'
         LIMIT 1"
    );
    $stmt->bind_param('s', $order_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $loan   = $result->fetch_assoc();
    $stmt->close();

    if (!$loan) {
        // Order already paid or doesn't exist
        $msg = urlencode('This order was already processed or does not exist.');
        header('Location: ../payment_success.html?status=failed&msg=' . $msg);
        $conn->close();
        exit;
    }

    // ── 6b. Mark loan as paid and record payment_id ──
    $stmt = $conn->prepare(
        "UPDATE loans
         SET status = 'paid',
             razorpay_payment_id = ?,
             paid_at = NOW()
         WHERE razorpay_order_id = ?"
    );
    $stmt->bind_param('ss', $payment_id, $order_id);
    $stmt->execute();
    $stmt->close();

    // ── 6c. Insert into payments table for audit trail ──
    $stmt = $conn->prepare(
        "INSERT INTO payments
             (loan_id, customer_id, razorpay_payment_id, razorpay_order_id, amount, paid_at)
         VALUES (?, ?, ?, ?, ?, NOW())"
    );
    $stmt->bind_param(
        'iissd',
        $loan['loan_id'],
        $loan['customer_id'],
        $payment_id,
        $order_id,
        $loan['emi_amount']
    );
    $stmt->execute();
    $stmt->close();

    $conn->close();

    // ── 7. Redirect to success page with transaction details ──
    $txn    = urlencode($payment_id);
    $loanId = urlencode('LN-' . str_pad($loan['loan_id'], 6, '0', STR_PAD_LEFT));
    $amount = urlencode($loan['emi_amount']);
    $date   = urlencode(date('d M Y'));

    header(
        'Location: ../payment_success.html'
        . '?status=success'
        . '&txn_id='  . $txn
        . '&loan_id=' . $loanId
        . '&amount='  . $amount
        . '&date='    . $date
        . '&method=Razorpay'
    );
    exit;

} catch (Exception $e) {
    error_log('[LoanPro] Payment DB error: ' . $e->getMessage());
    $msg = urlencode('A server error occurred. Please contact support.');
    header('Location: ../payment_success.html?status=failed&msg=' . $msg);
    exit;
}

/*
================================================================
  config.php  — place TWO LEVELS ABOVE public web root
  Example location:  C:/xampp/config.php
                     /var/www/config.php   (NOT inside /var/www/html)

  Add this file to .gitignore:
      config.php
      .env

================================================================

<?php
// Razorpay
$RAZORPAY_KEY_ID     = 'rzp_test_XXXXXXXXXXXX';   // your key ID
$RAZORPAY_KEY_SECRET = 'YOUR_ACTUAL_SECRET_HERE';  // never share this

// Database
$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = 'your_db_password';
$DB_NAME = 'lms_db';

================================================================
*/
?>