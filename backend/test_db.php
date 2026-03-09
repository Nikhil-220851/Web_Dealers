<?php
require 'config/db.php';
try {
    $client->selectDatabase('admin')->command(['ping' => 1]);
    echo "Connection Success\n";
} catch (Exception $e) {
    echo "Connection Error: " . $e->getMessage() . "\n";
}
