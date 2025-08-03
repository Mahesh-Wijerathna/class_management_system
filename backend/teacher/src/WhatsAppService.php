<?php

// Check if Twilio is available, if not, we'll use alternative methods
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
    if (class_exists('Twilio\Rest\Client')) {
        // Twilio is available, we can use it
    }
}

class WhatsAppService {
    private $accessToken;
    private $phoneNumberId;
    private $apiVersion = 'v17.0';
    private $config;
    private $twilioClient;
    
    public function __construct($accessToken = null, $phoneNumberId = null) {
        $this->config = include __DIR__ . '/whatsapp_config.php';
        
        $this->accessToken = $accessToken ?: $this->config['whatsapp']['access_token'];
        $this->phoneNumberId = $phoneNumberId ?: $this->config['whatsapp']['phone_number_id'];
        $this->apiVersion = $this->config['whatsapp']['api_version'];
        
        // Initialize Twilio client only if available
        $twilioConfig = $this->config['alternatives']['twilio'];
        if ($twilioConfig['enabled'] && $twilioConfig['account_sid'] !== 'YOUR_TWILIO_ACCOUNT_SID' && class_exists('Twilio\Rest\Client')) {
            $this->twilioClient = new \Twilio\Rest\Client($twilioConfig['account_sid'], $twilioConfig['auth_token']);
        }
    }
    
    /**
     * Send teacher login credentials via WhatsApp
     */
    public function sendTeacherCredentials($mobile, $teacherId, $teacherName, $password) {
        // Check if Twilio is enabled and configured
        $twilioConfig = $this->config['alternatives']['twilio'];
        
        if ($twilioConfig['enabled'] && $twilioConfig['account_sid'] !== 'YOUR_TWILIO_ACCOUNT_SID' && $this->twilioClient) {
            // Use Twilio WhatsApp (easier setup)
            return $this->sendViaTwilio($mobile, $teacherId, $teacherName, $password);
        }
        
        // Fallback to WhatsApp Business API
        return $this->sendViaWhatsAppBusiness($mobile, $teacherId, $teacherName, $password);
    }
    
    /**
     * Send via WhatsApp Business API
     */
    private function sendViaWhatsAppBusiness($mobile, $teacherId, $teacherName, $password) {
        $apiUrl = "https://graph.facebook.com/{$this->apiVersion}/{$this->phoneNumberId}/messages";
        
        $message = "🎓 *TCMS Teacher Account Created*\n\n";
        $message .= "Dear *{$teacherName}*,\n\n";
        $message .= "Your teacher account has been successfully created.\n\n";
        $message .= "📋 *Login Credentials:*\n";
        $message .= "• Teacher ID: *{$teacherId}*\n";
        $message .= "• Password: *{$password}*\n\n";
        $message .= "🔐 *Security Note:*\n";
        $message .= "Please change your password after your first login for security.\n\n";
        $message .= "🌐 *Login URL:*\n";
        $message .= "http://localhost:3000/login\n\n";
        $message .= "If you have any questions, please contact the administrator.\n\n";
        $message .= "Best regards,\nTCMS Team";
        
        $data = [
            'messaging_product' => 'whatsapp',
            'to' => $this->formatPhoneNumber($mobile),
            'type' => 'text',
            'text' => [
                'body' => $message
            ]
        ];
        
        return $this->makeApiCall($apiUrl, $data);
    }
    
    /**
     * Send via Twilio WhatsApp (Alternative)
     */
    private function sendViaTwilio($mobile, $teacherId, $teacherName, $password) {
        $twilioConfig = $this->config['alternatives']['twilio'];
        
        if (!$this->twilioClient) {
            return ['success' => false, 'message' => 'Twilio client not initialized'];
        }
        
        try {
            // Format the phone number for WhatsApp
            $whatsappNumber = 'whatsapp:' . $this->formatPhoneNumber($mobile);
            
            $message = "🎓 TCMS Teacher Account Created\n\n";
            $message .= "Dear {$teacherName},\n\n";
            $message .= "Your teacher account has been successfully created.\n\n";
            $message .= "📋 Login Credentials:\n";
            $message .= "• Teacher ID: {$teacherId}\n";
            $message .= "• Password: {$password}\n\n";
            $message .= "🔐 Security Note:\n";
            $message .= "Please change your password after your first login for security.\n\n";
            $message .= "🌐 Login URL:\n";
            $message .= "http://localhost:3000/login\n\n";
            $message .= "If you have any questions, please contact the administrator.\n\n";
            $message .= "Best regards,\nTCMS Team";
            
            // Create the message using Twilio SDK
            $twilioMessage = $this->twilioClient->messages
                ->create($whatsappNumber, // to
                    array(
                        "from" => $twilioConfig['whatsapp_from'],
                        "body" => $message
                    )
                );
            
            return [
                'success' => true, 
                'message' => 'Teacher credentials sent via WhatsApp (Twilio)',
                'message_sid' => $twilioMessage->sid
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false, 
                'message' => 'Twilio API error: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Format phone number for WhatsApp API
     */
    private function formatPhoneNumber($mobile) {
        // Remove any non-digit characters
        $mobile = preg_replace('/[^0-9]/', '', $mobile);
        
        // For Sri Lankan mobile numbers:
        // If it's 10 digits and starts with 07, convert to 947 format
        if (strlen($mobile) === 10 && substr($mobile, 0, 2) === '07') {
            return '94' . substr($mobile, 1);
        }
        
        // If it's 9 digits and starts with 0, convert to 94 format
        if (strlen($mobile) === 9 && substr($mobile, 0, 1) === '0') {
            return '94' . substr($mobile, 1);
        }
        
        // If it's already 11 digits and starts with 94, it's correct
        if (strlen($mobile) === 11 && substr($mobile, 0, 2) === '94') {
            return $mobile;
        }
        
        // If it's 10 digits and starts with 7, add 94
        if (strlen($mobile) === 10 && substr($mobile, 0, 1) === '7') {
            return '94' . $mobile;
        }
        
        return $mobile;
    }
    
    /**
     * Make API call to WhatsApp Business API
     */
    private function makeApiCall($url, $data) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return ['success' => false, 'message' => 'cURL Error: ' . $error];
        }
        
        $responseData = json_decode($response, true);
        
        if ($httpCode === 200) {
            return ['success' => true, 'message' => 'Teacher credentials sent via WhatsApp'];
        } else {
            return [
                'success' => false, 
                'message' => 'WhatsApp API error: ' . ($responseData['error']['message'] ?? $response),
                'http_code' => $httpCode
            ];
        }
    }
}