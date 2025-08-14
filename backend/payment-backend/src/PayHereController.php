<?php

class PayHereController {
    private $db;
    private $merchantId = "1231482"; // Your PayHere merchant ID
    private $merchantSecret = "MTE3MTY5MDMwNjMzMzMyMDgwNDYzNzAxOTQxNDA5MTI1NTA3OTgwOA=="; // Your PayHere merchant secret

    public function __construct($mysqli) {
        $this->db = $mysqli;
    }

    public function createPayHerePayment($data) {
        try {
            // Save payment data to database
            $query = "INSERT INTO payments SET 
                      order_id = ?,
                      amount = ?,
                      currency = ?,
                      first_name = ?,
                      last_name = ?,
                      email = ?,
                      phone = ?,
                      address = ?,
                      city = ?,
                      country = ?,
                      status = 'pending',
                      payment_method = 'payhere',
                      created_at = NOW()";

            $stmt = $this->db->prepare($query);
            
            // Bind values
            $stmt->bind_param("sdssssssss", 
                $data['order_id'],
                $data['amount'],
                $data['currency'],
                $data['first_name'],
                $data['last_name'],
                $data['email'],
                $data['phone'],
                $data['address'],
                $data['city'],
                $data['country']
            );

            if($stmt->execute()) {
                // Generate PayHere payment request
                $hash = strtoupper(
                    md5(
                        $this->merchantId . 
                        $data['order_id'] . 
                        number_format($data['amount'], 2, '.', '') . 
                        $data['currency'] . 
                        strtoupper(md5($this->merchantSecret))
                    ));

                $paymentData = [
                    'merchant_id' => $this->merchantId,
                    'return_url' => 'http://localhost:3000/student/payment-success',
                    'cancel_url' => 'http://localhost:3000/student/payment-cancel',
                    'notify_url' => 'http://localhost:8087/routes.php/payhere_notify',
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'address' => $data['address'],
                    'city' => $data['city'],
                    'country' => $data['country'],
                    'order_id' => $data['order_id'],
                    'items' => $data['items'],
                    'currency' => $data['currency'],
                    'amount' => number_format($data['amount'], 2, '.', ''),
                    'hash' => $hash
                ];

                return [
                    'success' => true,
                    'data' => $paymentData,
                    'message' => 'Payment created successfully'
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to create payment record'
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }

    public function handlePayHereNotification($data) {
        try {
            // Verify the payment
            $localHash = strtoupper(
                md5(
                    $data['merchant_id'] .
                    $data['order_id'] .
                    $data['payhere_amount'] .
                    $data['payhere_currency'] .
                    $data['status_code'] .
                    strtoupper(md5($this->merchantSecret))
                )
            );

            if($localHash != $data['md5sig']) {
                return ['status' => 'error', 'message' => 'Invalid hash'];
            }

            // Check if payment is successful (status_code 2 = success)
            if($data['status_code'] == '2') {
                // Update payments table
                $updatePayments = "UPDATE payments SET 
                                  status = 'completed', 
                                  updated_at = NOW(),
                                  payhere_payment_id = ?,
                                  payhere_status_code = ?
                                  WHERE order_id = ?";
                
                $stmt = $this->db->prepare($updatePayments);
                $stmt->bind_param("sss", 
                    $data['payment_id'],
                    $data['status_code'],
                    $data['order_id']
                );
                $stmt->execute();

                // Update financial_records table
                $updateFinancial = "UPDATE financial_records SET 
                                   status = 'paid', 
                                   payment_method = 'payhere',
                                   reference_number = CONCAT('PAY', UNIX_TIMESTAMP()),
                                   updated_at = NOW()
                                   WHERE transaction_id = ?";
                
                $stmt = $this->db->prepare($updateFinancial);
                $stmt->bind_param("s", $data['order_id']);
                $stmt->execute();

                // Process the payment to create enrollment automatically
                require_once __DIR__ . '/PaymentController.php';
                $paymentController = new PaymentController($this->db);
                $processResult = $paymentController->processPayment($data['order_id'], [
                    'status' => 'paid',
                    'paymentMethod' => 'payhere',
                    'referenceNumber' => 'PAY' . time(),
                    'notes' => 'PayHere payment confirmed'
                ]);
                
                // Log the processing result
                error_log("PayHere notification - Payment processing result: " . json_encode($processResult));

                return ['status' => 'success', 'message' => 'Payment completed successfully'];
            } else {
                // Payment failed or cancelled
                $updatePayments = "UPDATE payments SET 
                                  status = 'failed', 
                                  updated_at = NOW(),
                                  payhere_payment_id = ?,
                                  payhere_status_code = ?
                                  WHERE order_id = ?";
                
                $stmt = $this->db->prepare($updatePayments);
                $stmt->bind_param("sss", 
                    $data['payment_id'],
                    $data['status_code'],
                    $data['order_id']
                );
                $stmt->execute();

                return ['status' => 'error', 'message' => 'Payment failed or cancelled'];
            }

        } catch (Exception $e) {
            return ['status' => 'error', 'message' => 'Error: ' . $e->getMessage()];
        }
    }

    public function getPaymentStatus($orderId) {
        try {
            // First check the payments table (for PayHere payments)
            $query = "SELECT * FROM payments WHERE order_id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("s", $orderId);
            $stmt->execute();
            
            $result = $stmt->get_result();
            $payment = $result->fetch_assoc();
            
            if ($payment) {
                // Also check financial_records table for additional info
                $query2 = "SELECT * FROM financial_records WHERE transaction_id = ?";
                $stmt2 = $this->db->prepare($query2);
                $stmt2->bind_param("s", $orderId);
                $stmt2->execute();
                
                $result2 = $stmt2->get_result();
                $financial = $result2->fetch_assoc(); // Fixed: use $result2 instead of $stmt2->get_result()
                
                // Merge the data, prioritizing financial_records status
                if ($financial) {
                    $payment['status'] = $financial['status']; // Use financial_records status
                    $payment['payment_method'] = $financial['payment_method'];
                    $payment['class_id'] = $financial['class_id'];
                    $payment['class_name'] = $financial['class_name'];
                    $payment['notes'] = $financial['notes']; // Include notes for discount info
                }
                
                return $payment;
            }
            
            // If not found in payments table, check financial_records table (for development payments)
            $query3 = "SELECT * FROM financial_records WHERE transaction_id = ?";
            $stmt3 = $this->db->prepare($query3);
            $stmt3->bind_param("s", $orderId);
            $stmt3->execute();
            
            $result3 = $stmt3->get_result();
            $financialPayment = $result3->fetch_assoc();
            
            if ($financialPayment) {
                // Convert financial_records format to match payments table format
                $payment = [
                    'order_id' => $financialPayment['transaction_id'],
                    'amount' => $financialPayment['amount'],
                    'status' => $financialPayment['status'],
                    'payment_method' => $financialPayment['payment_method'],
                    'reference_number' => $financialPayment['reference_number'],
                    'class_id' => $financialPayment['class_id'],
                    'class_name' => $financialPayment['class_name'],
                    'notes' => $financialPayment['notes'],
                    'created_at' => $financialPayment['created_at'],
                    'updated_at' => $financialPayment['updated_at']
                ];
                
                return $payment;
            }
            
            return false;
        } catch (Exception $e) {
            error_log("PAYMENT_STATUS_ERROR: Order $orderId - " . $e->getMessage());
            return false;
        }
    }
}
?> 