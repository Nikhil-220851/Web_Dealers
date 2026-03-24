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
    // 1. Loans by type
    $typePipeline = [
        ['$group' => ['_id' => '$loan_type', 'count' => ['$sum' => 1]]]
    ];
    $typeResult = $database->loan_applications->aggregate($typePipeline)->toArray();
    
    $loansByType = ['labels' => [], 'data' => []];
    foreach($typeResult as $row) {
        $type = $row['_id'] ? $row['_id'] : 'Unknown';
        $loansByType['labels'][] = ucfirst($type);
        $loansByType['data'][] = $row['count'];
    }

    // 2. Loans by status
    $statusPipeline = [
        ['$group' => ['_id' => '$status', 'count' => ['$sum' => 1]]]
    ];
    $statusResult = $database->loan_applications->aggregate($statusPipeline)->toArray();
    
    $loansByStatus = ['labels' => [], 'data' => []];
    foreach($statusResult as $row) {
        $status = $row['_id'] ? $row['_id'] : 'pending';
        $loansByStatus['labels'][] = ucfirst($status);
        $loansByStatus['data'][] = $row['count'];
    }

    // 3. Applications by month (Simplified, counting all for now grouping by substring of date if stored as string, or by month if Date)
    // Assuming application_date is stored as ISO string "YYYY-MM-DDTHH:mm:ss"
    $monthPipeline = [
        ['$project' => ['month' => ['$substr' => ['$application_date', 0, 7]]]],
        ['$group' => ['_id' => '$month', 'count' => ['$sum' => 1]]],
        ['$sort' => ['_id' => 1]]
    ];
    $monthResult = $database->loan_applications->aggregate($monthPipeline)->toArray();
    
    $loansByMonth = ['labels' => [], 'data' => []];
    foreach($monthResult as $row) {
        if ($row['_id']) {
            // convert YYYY-MM to readable month (e.g. "Mar 2026")
            $dateObj = DateTime::createFromFormat('Y-m', $row['_id']);
            $label = $dateObj ? $dateObj->format('M Y') : $row['_id'];
            $loansByMonth['labels'][] = $label;
            $loansByMonth['data'][] = $row['count'];
        }
    }

    $analytics = [
        "loansByType" => $loansByType,
        "loansByStatus" => $loansByStatus,
        "loansByMonth" => $loansByMonth
    ];

    http_response_code(200);
    echo json_encode(["status" => "success", "data" => $analytics]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
