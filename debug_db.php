<?php
require_once 'backend/config/db.php';
header('Content-Type: text/plain');
try {
    echo "Database: " . $database->getDatabaseName() . "\n";
    $collections = $database->listCollections();
    foreach ($collections as $col) {
        echo " - " . $col->getName() . "\n";
        $count = $database->selectCollection($col->getName())->countDocuments();
        echo "   Count: $count\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
