<?php
require_once 'c:/xampp/htdocs/LMS_Web/Web_Dealers/backend/config/db.php';
try {
    $cursor = $database->loan_applications->find();
    $statuses = [];
    foreach ($cursor as $doc) {
        $st = $doc['status'] ?? 'NULL';
        $statuses[$st] = ($statuses[$st] ?? 0) + 1;
    }
    echo json_encode($statuses, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
