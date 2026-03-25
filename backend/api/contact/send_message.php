<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require '../../vendor/autoload.php';
require '../../config/db.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$subject = trim($data['subject'] ?? '');
$message = trim($data['message'] ?? '');

// ✅ Validation
if (!$name || !$email || !$subject || !$message) {
    echo json_encode(["success" => false, "message" => "All fields required"]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email"]);
    exit();
}

// ✅ Save to MongoDB
try {
    $database->contact_messages->insertOne([
        "name" => $name,
        "email" => $email,
        "subject" => $subject,
        "message" => $message,
        "created_at" => new MongoDB\BSON\UTCDateTime(),
        "status" => "new"
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Database error"]);
    exit();
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;

 
    $mail->Username = 'loanpro008.support@gmail.com'; 
    $mail->Password = 'LoanPro'; 

    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;

    // Sender & Receiver
    $mail->setFrom('loanpro008.support@gmail.com', 'LoanPro Support');
    $mail->addAddress('loanpro008.support@gmail.com'); // admin mail
    $mail->addReplyTo($email, $name);

    // Email content
    $mail->isHTML(true);
    $mail->Subject = "New Contact Message - " . $subject;

    $mail->Body = "
        <h3>New Contact Message</h3>
        <p><b>Name:</b> $name</p>
        <p><b>Email:</b> $email</p>
        <p><b>Subject:</b> $subject</p>
        <p><b>Message:</b><br>$message</p>
    ";

    $mail->send();

    echo json_encode([
        "success" => true,
        "message" => "Message sent successfully"
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => true,
        "message" => "Saved but email failed"
    ]);
}
?>
