<?php
require_once 'c:/xampp/htdocs/LMS_Web/Web_Dealers/backend/config/db.php';
try {
    $doc = $database->loan_applications->findOne();
    if ($doc) {
        foreach ($doc as $key => $val) {
            echo $key . ": " . gettype($val) . "\n";
            if (is_string($val)) echo "  Sample: " . $val . "\n";
        }
    } else {
        echo "No document found";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
