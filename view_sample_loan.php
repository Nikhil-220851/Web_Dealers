<?php
require_once 'backend/config/db.php';
$loan = $database->loan_applications->findOne();
if ($loan) {
    foreach ($loan as $key => $value) {
        $type = gettype($value);
        if ($value instanceof MongoDB\BSON\UTCDateTime) {
            echo "$key: (UTCDateTime) " . $value->toDateTime()->format('Y-m-d H:i:s') . "\n";
        } elseif ($value instanceof MongoDB\BSON\ObjectId) {
            echo "$key: (ObjectId) " . (string)$value . "\n";
        } elseif (is_array($value) || is_object($value)) {
            echo "$key: " . json_encode($value) . "\n";
        } else {
            echo "$key: ($type) $value\n";
        }
    }
} else {
    echo "No loan found in loan_applications table.\n";
}
?>
