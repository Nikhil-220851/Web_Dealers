<?php
$data = array(
    "firstname" => "Test",
    "lastname" => "Admin",
    "email" => "testadmin@loanpro.com",
    "phone" => "1234567890",
    "role" => "super",
    "password" => "password123"
);
$options = array(
    'http' => array(
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    )
);
$context  = stream_context_create($options);
$result = file_get_contents('http://localhost/loan/Loan_Management_System/backend/api/admin-signup.php', false, $context);
if ($result === FALSE) { 
    echo "Error\n"; 
}
var_dump($result);
?>
