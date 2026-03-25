<?php
require_once '../config/db.php';

header("Content-Type: application/json");

try {
    // 1. Fetch all notifications that might need a remarks update
    // We'll process all notifications to ensure the 'message' is also correctly formatted
    $cursor = $database->notifications->find([]);
    
    $updatedCount = 0;
    $errorsCount = 0;
    
    foreach ($cursor as $notif) {
        $notifId = $notif['_id'];
        $loanId = $notif['loan_id'] ?? '';
        $type = $notif['type'] ?? '';
        
        // Only process approval/rejection notifications as per requirement
        if (!in_array($type, ['approval', 'rejection'])) {
            continue;
        }

        $remarks = 'None';
        
        if (!empty($loanId)) {
            try {
                // Find corresponding loan application
                $loanApp = $database->loan_applications->findOne(['_id' => new MongoDB\BSON\ObjectId($loanId)]);
                if ($loanApp && !empty($loanApp['remarks'])) {
                    $remarks = $loanApp['remarks'];
                }
            } catch (Exception $e) {
                // Ignore invalid ObjectId or missing loan
            }
        }

        // Reconstruct the message to include the remarks
        // We'll try to preserve the original amount if possible, but if not we'll use a generic message
        $originalMessage = $notif['message'] ?? '';
        
        // Check if message already ends with "Remarks: "
        if (strpos($originalMessage, "Remarks:") === false) {
            $newMessage = $originalMessage . "\nRemarks: " . $remarks;
        } else {
            // If it already has remarks, we'll update them if they were "None" but we found actual ones
            if (strpos($originalMessage, "Remarks: None") !== false && $remarks !== 'None') {
                $newMessage = str_replace("Remarks: None", "Remarks: " . $remarks, $originalMessage);
            } else {
                $newMessage = $originalMessage;
            }
        }

        $database->notifications->updateOne(
            ['_id' => $notifId],
            ['$set' => [
                'remarks' => $remarks,
                'message' => $newMessage
            ]]
        );
        $updatedCount++;
    }
    
    echo json_encode([
        "status" => "success",
        "message" => "Refined migration completed successfully",
        "total_processed" => $updatedCount,
        "errors" => $errorsCount
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Refined migration failed: " . $e->getMessage()
    ]);
}
?>
