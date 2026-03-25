<?php
require_once 'c:/xampp/htdocs/LMS_Web/Web_Dealers/backend/config/db.php';
try {
    $cursor = $database->loan_applications->find(['status' => 'closed']);
    foreach ($cursor as $doc) {
        echo "id: " . $doc['_id'] . " | user_id: " . ($doc['user_id'] ?? 'MISSING') . " | borrower_id: " . ($doc['borrower_id'] ?? 'MISSING') . "\n";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
