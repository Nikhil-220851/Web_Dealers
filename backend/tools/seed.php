<?php
/**
 * LMS Seed Script
 * Run from project root: php backend/tools/seed.php
 * Seeds: 1 Admin, 3-5 Borrowers, Loan Products
 */

$baseDir = dirname(__DIR__);
require_once $baseDir . '/vendor/autoload.php';

$envFile = $baseDir . '/../../.env';
if (file_exists($envFile)) {
    $env = parse_ini_file($envFile);
    foreach ($env as $k => $v) $_ENV[$k] = $v;
}

$mongoUri = $_ENV['MONGODB_URI'] ?? 'mongodb://localhost:27017';
$dbName   = $_ENV['MONGO_DB']   ?? 'Loan_Management_System';

try {
    $client   = new MongoDB\Client($mongoUri);
    $database = $client->selectDatabase($dbName);
} catch (Exception $e) {
    die("DB connection failed: " . $e->getMessage() . "\n");
}

echo "=== LMS Seed Script ===\n";
echo "Database: $dbName\n\n";

$now = new MongoDB\BSON\UTCDateTime();

// 1. Admin
$adminEmail = 'admin@loanpro.com';
$adminExists = $database->admins->findOne(['email' => $adminEmail]);
if (!$adminExists) {
    $database->admins->insertOne([
        'firstname'  => 'Admin',
        'lastname'   => 'User',
        'name'       => 'Admin User',
        'email'      => $adminEmail,
        'phone'      => '9876543210',
        'role'       => 'super',
        'password'   => password_hash('admin123', PASSWORD_DEFAULT),
        'created_at' => $now
    ]);
    echo "✓ Created admin: $adminEmail / admin123\n";
} else {
    echo "- Admin already exists: $adminEmail\n";
}

// 2. Borrowers
$borrowers = [
    ['firstname' => 'Rahul', 'lastname' => 'Sharma', 'email' => 'rahul@test.com', 'phoneno' => '9123456780'],
    ['firstname' => 'Priya', 'lastname' => 'Patel',  'email' => 'priya@test.com', 'phoneno' => '9234567890'],
    ['firstname' => 'Amit',  'lastname' => 'Kumar',  'email' => 'amit@test.com',  'phoneno' => '9345678901'],
    ['firstname' => 'Sneha', 'lastname' => 'Reddy',  'email' => 'sneha@test.com', 'phoneno' => '9456789012'],
    ['firstname' => 'Vikram', 'lastname' => 'Singh', 'email' => 'vikram@test.com', 'phoneno' => '9567890123'],
];

$userIds = [];
foreach ($borrowers as $b) {
    $exists = $database->users->findOne(['email' => $b['email']]);
    if (!$exists) {
        $res = $database->users->insertOne([
            'firstname' => $b['firstname'],
            'lastname'  => $b['lastname'],
            'email'     => $b['email'],
            'phoneno'   => $b['phoneno'],
            'password'  => password_hash('user123', PASSWORD_DEFAULT),
            'createdAt' => $now
        ]);
        $userIds[$b['email']] = (string) $res->getInsertedId();
        echo "✓ Created borrower: {$b['email']} / user123\n";
    } else {
        $userIds[$b['email']] = (string) $exists['_id'];
        echo "- Borrower exists: {$b['email']}\n";
    }
}

// 3. Loan Products
$products = [
    ['loan_name' => 'SBI Home Loan', 'bank_name' => 'SBI', 'loan_type' => 'home', 'interest_rate' => 8.4, 'tenure' => 360, 'min_amount' => 500000, 'max_amount' => 7500000, 'processing_fee' => 0.5],
    ['loan_name' => 'HDFC Personal Loan', 'bank_name' => 'HDFC', 'loan_type' => 'personal', 'interest_rate' => 10.5, 'tenure' => 84, 'min_amount' => 50000, 'max_amount' => 4000000, 'processing_fee' => 2],
    ['loan_name' => 'ICICI Car Loan', 'bank_name' => 'ICICI', 'loan_type' => 'car', 'interest_rate' => 9.0, 'tenure' => 84, 'min_amount' => 100000, 'max_amount' => 3000000, 'processing_fee' => 1],
    ['loan_name' => 'Axis Business Loan', 'bank_name' => 'Axis', 'loan_type' => 'business', 'interest_rate' => 11.0, 'tenure' => 60, 'min_amount' => 100000, 'max_amount' => 5000000, 'processing_fee' => 2.5],
];

foreach ($products as $p) {
    $exists = $database->loan_products->findOne(['loan_name' => $p['loan_name']]);
    if (!$exists) {
        $database->loan_products->insertOne(array_merge($p, [
            'description' => $p['loan_name'] . ' - Competitive rates',
            'status' => 'active',
            'created_at' => $now
        ]));
        echo "✓ Created loan product: {$p['loan_name']}\n";
    } else {
        echo "- Loan product exists: {$p['loan_name']}\n";
    }
}

// 4. Sample loan application (pending) if we have a borrower and product
$product = $database->loan_products->findOne(['status' => 'active']);
$firstUserId = reset($userIds);
if ($product && $firstUserId) {
    $appExists = $database->loan_applications->findOne(['user_id' => $firstUserId, 'status' => 'pending']);
    if (!$appExists) {
        $database->loan_applications->insertOne([
            'user_id'         => $firstUserId,
            'loan_product_id' => (string) $product['_id'],
            'loan_amount'     => 500000,
            'loan_tenure'     => 12,
            'status'          => 'pending',
            'loan_status'     => 'applied',
            'applied_date'    => $now,
            'applicant_details' => [],
            'created_at'      => $now,
            'updated_at'      => $now
        ]);
        echo "✓ Created sample pending loan application\n";
    }
}

echo "\n=== Seed Complete ===\n";
echo "Admin: admin@loanpro.com / admin123\n";
echo "Borrowers: *@test.com / user123\n";
