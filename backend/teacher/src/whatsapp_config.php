<?php

// WhatsApp Business API Configuration
// Get these values from Meta Developer Console: https://developers.facebook.com/

return [
    'whatsapp' => [
        'access_token' => getenv('WHATSAPP_ACCESS_TOKEN') ?: 'YOUR_ACCESS_TOKEN_HERE',
        'phone_number_id' => getenv('WHATSAPP_PHONE_NUMBER_ID') ?: 'YOUR_PHONE_NUMBER_ID_HERE',
        'api_version' => getenv('WHATSAPP_API_VERSION') ?: 'v17.0',
        'business_account_id' => getenv('WHATSAPP_BUSINESS_ACCOUNT_ID') ?: 'YOUR_BUSINESS_ACCOUNT_ID_HERE',
        'webhook_verify_token' => getenv('WHATSAPP_WEBHOOK_VERIFY_TOKEN') ?: 'YOUR_WEBHOOK_VERIFY_TOKEN_HERE',
    ],
    
    // Alternative WhatsApp services
    'alternatives' => [
        'twilio' => [
            'account_sid' => getenv('TWILIO_ACCOUNT_SID') ?: 'YOUR_ACCOUNT_SID_HERE',
            'auth_token' => getenv('TWILIO_AUTH_TOKEN') ?: 'YOUR_AUTH_TOKEN_HERE',
            'whatsapp_from' => getenv('TWILIO_WHATSAPP_FROM') ?: 'whatsapp:+your_twilio_whatsapp_number_here',
            'enabled' => true,
        ],
        'messagebird' => [
            'access_key' => getenv('MESSAGEBIRD_ACCESS_KEY') ?: 'YOUR_MESSAGEBIRD_ACCESS_KEY',
            'channel_id' => getenv('MESSAGEBIRD_CHANNEL_ID') ?: 'YOUR_CHANNEL_ID',
        ]
    ]
];

?> 