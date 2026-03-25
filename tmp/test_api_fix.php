<?php
$_GET['userId'] = '69b0182c6af20da9f90db022';
$_SERVER['REQUEST_METHOD'] = 'GET';
ob_start();
require_once 'c:/xampp/htdocs/LMS_Web/Web_Dealers/backend/api/get-user-loans.php';
$output = ob_get_clean();
echo $output;
?>
