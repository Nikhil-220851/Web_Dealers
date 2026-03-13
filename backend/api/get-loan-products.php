<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/db.php';

try {
    // Auto-seed if empty
    if ($database->loan_products->countDocuments() === 0) {
        $seed = [
            ["loan_type"=>"Personal Loan","bank_name"=>"HDFC Bank","interest_rate"=>10.5,"max_amount"=>2000000,"min_amount"=>50000,"processing_fee"=>2,"tenure"=>60,"min_salary"=>25000,"credit_score"=>700,"employment_type"=>"Salaried"],
            ["loan_type"=>"Home Loan","bank_name"=>"HDFC Bank","interest_rate"=>8.4,"max_amount"=>7500000,"min_amount"=>1000000,"processing_fee"=>1.5,"tenure"=>240,"min_salary"=>40000,"credit_score"=>720,"employment_type"=>"Salaried / Self-Employed"],
            ["loan_type"=>"Car Loan","bank_name"=>"HDFC Bank","interest_rate"=>9.2,"max_amount"=>3000000,"min_amount"=>100000,"processing_fee"=>1.2,"tenure"=>84,"min_salary"=>20000,"credit_score"=>680,"employment_type"=>"Salaried"],
            ["loan_type"=>"Personal Loan","bank_name"=>"State Bank of India","interest_rate"=>10.1,"max_amount"=>1500000,"min_amount"=>50000,"processing_fee"=>1.5,"tenure"=>60,"min_salary"=>20000,"credit_score"=>685,"employment_type"=>"Salaried"],
            ["loan_type"=>"Home Loan","bank_name"=>"State Bank of India","interest_rate"=>8.3,"max_amount"=>10000000,"min_amount"=>500000,"processing_fee"=>1,"tenure"=>300,"min_salary"=>35000,"credit_score"=>700,"employment_type"=>"Salaried / Self-Employed"],
            ["loan_type"=>"Personal Loan","bank_name"=>"ICICI Bank","interest_rate"=>10.8,"max_amount"=>2500000,"min_amount"=>75000,"processing_fee"=>2,"tenure"=>60,"min_salary"=>30000,"credit_score"=>720,"employment_type"=>"Salaried"],
            ["loan_type"=>"Home Loan","bank_name"=>"ICICI Bank","interest_rate"=>8.5,"max_amount"=>8000000,"min_amount"=>1000000,"processing_fee"=>1.5,"tenure"=>240,"min_salary"=>45000,"credit_score"=>730,"employment_type"=>"Salaried / Self-Employed"],
            ["loan_type"=>"Personal Loan","bank_name"=>"Axis Bank","interest_rate"=>10.9,"max_amount"=>2000000,"min_amount"=>50000,"processing_fee"=>2,"tenure"=>60,"min_salary"=>25000,"credit_score"=>700,"employment_type"=>"Salaried"],
            ["loan_type"=>"Home Loan","bank_name"=>"Axis Bank","interest_rate"=>8.6,"max_amount"=>7500000,"min_amount"=>500000,"processing_fee"=>1.5,"tenure"=>240,"min_salary"=>40000,"credit_score"=>720,"employment_type"=>"Salaried / Self-Employed"],
            ["loan_type"=>"Personal Loan","bank_name"=>"Kotak Mahindra Bank","interest_rate"=>11,"max_amount"=>1500000,"min_amount"=>50000,"processing_fee"=>2,"tenure"=>60,"min_salary"=>22000,"credit_score"=>695,"employment_type"=>"Salaried"],
        ];
        $database->loan_products->insertMany($seed);
    }

    $query = [];
    if (!empty($_GET['loanType']) && $_GET['loanType'] !== 'All Types') {
        $query['loan_type'] = $_GET['loanType'];
    }
    if (!empty($_GET['bankName']) && $_GET['bankName'] !== 'All Banks') {
        $query['bank_name'] = $_GET['bankName'];
    }

    $cursor = $database->loan_products->find($query, ['sort' => ['interest_rate' => 1]]);

    $loans = [];
    foreach ($cursor as $doc) {
        $loans[] = [
            'id'              => (string) $doc['_id'],
            'loan_type'       => $doc['loan_type'],
            'bank_name'       => $doc['bank_name'],
            'interest_rate'   => $doc['interest_rate'],
            'max_amount'      => $doc['max_amount'],
            'min_amount'      => $doc['min_amount']      ?? 0,
            'processing_fee'  => $doc['processing_fee'],
            'tenure'          => $doc['tenure']          ?? 0,
            'min_salary'      => $doc['min_salary']      ?? 0,
            'credit_score'    => $doc['credit_score']    ?? 0,
            'employment_type' => $doc['employment_type'] ?? '',
        ];
    }

    echo json_encode(["status" => "success", "data" => $loans]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
