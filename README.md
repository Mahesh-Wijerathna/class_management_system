# 🎓 TCMS - Tuition Class Management System

A comprehensive web application for managing tuition classes, students, teachers, and administrative tasks.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Docker** and **Docker Compose**
- **Git**

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd class_management_system
```

### 2. Environment Setup

#### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Twilio Configuration
# Get these from: https://console.twilio.com/
TWILIO_ACCOUNT_SID=AC95f3a77e76ca75172239b03fac7b2e91
TWILIO_AUTH_TOKEN=8d0ec591ce35abd960ce816389bc1c70
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# WhatsApp Business API Configuration (Optional)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_VERSION=v17.0
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# MessageBird Configuration (Alternative to Twilio)
MESSAGEBIRD_ACCESS_KEY=your_messagebird_access_key
MESSAGEBIRD_CHANNEL_ID=your_channel_id
```

#### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8081
REACT_APP_CLASS_API_BASE_URL=http://localhost:8087
REACT_APP_STUDENT_API_BASE_URL=http://localhost:8083

# Authentication
REACT_APP_JWT_SECRET=your_jwt_secret_here
REACT_APP_TOKEN_EXPIRY=900000
```

### 3. Start Backend Services

```bash
# Start authentication service
cd backend/auth
docker compose up -d

# Start class management service (if needed)
cd ../class
docker compose up -d

# Start student service (if needed)
cd ../student
docker compose up -d
```

### 4. Start Frontend

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm start
```

## 📱 Application URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main React application |
| **Auth Backend** | http://localhost:8081 | Authentication API |
| **phpMyAdmin** | http://localhost:8082 | Database management |
| **Class API** | http://localhost:8087 | Class management API |
| **Student API** | http://localhost:8083 | Student management API |

## 👥 Default User Accounts

### Admin Account
- **User ID**: A003
- **Password**: AdminPass@123
- **Role**: Admin
- **Access**: Full administrative privileges

### Teacher Account
- **User ID**: T001
- **Password**: TeacherPass@123
- **Role**: Teacher
- **Access**: Teacher dashboard and class management

### Student Account
- **User ID**: S008
- **Password**: TestPass@123
- **Role**: Student
- **Access**: Student dashboard and class enrollment

## 🔧 API Endpoints

### Authentication
- `POST /routes.php/login` - User login
- `POST /routes.php/user` - User registration
- `POST /routes.php/refresh` - Refresh JWT token
- `POST /routes.php/logout` - User logout
- `POST /routes.php/forgot-password/send-otp` - Send OTP via WhatsApp
- `POST /routes.php/forgot-password/reset` - Reset password with OTP

### Student Management
- `GET /routes.php/students` - Get all students
- `PUT /routes.php/student/profile` - Update student profile
- `POST /routes.php/change-password` - Change user password

### Barcode Management
- `POST /routes.php/barcode/save` - Save student barcode
- `GET /routes.php/barcode/{userid}` - Get student barcode
- `GET /routes.php/barcodes` - Get all barcodes

### Class Management
- `GET /routes.php/get_all_classes` - Get all classes
- `GET /routes.php/get_active_classes` - Get active classes
- `POST /routes.php/` - Create new class
- `PUT /routes.php/classes/{id}` - Update class
- `DELETE /routes.php/classes/{id}` - Delete class

## 🛠️ Development

### Project Structure
```
class_management_system/
├── backend/
│   ├── auth/                 # Authentication service
│   ├── class/               # Class management service
│   └── student/             # Student management service
├── frontend/
│   ├── src/
│   │   ├── api/            # API services
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   └── routes/         # Route definitions
│   └── public/             # Static assets
└── README.md
```

### Key Features
- ✅ **User Authentication** with JWT tokens
- ✅ **Role-based Access Control** (Admin, Teacher, Student)
- ✅ **WhatsApp OTP** for password reset
- ✅ **Barcode Generation** for students
- ✅ **Class Management** with scheduling
- ✅ **Student Enrollment** and profile management
- ✅ **Payment Integration** (PayHere)
- ✅ **Responsive Design** with Tailwind CSS

### Technology Stack
- **Frontend**: React.js, Tailwind CSS, Axios
- **Backend**: PHP, MySQL, Apache
- **Authentication**: JWT (Firebase/PHP-JWT)
- **Database**: MySQL with Docker
- **External Services**: Twilio WhatsApp API, PayHere

## 🔒 Security Features

- **JWT Authentication** with access and refresh tokens
- **Password Hashing** using bcrypt
- **Rate Limiting** for login attempts
- **Account Lockout** after failed attempts
- **CORS Protection** configured
- **Environment Variables** for sensitive data
- **Cross-tab Logout** synchronization

## 📱 WhatsApp Integration

The system uses Twilio WhatsApp API for OTP delivery:

1. **Setup Twilio Account**: Sign up at https://www.twilio.com/
2. **Get Credentials**: Account SID and Auth Token from Twilio Console
3. **Configure Environment**: Add credentials to `backend/.env`
4. **Join Sandbox**: Join the Twilio WhatsApp sandbox for testing

### WhatsApp Message Format
```
🔐 TCMS Verification Code
Your verification code is: 123456
⏰ This code will expire in 15 minutes.
🔒 Do not share this code with anyone.
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill existing processes
   pkill -f "react-scripts"
   pkill -f "docker"
   
   # Restart services
   docker compose down -v && docker compose up -d
   ```

2. **Database Connection Issues**
   ```bash
   # Restart MySQL container
   docker compose restart mysql-server
   
   # Check logs
   docker logs auth-mysql-server
   ```

3. **CORS Errors**
   - Ensure backend is running on correct port
   - Check `.htaccess` configuration
   - Verify `withCredentials: false` in axios config

4. **WhatsApp OTP Not Working**
   - Verify Twilio credentials in environment variables
   - Check phone number format (0710901846)
   - Ensure you've joined Twilio WhatsApp sandbox

### Debug Commands
```bash
# Check container status
docker ps

# View backend logs
docker logs auth-backend

# Test API endpoints
curl -X POST "http://localhost:8081/routes.php/login" \
  -H "Content-Type: application/json" \
  -d '{"userid":"S008","password":"TestPass@123"}'

# Check environment variables
docker exec auth-backend env | grep TWILIO
```

## 📝 Environment Variables Reference

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `AC95f3a77e76ca75172239b03fac7b2e91` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `8d0ec591ce35abd960ce816389bc1c70` |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp number | `whatsapp:+14155238886` |

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_BASE_URL` | Auth API base URL | `http://localhost:8081` |
| `REACT_APP_CLASS_API_BASE_URL` | Class API base URL | `http://localhost:8087` |
| `REACT_APP_STUDENT_API_BASE_URL` | Student API base URL | `http://localhost:8083` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section above
- Review the API documentation
- Check container logs for errors
- Ensure all environment variables are set correctly

---

**Happy Coding! 🚀** 