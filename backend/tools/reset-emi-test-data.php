<?php
/**
 * Development helper script to reset EMI-related test data.
 * 
 * USAGE (from project root on your machine):
 *   php Web_Dealers/backend/tools/reset-emi-test-data.php
 *
 * This will:
 *   - Delete ALL documents from the `payment-history` collection
 *   - Reset EMI counters and balances on ALL loans in `loan_applications`
 *     (remaining_emis, remaining_balance, total_emis_paid, next_due_date, statuses)
 *
 * DO NOT deploy or expose this script in production.
 */

require_once __DIR__ . '/../config/db.php';

echo "Resetting EMI test data...\n";

try {
    // 1) Clear payment history
    $deleteResult = $database->{'payment-history'}->deleteMany([]);
    echo "Deleted " . $deleteResult->getDeletedCount() . " payment-history documents.\n";

    // 2) Reset all loans
    $cursor = $database->loan_applications->find([]);
    $count = 0;
    foreach ($cursor as $loan) {
        $id = $loan['_id'];
        $amount = (float)($loan['loan_amount'] ?? 0);
        $tenure = (int)($loan['loan_tenure'] ?? ($loan['tenure'] ?? 0));

        $update = [
            'remaining_emis'    => $tenure,
            'remaining_balance' => $amount,
            'total_emis_paid'   => 0,
            'next_due_date'     => null,
            'loan_status'       => 'active',
            // Keep original approval status if present, default to 'approved'
            'status'            => $loan['status'] ?? 'approved',
        ];

        $database->loan_applications->updateOne(
            ['_id' => $id],
            ['$set' => $update, '$unset' => ['updated_at' => ""]]
        );
        $count++;
    }

    echo "Reset " . $count . " loan_applications documents.\n";
    echo "EMI test data reset complete.\n";

} catch (Exception $e) {
    echo "Error while resetting EMI data: " . $e->getMessage() . "\n";
    exit(1);
}


