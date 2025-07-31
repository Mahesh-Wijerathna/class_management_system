<?php

// WhatsApp Business API Configuration
// Get these values from Meta Developer Console: https://developers.facebook.com/

return [
    'whatsapp' => [
        'access_token' => 'YOUR_ACCESS_TOKEN_HERE', // Replace with your actual access token
        'phone_number_id' => 'YOUR_PHONE_NUMBER_ID_HERE', // Replace with your phone number ID
        'api_version' => 'v17.0',
        'business_account_id' => 'YOUR_BUSINESS_ACCOUNT_ID_HERE', // Optional
        'webhook_verify_token' => 'YOUR_WEBHOOK_VERIFY_TOKEN_HERE', // For webhooks
    ],
    
    // Alternative WhatsApp services
    'alternatives' => [
        'twilio' => [
            'account_sid' => 'AC95f3a77e76ca75172239b03fac7b2e91', // Your Account SID
            'auth_token' => '8d0ec591ce35abd960ce816389bc1c70',   // Your Auth Token
            'whatsapp_from' => 'whatsapp:+14155238886',            // Twilio WhatsApp sandbox number
            'enabled' => true,                                      // Enable Twilio
        ],
        'messagebird' => [
            'access_key' => 'YOUR_MESSAGEBIRD_ACCESS_KEY',
            'channel_id' => 'YOUR_CHANNEL_ID',
        ]
    ]
];

?> 