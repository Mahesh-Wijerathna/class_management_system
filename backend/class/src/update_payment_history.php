<?php
require_once __DIR__ . '/config.php';

try {
    // Get all enrollments
    $stmt = $conn->prepare("
        SELECT e.id, e.student_id, e.class_id, e.payment_status, e.amount_paid, e.payment_method
        FROM enrollments e
        WHERE e.payment_status = 'paid'
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $updatedCount = 0;
    
    while ($enrollment = $result->fetch_assoc()) {
        // Get financial records for this student and class
        $stmt2 = $conn->prepare("
            SELECT 
                transaction_id,
                date,
                amount,
                payment_method,
                reference_number,
                notes
            FROM financial_records 
            WHERE user_id = ? AND class_id = ? AND status = 'paid'
            ORDER BY date DESC
        ");
        $stmt2->bind_param("si", $enrollment['student_id'], $enrollment['class_id']);
        $stmt2->execute();
        $financialResult = $stmt2->get_result();
        
        $paymentHistory = [];
        while ($payment = $financialResult->fetch_assoc()) {
            $paymentHistory[] = [
                'date' => $payment['date'],
                'amount' => $payment['amount'],
                'method' => $payment['payment_method'],
                'status' => 'paid',
                'transactionId' => $payment['transaction_id'],
                'referenceNumber' => $payment['reference_number'],
                'notes' => $payment['notes']
            ];
        }
        
        if (!empty($paymentHistory)) {
            // Update enrollment with payment history
            $updateStmt = $conn->prepare("
                UPDATE enrollments 
                SET payment_history = ?
                WHERE id = ?
            ");
            $paymentHistoryJson = json_encode($paymentHistory);
            $updateStmt->bind_param("si", $paymentHistoryJson, $enrollment['id']);
            $updateStmt->execute();
            
            $updatedCount++;
            echo "Updated enrollment ID {$enrollment['id']} for student {$enrollment['student_id']} with " . count($paymentHistory) . " payment records\n";
        }
    }
    
    echo "\nTotal enrollments updated: $updatedCount\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>