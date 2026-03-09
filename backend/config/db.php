<?php

require __DIR__ . '/../vendor/autoload.php';

$mongoUri = "mongodb+srv://teamadmin:loanpro007@cluster0.zm7nxmn.mongodb.net/Loan_Management_System";

try {
    $client = new MongoDB\Client($mongoUri);

    $database = $client->Loan_Management_System;

} catch (Exception $e) {
    die("Database connection failed: " . $e->getMessage());
}

?>