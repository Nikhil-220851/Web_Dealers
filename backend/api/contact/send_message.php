<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$subject = trim($data['subject'] ?? '');
$message = trim($data['message'] ?? '');

// Validation
if (empty($name) || empty($email) || empty($subject) || empty($message)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid email format"]);
    exit();
}

if (strlen($message) < 10) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Message must be at least 10 characters long"]);
    exit();
}

// Security: Strip HTML tags and limit length
$message = strip_tags($message);
if (strlen($message) > 1000) {
    $message = substr($message, 0, 1000);
}

try {
    // 1. Save to Database
    $doc = [
        "name" => $name,
        "email" => $email,
        "subject" => $subject,
        "message" => $message,
        "created_at" => new MongoDB\BSON\UTCDateTime(),
        "status" => "new"
    ];

    $result = $database->contact_messages->insertOne($doc);

    // 2. Send Email
    $mail_to = "supportloanpro007@gmail.com";
    $email_subject = "[LoanPro Support Request] " . $subject;
    
    $timestamp = date("Y-m-d H:i:s");
    
    $email_body = "---" . "\r\n\r\n";
    $email_body .= "## New Contact Request - LoanPro" . "\r\n\r\n";
    $email_body .= "Name:" . "\r\n" . $name . "\r\n\r\n";
    $email_body .= "Email:" . "\r\n" . $email . "\r\n\r\n";
    $email_body .= "Subject:" . "\r\n" . $subject . "\r\n\r\n";
    $email_body .= "Message:" . "\r\n" . $message . "\r\n\r\n";
    $email_body .= "---" . "\r\n\r\n";
    $email_body .= "Sent From:" . "\r\n" . "LoanPro Borrower Dashboard" . "\r\n";
    $email_body .= "Time:" . "\r\n" . $timestamp . "\r\n";
    $email_body .= "---------------------";

    $headers = "From: LoanPro Support System <noreply@loanpro.com>\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    $mail_sent = mail($mail_to, $email_subject, $email_body, $headers);

    if ($result->getInsertedCount() > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Message sent successfully",
            "db_id" => (string)$result->getInsertedId(),
            "email_sent" => $mail_sent
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to save message to database"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
