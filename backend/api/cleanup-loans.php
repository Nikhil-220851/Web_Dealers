<?php
ob_clean();
header("Content-Type: application/json");
require_once '../config/db.php';

try {
    // 1. Delete broken records (missing loan_name OR interest_rate OR min_amount)
    $deleteResult = $database->loan_products->deleteMany([
        '$or' => [
            ["loan_name" => ["$exists" => false]],
            ["interest_rate" => ["$exists" => false]],
            ["min_amount" => ["$exists" => false]],
            ["max_amount" => ["$exists" => false]],
            ["tenure" => ["$exists" => false]]
        ]
    ]);

    $deletedCount = $deleteResult->getDeletedCount();

    // 2. Re-seed if empty (Ensure a clean start with the correct schema)
    $currentCount = $database->loan_products->countDocuments();
    $seeded = false;

    if ($currentCount === 0) {
        $seed = [
            [
                "loan_name" => "Executive Personal Loan",
                "loan_type" => "Personal Loan",
                "bank_name" => "HDFC Bank",
                "interest_rate" => 10.99,
                "max_amount" => 1500000,
                "min_amount" => 50000,
                "processing_fee" => 1500,
                "tenure" => 60,
                "description" => "Fast approval personal loans with minimal documentation.",
                "status" => "active",
                "created_at" => new MongoDB\BSON\UTCDateTime()
            ],
            [
                "loan_name" => "First Home Advantage",
                "loan_type" => "Home Loan",
                "bank_name" => "SBI Bank",
                "interest_rate" => 8.25,
                "max_amount" => 50000000,
                "min_amount" => 1000000,
                "processing_fee" => 10000,
                "tenure" => 300,
                "description" => "Low interest home loans for first-time home buyers.",
                "status" => "active",
                "created_at" => new MongoDB\BSON\UTCDateTime()
            ]
        ];
        $database->loan_products->insertMany($seed);
        $seeded = true;
    }

    echo json_encode([
        "success" => true,
        "message" => "Cleanup completed",
        "deleted_count" => $deletedCount,
        "seeded" => $seeded,
        "current_total" => $database->loan_products->countDocuments()
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
exit;
