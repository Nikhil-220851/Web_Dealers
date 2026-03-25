<?php
use MongoDB\BSON\UTCDateTime;
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once '../config/db.php';

// 1. Security Check
if (empty($_SESSION['loan_agent_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized: Please login."]);
    exit();
}

if (($_SESSION['role'] ?? '') !== 'loan_agent') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access Denied: Agent role required."]);
    exit();
}

$agentId = $_SESSION['loan_agent_id'];

// 2. Parameters (Search & Filter)
$search = $_GET['search'] ?? '';
$status = $_GET['status'] ?? '';

try {
    // 3. Build Aggregation Pipeline
    $pipeline = [];

    // Match assigned agent
    $match = ['assigned_agent_id' => $agentId];

    // Filter by status if provided
    if (!empty($status) && $status !== 'All') {
        $match['status'] = strtolower($status);
    }

    $pipeline[] = ['$match' => $match];

    // Convert borrower_id (string) to ObjectId for lookup
    $pipeline[] = [
        '$addFields' => [
            'borrower_oid' => [
                '$cond' => [
                    'if' => ['$eq' => [['$type' => '$borrower_id'], 'string']],
                    'then' => ['$toObjectId' => '$borrower_id'],
                    'else' => '$borrower_id'
                ]
            ]
        ]
    ];

    // Lookup borrower info from users collection
    $pipeline[] = [
        '$lookup' => [
            'from'         => 'users',
            'localField'   => 'borrower_oid',
            'foreignField' => '_id',
            'as'           => 'borrower_info'
        ]
    ];

    // Unwind borrower info
    $pipeline[] = [
        '$unwind' => [
            'path' => '$borrower_info',
            'preserveNullAndEmptyArrays' => true
        ]
    ];

    // Search filter (Name or Phone)
    if (!empty($search)) {
        $pipeline[] = [
            '$match' => [
                '$or' => [
                    ['borrower_info.name' => ['$regex' => $search, '$options' => 'i']],
                    ['borrower_info.phone' => ['$regex' => $search, '$options' => 'i']],
                    ['borrower_name' => ['$regex' => $search, '$options' => 'i']]
                ]
            ]
        ];
    }

    // Sort by Date DESC
    $pipeline[] = ['$sort' => ['applied_date' => -1]];

    // Project final fields
    $pipeline[] = [
        '$project' => [
            '_id'           => 1,
            'loan_amount'   => 1,
            'status'        => 1,
            'applied_date'  => 1,
            'borrower_id'   => 1,
            'borrower_name' => [
                '$ifNull' => ['$borrower_info.name', '$borrower_name']
            ],
            'borrower_phone'=> [
                '$ifNull' => ['$borrower_info.phone', 'N/A']
            ],
            'borrower_email'=> [
                '$ifNull' => ['$borrower_info.email', 'N/A']
            ]
        ]
    ];

    // Limit for performance
    $pipeline[] = ['$limit' => 50];

    $results = $database->loan_applications->aggregate($pipeline)->toArray();

    // Format output
    $data = [];
    foreach ($results as $row) {
        $appliedDate = $row['applied_date'];
        $formattedDate = 'N/A';
        if ($appliedDate instanceof MongoDB\BSON\UTCDateTime) {
            $formattedDate = $appliedDate->toDateTime()->format('d M Y, h:i A');
        }

        $data[] = [
            'loan_id'        => (string) $row['_id'],
            'borrower_id'    => $row['borrower_id'],
            'customer_name'  => $row['borrower_name'],
            'phone'          => $row['borrower_phone'],
            'email'          => $row['borrower_email'],
            'loan_amount'    => (float) ($row['loan_amount'] ?? 0),
            'status'         => strtoupper($row['status'] ?? 'PENDING'),
            'date'           => $formattedDate
        ];
    }

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data"   => $data
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
