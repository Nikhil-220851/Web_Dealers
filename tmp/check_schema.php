<?php
require_once 'c:/xampp/htdocs/LMS_Web/Web_Dealers/backend/config/db.php';
try {
    $doc = $database->loan_applications->findOne();
    echo json_encode($doc, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
