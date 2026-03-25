<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid request data"]);
    exit;
}

$first_name = $data['first_name'] ?? '';
$last_name = $data['last_name'] ?? '';
$email = $data['email'] ?? '';
$phone = $data['phone'] ?? '';
$password = $data['password'] ?? '';

// Validation
if (empty($first_name) || empty($email) || empty($password)) {
    echo json_encode(["status" => "error", "message" => "Required fields missing"]);
    exit;
}

try {
    // Check if user exists
    $existing = $database->users->findOne(['email' => $email]);
    if ($existing) {
        echo json_encode(["status" => "error", "message" => "User with this email already exists"]);
        exit;
    }

    // Hash Password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // Insert User
    $insertResult = $database->users->insertOne([
        "first_name" => $first_name,
        "last_name" => $last_name,
        "email" => $email,
        "phone" => $phone,
        "password" => $hashedPassword,
        "role" => "borrower",
        "created_at" => new MongoDB\BSON\UTCDateTime()
    ]);

    if ($insertResult->getInsertedCount() > 0) {
        // Log Activity
        $database->activities->insertOne([
            "type" => "borrower_added",
            "title" => "Borrower Added",
            "description" => "New borrower $first_name $last_name registered",
            "reference_id" => $insertResult->getInsertedId(),
            "created_at" => new MongoDB\BSON\UTCDateTime()
        ]);

        echo json_encode(["status" => "success", "message" => "Borrower added successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to register borrower"]);
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
