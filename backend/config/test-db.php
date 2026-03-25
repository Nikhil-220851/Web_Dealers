```php
<?php
require 'db.php';
$client = new MongoDB\Client("mongodb://localhost:27017");
$database = $client->lms_db;
$apps = $database->loan_applications->find()->toArray();
echo "Found " . count($apps) . " applications.\n";
foreach ($apps as $app) {
    echo "ID: " . $app['_id'] . "\n";
    echo "Status: " . ($app['status'] ?? 'N/A') . "\n";
    if (isset($app['application_date'])) {
        echo "application_date: " . json_encode($app['application_date']) . "\n";
        echo "Type of application_date: " . gettype($app['application_date']) . "\n";
        if (is_object($app['application_date'])) {
            echo "Class: " . get_class($app['application_date']) . "\n";
        }
    }
    if (isset($app['applied_date'])) {
        echo "applied_date: " . json_encode($app['applied_date']) . "\n";
        echo "Type of applied_date: " . gettype($app['applied_date']) . "\n";
        if (is_object($app['applied_date'])) {
            echo "Class: " . get_class($app['applied_date']) . "\n";
        }
    }
    echo "-------------------------\n";
}
?>