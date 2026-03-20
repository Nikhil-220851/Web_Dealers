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
    // Fetch all loan requests, sorted by application date descending (prefer stashed)
    $cursor = $database->loan_applications->find([], ['sort' => ['applied_date' => -1]]);

    $loanRequests = [];

    foreach ($cursor as $app) {
        $userId    = $app['user_id'] ?? '';
        $productId = $app['loan_product_id'] ?? '';
        $product   = null;
        $userFirstName = 'User';

        // ── FETCH LOAN PRODUCT (bank name, loan type) ──
        if (!empty($productId)) {
            try {
                if (preg_match('/^[a-f\d]{24}$/i', $productId)) {
                    $product = $database->loan_products->findOne([
                        '_id' => new MongoDB\BSON\ObjectId($productId)
                    ]);
                }
            } catch (Exception $ignored) {}
        }

        $loanType = $product['loan_type'] ?? ($app['loan_type'] ?? 'Unknown');
        $bankName = $product['bank_name'] ?? ($app['bank_name'] ?? 'Unknown Bank');

        // ── FETCH BORROWER NAME FROM users COLLECTION ──
        $borrowerName = 'Unknown User';
        if (!empty($userId)) {
            try {
                $user = $database->users->findOne(
                    ['_id' => new MongoDB\BSON\ObjectId($userId)],
                    ['projection' => [
                        'firstname' => 1,
                        'lastname'  => 1,
                        'name'      => 1,
                        'full_name' => 1
                    ]]
                );

                if ($user) {
                    if (!empty($user['firstname']) || !empty($user['lastname'])) {
                        // firstname + lastname format
                        $borrowerName = trim(
                            ($user['firstname'] ?? '') . ' ' . ($user['lastname'] ?? '')
                        );
                    } elseif (!empty($user['name'])) {
                        // single name field
                        $borrowerName = trim($user['name']);
                    } elseif (!empty($user['full_name'])) {
                        // full_name field
                        $borrowerName = trim($user['full_name']);
                    }
                }
            } catch (Exception $ignored) {
                // Invalid ObjectId or user not found — keep 'Unknown User'
            }
        }

        // ── BUILD LOAN REQUEST ENTRY ── (prefer stashed: borrower_name from users firstname)
        $displayName = $borrowerName !== 'Unknown User' ? $borrowerName : $userFirstName;
        $loanRequests[] = [
            'id'               => (string) $app['_id'],
            'borrower_id'      => $userId,
            'borrower_name'    => $displayName ?: 'Unknown User',
            'loan_type'        => $loanType,
            'bank_name'        => $bankName,
            'amount'           => $app['loan_amount'] ?? ($app['amount'] ?? 0),
            'tenure'           => $app['loan_tenure'] ?? ($app['tenure'] ?? 0),
            'status'           => $app['status'] ?? 'pending',
            'application_date' => isset($app['applied_date']) && $app['applied_date'] instanceof MongoDB\BSON\UTCDateTime
                                  ? $app['applied_date']->toDateTime()->format('Y-m-d')
                                  : ($app['application_date'] ?? '')
        ];
    }

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data"   => $loanRequests
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
