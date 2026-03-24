<?php
require_once 'backend/config/db.php';
$payment = $database->{'payment-history'}->findOne();
if ($payment) {
    foreach ($payment as $key => $value) {
        $type = gettype($value);
        if ($value instanceof MongoDB\BSON\UTCDateTime) {
            echo "$key: (UTCDateTime) " . $value->toDateTime()->format('Y-m-d H:i:s') . "\n";
        } elseif ($value instanceof MongoDB\BSON\ObjectId) {
            echo "$key: (ObjectId) " . (string)$value . "\n";
        } else {
            echo "$key: ($type) " . json_encode($value) . "\n";
        }
    }
} else {
    echo "No payment found in payment-history table.\n";
}
?>
