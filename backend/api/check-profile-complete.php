<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';

$userId = trim($_GET['userId'] ?? '');
if (empty($userId)) {
    echo json_encode(["complete" => false, "missing" => ["userId"]]);
    exit();
}

try {
    $objectId = new MongoDB\BSON\ObjectId($userId);
    $user     = $database->users->findOne(['_id' => $objectId]);
    $bank     = $database->bank_details->findOne(['user_id' => $userId]);
    $kyc      = $database->kyc_details->findOne(['user_id'  => $userId]);

    $missing = [];

    if (!$user)                              $missing[] = 'user account';
    if (empty($user['phoneno'] ?? ''))       $missing[] = 'phone number';
    if (!$bank)                              $missing[] = 'bank details';
    if (!$kyc)                               $missing[] = 'KYC details';
    if (empty($kyc['pan_number']    ?? ''))  $missing[] = 'PAN number';
    if (empty($kyc['aadhaar_number']?? ''))  $missing[] = 'Aadhaar number';

    echo json_encode([
        "complete" => count($missing) === 0,
        "missing"  => $missing
    ]);

} catch (Exception $e) {
    echo json_encode(["complete" => false, "missing" => ["error: " . $e->getMessage()]]);
}
?>