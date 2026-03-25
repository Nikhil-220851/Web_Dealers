<?php
require_once 'c:/xampp/htdocs/LMS_Web/Web_Dealers/backend/config/db.php';
try {
    $cursor = $database->loan_applications->find();
    $counts = 0;
    foreach ($cursor as $doc) {
        $uid = $doc['user_id'] ?? 'MISSING';
        $type = gettype($uid);
        if ($uid instanceof MongoDB\BSON\ObjectId) $type = "ObjectId";
        echo "id: " . $doc['_id'] . " | user_id: " . $uid . " | type: " . $type . "\n";
        $counts++;
        if ($counts > 5) break;
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
