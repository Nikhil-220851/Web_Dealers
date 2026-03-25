<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/db.php';

$data  = json_decode(file_get_contents("php://input"), true);
$name  = trim($data['name']  ?? '');
$email = trim($data['email'] ?? '');
$photo = trim($data['photo'] ?? '');

if (empty($email)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email is required"]);
    exit();
}

try {
    // Check if user already exists
    $existing = $database->users->findOne(['email' => $email]);

    if ($existing) {
        // Existing user — just return their _id
        $userId = (string) $existing['_id'];
    } else {
        // New Google user — split name into first/last
        $nameParts = explode(' ', $name, 2);
        $result = $database->users->insertOne([
            'firstname'  => $nameParts[0] ?? $name,
            'lastname'   => $nameParts[1] ?? '',
            'email'      => $email,
            'phoneno'    => '',
            'photo'      => $photo,
            'provider'   => 'google',
            'createdAt'  => new MongoDB\BSON\UTCDateTime()
        ]);
        $userId = (string) $result->getInsertedId();
    }

    echo json_encode([
        "status"    => "success",
        "userId"    => $userId,
        "firstname" => $existing['firstname'] ?? (explode(' ', $name, 2)[0] ?? $name),
        "lastname"  => $existing['lastname']  ?? (explode(' ', $name, 2)[1] ?? ''),
        "email"     => $email,
        "photo"     => $photo
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
