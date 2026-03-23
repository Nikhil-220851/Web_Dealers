<?php
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';

try {
    $cursor = $database->loan_applications->find([]);
    $updatedCount = 0;
    $errors = [];

    foreach ($cursor as $loan) {
        $id = $loan['_id'];
        $updates = [];
        $unsets = [];

        // Map old fields to new fields if missing
        if (!isset($loan['loan_amount']) && isset($loan['amount'])) {
            $updates['loan_amount'] = (float)$loan['amount'];
        }
        if (!isset($loan['loan_tenure']) && isset($loan['tenure'])) {
            $updates['loan_tenure'] = (int)$loan['tenure'];
        }
        if (!isset($loan['emi_amount']) && isset($loan['emi'])) {
            $updates['emi_amount'] = (float)$loan['emi'];
        }
        if (!isset($loan['remaining_balance']) && isset($loan['remaining_amount'])) {
            $updates['remaining_balance'] = (float)$loan['remaining_amount'];
        }
        if (!isset($loan['total_emis_paid']) && isset($loan['total_paid'])) {
            $updates['total_emis_paid'] = (int)$loan['total_paid'];
        }

        // Logic Requirements
        $loanAmount = $updates['loan_amount'] ?? ($loan['loan_amount'] ?? ($loan['amount'] ?? 0));
        $loanTenure = $updates['loan_tenure'] ?? ($loan['loan_tenure'] ?? ($loan['tenure'] ?? 0));
        $totalEmisPaid = $updates['total_emis_paid'] ?? ($loan['total_emis_paid'] ?? ($loan['total_paid'] ?? 0));
        
        if (!isset($loan['loan_amount']) && !isset($updates['loan_amount'])) {
            $updates['loan_amount'] = (float)$loanAmount;
        }
        if (!isset($loan['loan_tenure']) && !isset($updates['loan_tenure'])) {
            $updates['loan_tenure'] = (int)$loanTenure;
        }
        if (!isset($loan['emi_amount']) && !isset($updates['emi_amount'])) {
            // Default EMI calculation if missing
            $updates['emi_amount'] = (float)($loan['emi'] ?? 0);
        }
        if (!isset($loan['remaining_balance']) && !isset($updates['remaining_balance'])) {
            $updates['remaining_balance'] = (float)$loanAmount;
        }
        if (!isset($loan['remaining_emis'])) {
            $updates['remaining_emis'] = (int)($loanTenure - $totalEmisPaid);
        }
        if (!isset($loan['total_emis_paid']) && !isset($updates['total_emis_paid'])) {
            $updates['total_emis_paid'] = (int)$totalEmisPaid;
        }

        // Loan Status
        if (!isset($loan['loan_status'])) {
            $status = $loan['status'] ?? 'pending';
            $updates['loan_status'] = ($status === 'approved') ? 'active' : 'pending';
        }

        // Date fields
        $now = new MongoDB\BSON\UTCDateTime();
        if (!isset($loan['applied_date'])) {
            $updates['applied_date'] = $now;
        }
        if (!isset($loan['loan_start_date'])) {
            $updates['loan_start_date'] = $loan['applied_date'] ?? $now;
        }
        if (!isset($loan['updated_at'])) {
            $updates['updated_at'] = $now;
        }
        if (!isset($loan['next_due_date'])) {
            // Default to next month if active
            $date = new DateTime();
            $date->modify('+1 month');
            $updates['next_due_date'] = new MongoDB\BSON\UTCDateTime($date->getTimestamp() * 1000);
        }

        // Fields to unset
        $oldFields = ['amount', 'tenure', 'emi', 'remaining_amount', 'total_paid'];
        foreach ($oldFields as $field) {
            if (isset($loan[$field])) {
                $unsets[$field] = "";
            }
        }

        $updateDoc = [];
        if (!empty($updates)) {
            $updateDoc['$set'] = $updates;
        }
        if (!empty($unsets)) {
            $updateDoc['$unset'] = $unsets;
        }

        if (!empty($updateDoc)) {
            $res = $database->loan_applications->updateOne(['_id' => $id], $updateDoc);
            if ($res->getModifiedCount() > 0) {
                $updatedCount++;
            }
        }
    }

    echo json_encode([
        "status" => "success",
        "message" => "Normalization complete",
        "updated_records" => $updatedCount,
        "errors" => $errors
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
