<?php
require_once 'backend/config/db.php';
try {
    echo "Database: " . $database->getDatabaseName() . "\n";
    echo "Collections:\n";
    foreach ($database->listCollections() as $collectionInfo) {
        echo "- " . $collectionInfo->getName() . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
