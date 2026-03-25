<?php
/**
 * Shared Payment Processor Logic
 * Handles MongoDB updates for Loan Management System
 */

function processEmiPaymentData($database, $loanId, $userId, $paymentMethod, $transactionId = null, $emiId = null) {
    $now = new DateTime('now');
    
    try {
        $loanObjectId = new MongoDB\BSON\ObjectId($loanId);
        $userObjectId = null;
        try { $userObjectId = new MongoDB\BSON\ObjectId($userId); } catch (Exception $ignored) {}
        
        // 1. Fetch loan
        $loan = $database->loan_applications->findOne([
            '_id' => $loanObjectId,
            '$or' => array_values(array_filter([
                ['user_id' => $userId],
                $userObjectId ? ['user_id' => $userObjectId] : null
            ]))
        ]);
        
        if (!$loan) {
            return ["status" => "error", "message" => "Loan not found"];
        }
        
        $status = strtolower((string)($loan['status'] ?? ''));
        if (!in_array($status, ['approved', 'active'])) {
            return ["status" => "error", "message" => "Loan is not active"];
        }
        
        $tenure = (int)($loan['loan_tenure'] ?? ($loan['tenure'] ?? 0));
        $remainingEmis = (int)($loan['remaining_emis'] ?? 0);
        $totalPaid = (int)($loan['total_emis_paid'] ?? 0);

        if ($tenure > 0 && $totalPaid >= $tenure) {
            return ["status" => "error", "message" => "All EMIs have already been paid for this loan"];
        }
        
        $loanAmount = (float)($loan['loan_amount'] ?? 0);
        $emiFallback = $tenure > 0 ? $loanAmount / $tenure : 0;
        $emiAmount = !empty($loan['emi_amount']) ? (float)$loan['emi_amount'] : $emiFallback;

        // Next due date logic
        $nextDueRaw = $loan['next_due_date'] ?? null;
        $nextDue = null;
        if ($nextDueRaw instanceof MongoDB\BSON\UTCDateTime) {
            $nextDue = $nextDueRaw->toDateTime();
        } elseif (is_string($nextDueRaw) && trim($nextDueRaw) !== '') {
            $nextDue = new DateTime($nextDueRaw);
        } else {
            $nextDue = new DateTime('now');
        }

        $emiNumber = $totalPaid + 1;
        $currentMonth = $nextDue->format('F');
        $currentYear = (int)$nextDue->format('Y');
        
        // Idempotency check: Already processed this transaction?
        if ($transactionId) {
            $duplicate = $database->{'payment-history'}->findOne(['transaction_id' => $transactionId]);
            if ($duplicate) {
                return [
                    "status" => "success", 
                    "message" => "Payment already processed",
                    "already_processed" => true,
                    "data" => [
                        "transaction_id" => $transactionId,
                        "amount" => $duplicate['emi_amount'] ?? 0,
                        "payment_date" => $duplicate['payment_date'] ?? ''
                    ]
                ];
            }
        }
        
        // Secondary check: Already paid for this cycle? (Fallback for non-Razorpay)
        if (!$transactionId) {
            $alreadyPaid = $database->{'payment-history'}->findOne([
                'loan_id' => $loanId,
                'payment_month' => $currentMonth,
                'payment_year' => $currentYear
            ]);
            
            if ($alreadyPaid) {
                return ["status" => "error", "message" => "EMI already paid for this cycle ($currentMonth $currentYear)"];
            }
        }
        
        // Generate internal Transaction ID if not provided (Razorpay ID)
        if (!$transactionId) {
            $transactionId = 'TXN' . strtoupper(bin2hex(random_bytes(5)));
        }
        
        $paymentDate = $now->format('Y-m-d');
        $nextDueDate = (clone $now)->add(new DateInterval('P1M'));
        
        // 2. Insert payment record
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
        $paymentHistoryId = $database->{'payment-history'}->findOne(
            ['transaction_id' => $transactionId],
            ['projection' => ['_id' => 1]]
        )['_id'] ?? null;

        // 3. Update individual EMI status
        $emiDoc = null;
        if ($emiId) {
            try {
                $emiDoc = $database->emi_payments->findOne(['_id' => new MongoDB\BSON\ObjectId($emiId)]);
            } catch (Exception $e) {}
        }
        
        if (!$emiDoc) {
            $emiDoc = $database->emi_payments->findOne(
                ['loan_id' => $loanId, 'status' => 'unpaid'],
                ['sort' => ['due_date' => 1]]
            );
        }

        if ($emiDoc) {
            $database->emi_payments->updateOne(
                ['_id' => $emiDoc['_id']],
                ['$set' => [
                    'status'             => 'paid',
                    'paid_at'            => new MongoDB\BSON\UTCDateTime($now->getTimestamp() * 1000),
                    'amount_paid'        => $emiAmount,
                    'payment_history_id' => $paymentHistoryId
                ]]
            );
            
            if ($paymentHistoryId) {
                $database->{'payment-history'}->updateOne(
                    ['_id' => $paymentHistoryId],
                    ['$set' => ['emi_id' => $emiDoc['_id']]]
                );
            }
        }
        
        // 4. Update Loan Progress
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
        
        if ($tenure > 0 && $emiNumber >= $tenure) {
            $updateData['loan_status'] = 'completed';
            $updateData['status'] = 'inactive';
        }
        
        $database->loan_applications->updateOne(
            ['_id' => $loanObjectId],
            ['$set' => $updateData]
        );

        // 5. Update Credit Score
        $user = $database->users->findOne(['_id' => $userObjectId]);
        $currentScore = isset($user['credit_score']) ? (int)$user['credit_score'] : 726;
        $newCreditScore = min(900, $currentScore + 15);
        
        $database->users->updateOne(
            ['_id' => $userObjectId],
            ['$set' => ['credit_score' => $newCreditScore]]
        );

        // 6. Notifications
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
        } catch (Exception $e) {}

        return [
            "status" => "success", 
            "data" => [
                "transaction_id" => $transactionId,
                "amount" => $emiAmount,
                "emi_number" => $emiNumber,
                "payment_month" => $currentMonth,
                "payment_year" => $currentYear,
                "payment_date" => $paymentDate,
                "next_due_date" => $nextDueDate->format(DateTime::ATOM),
                "new_credit_score" => $newCreditScore
            ]
        ];

    } catch (Exception $e) {
        return ["status" => "error", "message" => "System error: " . $e->getMessage()];
    }
}
