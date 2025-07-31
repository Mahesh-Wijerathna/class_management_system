# 🚀 Twilio WhatsApp Setup with Environment Variables

## Overview
This project uses Twilio WhatsApp for sending OTP messages. The configuration is managed through environment variables for security.

## ✅ Current Working Configuration

### 1. Environment Variables Setup
The Twilio credentials are currently configured in the `docker-compose.yml` file:

```yaml
environment:
  # Twilio Configuration
  - TWILIO_ACCOUNT_SID=AC95f3a77e76ca75172239b03fac7b2e91
  - TWILIO_AUTH_TOKEN=8d0ec591ce35abd960ce816389bc1c70
  - TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 2. Alternative: Using .env File
You can also create a `.env` file in the `backend/` directory:

```env
# Twilio Configuration
# Get these from: https://console.twilio.com/
TWILIO_ACCOUNT_SID=AC95f3a77e76ca75172239b03fac7b2e91
TWILIO_AUTH_TOKEN=8d0ec591ce35abd960ce816389bc1c70
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

Then update `docker-compose.yml` to use environment variables:
```yaml
env_file:
  - ../.env
environment:
  - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
  - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
  - TWILIO_WHATSAPP_FROM=${TWILIO_WHATSAPP_FROM}
```

## 🛠️ Setup Instructions

### Step 1: Get Twilio Credentials
1. Sign up at: https://www.twilio.com/try-twilio
2. Go to: https://console.twilio.com/
3. Copy your **Account SID** and **Auth Token**
4. Enable WhatsApp sandbox in Twilio Console

### Step 2: Configure Environment Variables
Choose one of these methods:

**Method A: Direct in docker-compose.yml (Current)**
- Edit `backend/auth/docker-compose.yml`
- Replace the Twilio credentials with your own

**Method B: Using .env file**
- Create `backend/.env` file
- Add your Twilio credentials
- Update docker-compose.yml to use env_file

### Step 3: Restart Docker Containers
```bash
cd backend/auth
docker compose down
docker compose up -d
```

### Step 4: Test the Setup
```bash
curl -X POST "http://localhost:8081/routes.php/forgot-password/send-otp" \
-H "Content-Type: application/json" \
-d '{"mobile":"0710901846"}'
```

Expected response:
```json
{
  "success": true,
  "message": "OTP sent to WhatsApp successfully",
  "otp": "123456",
  "userid": "S005"
}
```

## 🔧 Verification

### Check Environment Variables
```bash
docker exec auth-backend env | grep TWILIO
```

Expected output:
```
TWILIO_ACCOUNT_SID=AC95f3a77e76ca75172239b03fac7b2e91
TWILIO_AUTH_TOKEN=8d0ec591ce35abd960ce816389bc1c70
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Test WhatsApp Integration
1. Send a test OTP request
2. Check your WhatsApp for the message
3. Verify the OTP code matches the response

## 📱 WhatsApp Message Format
```
🔐 TCMS Verification Code

Your verification code is: 123456

⏰ This code will expire in 15 minutes.
🔒 Do not share this code with anyone.
```

## 🔒 Security Best Practices
- ✅ Never commit real credentials to version control
- ✅ Use different credentials for development and production
- ✅ Regularly rotate your API keys
- ✅ Keep your `.env` file secure and private
- ✅ Use environment variables instead of hardcoded secrets

## 🚨 Troubleshooting

### Common Issues:
1. **"Authentication Error - invalid username"**
   - Check your Account SID and Auth Token
   - Verify credentials in Twilio Console

2. **"Environment variable not found"**
   - Ensure .env file is in correct location
   - Check docker-compose.yml configuration

3. **"WhatsApp failed"**
   - Make sure you joined the Twilio WhatsApp sandbox
   - Verify phone number format (0710901846)

4. **"Invalid phone number"**
   - Use Sri Lankan format: 0710901846
   - No country code needed

### Debug Commands:
```bash
# Check container environment variables
docker exec auth-backend env | grep TWILIO

# Check container logs
docker logs auth-backend

# Test API endpoint
curl -X POST "http://localhost:8081/routes.php/forgot-password/send-otp" \
-H "Content-Type: application/json" \
-d '{"mobile":"0710901846"}'
```

## 📁 File Structure
```
backend/
├── .env                    # Environment variables (not in git)
└── auth/
    ├── docker-compose.yml  # Container configuration
    └── src/
        └── whatsapp_config.php # Uses getenv() to read variables
```

## 🚀 Next Steps
1. Test with your own phone number
2. Join the Twilio WhatsApp sandbox
3. Receive OTP messages on WhatsApp
4. Consider production credentials for live deployment

---
**Need help?** Check Twilio documentation: https://www.twilio.com/docs/whatsapp 