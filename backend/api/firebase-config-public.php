<?php
header("Content-Type: application/json; charset=UTF-8");

// .env is at ROOT of project, so go up TWO levels from backend/api/
$envPath = __DIR__ . '/../../.env';

if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        [$key, $value] = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

echo json_encode([
    "apiKey"            => $_ENV['FIREBASE_API_KEY']             ?? '',
    "authDomain"        => $_ENV['FIREBASE_AUTH_DOMAIN']         ?? '',
    "projectId"         => $_ENV['FIREBASE_PROJECT_ID']          ?? '',
    "storageBucket"     => $_ENV['FIREBASE_STORAGE_BUCKET']      ?? '',
    "messagingSenderId" => $_ENV['FIREBASE_MESSAGING_SENDER_ID'] ?? '',
    "appId"             => $_ENV['FIREBASE_APP_ID']              ?? ''
]);
?>