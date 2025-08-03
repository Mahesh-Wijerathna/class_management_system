<?php

require_once __DIR__ . '/vendor/autoload.php';
use Twilio\Rest\Client;

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
        
        // Initialize Twilio client
        $twilioConfig = $this->config['alternatives']['twilio'];
        if ($twilioConfig['enabled'] && $twilioConfig['account_sid'] !== 'YOUR_TWILIO_ACCOUNT_SID') {
            $this->twilioClient = new Client($twilioConfig['account_sid'], $twilioConfig['auth_token']);
        }
    }
    
    /**
     * Send OTP via WhatsApp Business API
     */
    public function sendOtp($mobile, $otp) {
        // Check if Twilio is enabled and configured
        $twilioConfig = $this->config['alternatives']['twilio'];
        
        if ($twilioConfig['enabled'] && $twilioConfig['account_sid'] !== 'YOUR_TWILIO_ACCOUNT_SID' && $this->twilioClient) {
            // Use Twilio WhatsApp (easier setup)
            return $this->sendViaTwilio($mobile, $otp);
        }
        
        // Fallback to WhatsApp Business API
        return $this->sendViaWhatsAppBusiness($mobile, $otp);
    }

    /**
     * Send custom message via WhatsApp
     */
    public function sendCustomMessage($mobile, $message) {
        // Check if Twilio is enabled and configured
        $twilioConfig = $this->config['alternatives']['twilio'];
        
        if ($twilioConfig['enabled'] && $twilioConfig['account_sid'] !== 'YOUR_TWILIO_ACCOUNT_SID' && $this->twilioClient) {
            // Use Twilio WhatsApp (easier setup)
            return $this->sendCustomViaTwilio($mobile, $message);
        }
        
        // Fallback to WhatsApp Business API
        return $this->sendCustomViaWhatsAppBusiness($mobile, $message);
    }
    
    /**
     * Send via WhatsApp Business API
     */
    private function sendViaWhatsAppBusiness($mobile, $otp) {
        $apiUrl = "https://graph.facebook.com/{$this->apiVersion}/{$this->phoneNumberId}/messages";
        
        $message = "🔐 *TCMS Verification Code*\n\n";
        $message .= "Your verification code is: *{$otp}*\n\n";
        $message .= "⏰ This code will expire in 15 minutes.\n";
        $message .= "🔒 Do not share this code with anyone.\n\n";
        $message .= "If you didn't request this code, please ignore this message.";
        
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
     * Send custom message via WhatsApp Business API
     */
    private function sendCustomViaWhatsAppBusiness($mobile, $customMessage) {
        $apiUrl = "https://graph.facebook.com/{$this->apiVersion}/{$this->phoneNumberId}/messages";
        
        $data = [
            'messaging_product' => 'whatsapp',
            'to' => $this->formatPhoneNumber($mobile),
            'type' => 'text',
            'text' => [
                'body' => $customMessage
            ]
        ];
        
        return $this->makeApiCall($apiUrl, $data);
    }
    
    /**
     * Send via Twilio WhatsApp (Alternative)
     */
    private function sendViaTwilio($mobile, $otp) {
        $twilioConfig = $this->config['alternatives']['twilio'];
        
        if (!$this->twilioClient) {
            return ['success' => false, 'message' => 'Twilio client not initialized'];
        }
        
        try {
            // Format the phone number for WhatsApp
            $whatsappNumber = 'whatsapp:' . $this->formatPhoneNumber($mobile);
            
            // Create the message using Twilio SDK
            $message = $this->twilioClient->messages
                ->create($whatsappNumber, // to
                    array(
                        "from" => $twilioConfig['whatsapp_from'],
                        "body" => "🔐 TCMS Verification Code\n\nYour verification code is: {$otp}\n\n⏰ This code will expire in 15 minutes.\n🔒 Do not share this code with anyone."
                    )
                );
            
            return [
                'success' => true, 
                'message' => 'WhatsApp message sent via Twilio',
                'message_sid' => $message->sid
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false, 
                'message' => 'Twilio API error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Send custom message via Twilio WhatsApp
     */
    private function sendCustomViaTwilio($mobile, $customMessage) {
        $twilioConfig = $this->config['alternatives']['twilio'];
        
        if (!$this->twilioClient) {
            return ['success' => false, 'message' => 'Twilio client not initialized'];
        }
        
        try {
            // Format the phone number for WhatsApp
            $whatsappNumber = 'whatsapp:' . $this->formatPhoneNumber($mobile);
            
            // Create the message using Twilio SDK
            $message = $this->twilioClient->messages
                ->create($whatsappNumber, // to
                    array(
                        "from" => $twilioConfig['whatsapp_from'],
                        "body" => $customMessage
                    )
                );
            
            return [
                'success' => true, 
                'message' => 'WhatsApp message sent via Twilio',
                'message_sid' => $message->sid
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
            return ['success' => true, 'message' => 'WhatsApp message sent successfully'];
        } else {
            return [
                'success' => false, 
                'message' => 'WhatsApp API error: ' . ($responseData['error']['message'] ?? $response),
                'http_code' => $httpCode
            ];
        }
    }
}

?> 