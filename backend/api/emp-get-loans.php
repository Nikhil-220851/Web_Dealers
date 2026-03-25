<?php
use MongoDB\BSON\UTCDateTime;
use MongoDB\BSON\ObjectId;

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

// Auth validation
if (empty($_SESSION['emp_id']) || $_SESSION['role'] !== 'bank_employee') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit();
}

$empId = $_SESSION['emp_id'];

try {
    // We get loans specifically assigned to this employee or unassigned ones.
    $query = [
        '$or' => [
            ['assigned_employee_id' => $empId],
            ['assigned_employee_id' => null]
        ]
    ];

    // Aggregation pipeline to join with users
    $pipeline = [
        ['$match' => $query],
        ['$sort' => ['created_at' => -1]],
        [
            '$addFields' => [
                'user_id_obj' => [
                    '$cond' => [
                        'if' => ['$eq' => [['$type' => '$user_id'], 'string']],
                        'then' => ['$toObjectId' => '$user_id'],
                        'else' => '$user_id'
                    ]
                ]
            ]
        ],
        [
            '$lookup' => [
                'from' => 'users',
                'localField' => 'user_id_obj',
                'foreignField' => '_id',
                'as' => 'borrower'
            ]
        ],
        [
            '$unwind' => [
                'path' => '$borrower',
                'preserveNullAndEmptyArrays' => true
            ]
        ],
        [
            '$addFields' => [
                'borrower_name_unified' => [
                    '$ifNull' => [
                        '$borrower.name',
                        [
                            '$concat' => [
                                ['$ifNull' => ['$borrower.firstname', '']],
                                ' ',
                                ['$ifNull' => ['$borrower.lastname', '']]
                            ]
                        ],
                        '$borrower_name',
                        'N/A'
                    ]
                ]
            ]
        ],
        [
            '$project' => [
                '_id' => 1,
                'borrower_name' => '$borrower_name_unified',
                'loan_amount' => ['$ifNull' => ['$loan_amount', '$amount', 0]],
                'status' => ['$ifNull' => ['$status', 'pending']],
                'employee_verification' => ['$ifNull' => ['$employee_verification', 'pending']]
            ]
        ]
    ];

    $cursor = $database->loan_applications->aggregate($pipeline);

    $loans = [];
    foreach ($cursor as $loan) {
        $loans[] = [
            '_id' => (string) $loan['_id'],
            'borrower_name' => $loan['borrower_name'],
            'loan_amount' => $loan['loan_amount'],
            'status' => $loan['status'],
            'employee_verification' => $loan['employee_verification']
        ];
    }

    echo json_encode([
        "status" => "success",
        "data"   => $loans
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}

?>
