# Class Management System

A comprehensive class management system with authentication, student management, and payment tracking.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js (for frontend)
- PHP 8.0+ (for backend)

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/Mahesh-Wijerathna/class_management_system.git
cd class_management_system
```

2. **Start the backend services**
```bash
cd backend/auth
docker compose up -d
```

3. **Configure environment variables**
Create a `.env` file in the `backend/` directory:
```env
# Twilio Configuration
# Get these from: https://console.twilio.com/
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+your_twilio_whatsapp_number_here
```

### Frontend Setup

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Start the development server**
```bash
npm start
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /routes.php/login` - User login
- `POST /routes.php/register` - User registration
- `POST /routes.php/forgot-password/send-otp` - Send OTP via WhatsApp
- `POST /routes.php/forgot-password/reset` - Reset password with OTP

### Student Management
- `GET /routes.php/students` - Get all students
- `PUT /routes.php/student/profile` - Update student profile
- `POST /routes.php/change-password` - Change password

### Class Management
- `GET /routes.php/classes` - Get all classes
- `POST /routes.php/classes` - Create new class
- `PUT /routes.php/classes/{id}` - Update class
- `DELETE /routes.php/classes/{id}` - Delete class

## 🔧 Environment Variables

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `your_twilio_account_sid_here` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `your_twilio_auth_token_here` |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp number | `whatsapp:+your_twilio_whatsapp_number_here` |

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_BASE_URL` | Backend API URL | `http://localhost:8081` |
| `REACT_APP_CLASS_API_BASE_URL` | Class API URL | `http://localhost:8087` |
| `REACT_APP_STUDENT_API_BASE_URL` | Student API URL | `http://localhost:8083` |

## 🏗️ Architecture

### Backend Services
- **Auth Service** (Port 8081) - Authentication and user management
- **Class Service** (Port 8087) - Class management
- **Student Service** (Port 8083) - Student management
- **Teacher Service** (Port 8085) - Teacher management

### Frontend
- **React.js** with **Tailwind CSS**
- **React Router** for navigation
- **Axios** for API calls
- **JWT** for authentication

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- OTP verification via WhatsApp
- Rate limiting
- Input validation
- CORS protection

## 📱 Features

### For Students
- View available classes
- Purchase classes
- Track attendance
- View payments
- Manage profile

### For Teachers
- Create and manage classes
- Track student attendance
- View class schedules
- Manage materials

### For Admins
- User management
- Class oversight
- Payment tracking
- System configuration

## 🐳 Docker Services

```yaml
# Auth Service
auth-backend: PHP 8.0 + MySQL
auth-mysql-server: MySQL 8.0
auth-phpmyadmin: phpMyAdmin

# Class Service
class-backend: PHP 8.0 + MySQL
class-mysql-server: MySQL 8.0

# Student Service
student-backend: PHP 8.0 + MySQL
student-mysql-server: MySQL 8.0

# Teacher Service
teacher-backend: PHP 8.0 + MySQL
teacher-mysql-server: MySQL 8.0
```

## 🚀 Deployment

### Production Setup
1. Update environment variables with production values
2. Configure SSL certificates
3. Set up proper database backups
4. Configure monitoring and logging

### Environment Variables for Production
```env
# Database
DB_HOST=your_production_db_host
DB_NAME=your_production_db_name
DB_USER=your_production_db_user
DB_PASS=your_production_db_password

# JWT
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRY=3600

# Twilio (Production)
TWILIO_ACCOUNT_SID=your_production_twilio_sid
TWILIO_AUTH_TOKEN=your_production_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+your_production_whatsapp_number
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository. 

