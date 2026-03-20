<?php
// Mock session for CLI
session_start();
$_SESSION['admin_id'] = 'mock_admin_id';

// Include the API file
// Note: We need to capture the output because the API calls echo/exit
ob_start();
include 'backend/api/admin-analytics-data.php';
$output = ob_get_clean();

echo "API Output:\n";
echo $output;
?>
