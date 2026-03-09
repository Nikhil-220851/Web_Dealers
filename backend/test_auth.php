<?php
// Emulate frontend hitting register.php
echo "--- Testing Register ---\n";
$data = ['fullName' => 'Test User', 'email' => 'test2@example.com', 'password' => 'password123'];
$_SERVER['REQUEST_METHOD'] = 'POST';
$stream = fopen('php://memory', 'r+');
fwrite($stream, json_encode($data));
rewind($stream);
file_put_contents('php://input', stream_get_contents($stream));

ob_start();
require 'api/register.php';
$registerOut = ob_get_clean();
echo $registerOut . "\n";

echo "\n--- Testing Login ---\n";
$loginData = ['email' => 'test2@example.com', 'password' => 'password123'];
$_SERVER['REQUEST_METHOD'] = 'POST';
$stream2 = fopen('php://memory', 'r+');
fwrite($stream2, json_encode($loginData));
rewind($stream2);
file_put_contents('php://input', stream_get_contents($stream2));

ob_start();
require 'api/login.php';
$loginOut = ob_get_clean();
echo $loginOut . "\n";
