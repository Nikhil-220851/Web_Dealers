<?php
require_once 'c:/xampp/htdocs/LMS_Web/Web_Dealers/backend/config/db.php';
try {
    $doc = $database->loan_applications->findOne();
    if ($doc) {
        $data = (array)$doc;
        print_r(array_keys($data));
    } else {
        echo "No document found";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
