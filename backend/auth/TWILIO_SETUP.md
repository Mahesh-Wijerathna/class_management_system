# 🚀 Twilio WhatsApp Setup (Easiest Method)

## Quick Setup Steps:

### 1. Sign up for Twilio (Free)
- Go to: https://www.twilio.com/try-twilio
- Create a free account
- Verify your email

### 2. Get Your Credentials
- Go to: https://console.twilio.com/
- Copy your **Account SID** and **Auth Token**
- Note: Auth Token is hidden by default, click "show" to reveal it

### 3. Enable WhatsApp Sandbox
- In Twilio Console, go to: **Messaging** → **Try it out** → **Send a WhatsApp message**
- You'll see a WhatsApp number like: `+14155238886`
- Follow instructions to join the sandbox (send the code to the number)

### 4. Update Configuration
Edit `src/whatsapp_config.php`:

```php
'twilio' => [
    'account_sid' => 'AC1234567890abcdef1234567890abcdef', // Your Account SID
    'auth_token' => 'your_auth_token_here',                 // Your Auth Token
    'whatsapp_from' => 'whatsapp:+14155238886',            // Twilio WhatsApp number
    'enabled' => true,                                      // Keep this true
],
```

### 5. Test Your Setup
```bash
curl -X POST http://localhost:8081/routes.php/forgot-password/send-otp \
-H "Content-Type: application/json" \
-d '{"mobile":"0710901846"}'
```

## ✅ What You Get:
- ✅ Free WhatsApp messaging (sandbox)
- ✅ No business verification needed
- ✅ Works immediately after setup
- ✅ Professional OTP messages

## 📱 WhatsApp Message Format:
```
🔐 TCMS Verification Code

Your verification code is: 123456

⏰ This code will expire in 15 minutes.
🔒 Do not share this code with anyone.
```

## 🔧 Troubleshooting:
- **"Twilio not configured"**: Check your Account SID and Auth Token
- **"WhatsApp failed"**: Make sure you joined the Twilio WhatsApp sandbox
- **"Invalid phone number"**: Ensure phone number is in correct format (0710901846)

## 🚀 Next Steps:
1. Test with your phone number
2. Join the Twilio WhatsApp sandbox
3. Receive OTP messages on WhatsApp!

---
**Need help?** Check Twilio documentation: https://www.twilio.com/docs/whatsapp 