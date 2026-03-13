<?php
// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once '../config/db.php';

// Check if admin is logged in
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

try {
    // Fetch all borrowers (users collection)
    $cursor = $database->users->find([], ['sort' => ['created_at' => -1]]);
    
    $borrowers = [];
    foreach ($cursor as $user) {
        $userIdstr = (string) $user['_id'];
        
        // Count total loans for this user
        $totalLoans = $database->loan_applications->countDocuments(['user_id' => $userIdstr]);
        
        // Fetch kyc status, user data might have nested 'kyc' object or we can check via another collection if applicable
        // Assume users collection has a 'kyc_status' or we check if bank details / kyc details exist
        $kycStatus = $user['kyc_status'] ?? 'Pending';
        
        $borrowers[] = [
            'id' => $userIdstr,
            'name' => trim(($user['firstname'] ?? '') . ' ' . ($user['lastname'] ?? '')),
            'email' => $user['email'] ?? '',
            'phone' => $user['phoneno'] ?? '',
            'created_at' => $user['created_at'] ?? '',
            'kyc_status' => $kycStatus,
            'total_loans' => $totalLoans
        ];
    }

    http_response_code(200);
    echo json_encode(["status" => "success", "data" => $borrowers]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
