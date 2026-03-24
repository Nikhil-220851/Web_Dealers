<?php

require __DIR__ . '/../vendor/autoload.php';

// Load environment variables from .env file
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $env = parse_ini_file($envFile);
    foreach ($env as $key => $value) {
        $_ENV[$key] = $value;
    }
}

$mongoUri = $_ENV['MONGODB_URI'] ?? 'mongodb+srv://localhost:27017/test';

try {
    $client = new MongoDB\Client($mongoUri);

    $dbName   = $_ENV['MONGO_DB'] ?? 'Loan_Management_System';
    $database = $client->selectDatabase($dbName);

} catch (Exception $e) {
    die("Database connection failed: " . $e->getMessage());
}

?>