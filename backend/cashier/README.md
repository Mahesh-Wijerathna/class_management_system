# Cashier Backend Service

This is the dedicated backend service for cashier operations in the Class Management System.

## Overview

The Cashier Service handles all cashier-related operations including:
- Payment processing and management
- Financial records and reporting
- Student record management
- Cashier session tracking
- Dashboard statistics

## Architecture

The service follows a microservices architecture pattern with:
- **Database**: MySQL 8.0 with dedicated `cashier-db`
- **Backend**: PHP 8.1 with Apache
- **Containerization**: Docker & Docker Compose
- **API**: RESTful endpoints with JSON responses

## Services

### 1. Payment Management
- Process new payments
- View payment history
- Update payment status
- Generate receipts
- Filter and search payments

### 2. Financial Records
- Track income and expenses
- Generate financial reports
- Category-based analysis
- Period-based summaries

### 3. Student Records
- Manage student information
- View student payment history
- Search and filter students
- Update student details

### 4. Cashier Sessions
- Track cashier login/logout
- Monitor session statistics
- Generate session reports

## Database Schema

### Tables

1. **payments** - Payment transactions
2. **financial_records** - Financial tracking
3. **student_records** - Student information
4. **cashier_sessions** - Session management

## API Endpoints

### Payments
- `GET /payments` - Get all payments with pagination
- `GET /payments/{id}` - Get payment by ID
- `POST /payments` - Create new payment
- `PUT /payments/{id}` - Update payment
- `DELETE /payments/{id}` - Delete payment
- `GET /payments/student/{studentId}` - Get payments by student
- `GET /payments/status/{status}` - Get payments by status

### Financial Records
- `GET /financial-records` - Get all records
- `GET /financial-records/{id}` - Get record by ID
- `POST /financial-records` - Create new record
- `PUT /financial-records/{id}` - Update record
- `DELETE /financial-records/{id}` - Delete record
- `GET /financial-records/summary` - Get financial summary
- `GET /financial-records/reports` - Generate reports

### Students
- `GET /students` - Get all students
- `GET /students/{id}` - Get student by ID
- `POST /students` - Create new student
- `PUT /students/{id}` - Update student
- `DELETE /students/{id}` - Delete student
- `GET /students/search` - Search students

### Sessions
- `GET /sessions` - Get all sessions
- `GET /sessions/active` - Get active sessions
- `POST /sessions/start` - Start new session
- `PUT /sessions/{id}/end` - End session
- `GET /sessions/{id}/summary` - Get session summary

### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /dashboard/recent-transactions` - Get recent transactions
- `GET /dashboard/today-schedule` - Get today's schedule

## Setup Instructions

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend/cashier
   ```

2. **Start the services**
   ```bash
   docker-compose up -d
   ```

3. **Access the services**
   - Backend API: http://localhost:8082
   - phpMyAdmin: http://localhost:8084
   - Database: localhost:3308

### Environment Variables

The service uses the following environment variables:
- `DB_HOST` - Database host (default: mysql)
- `DB_NAME` - Database name (default: cashier-db)
- `DB_USER` - Database user (default: devuser)
- `DB_PASSWORD` - Database password (default: devpass)
- `AUTH_SERVICE_URL` - Auth service URL for token verification

## Development

### File Structure
```
cashier/
├── docker-compose.yml
├── Dockerfile
├── README.md
├── mysql/
│   └── init.sql
└── src/
    ├── composer.json
    ├── config.php
    ├── index.php
    ├── routes.php
    ├── CashierController.php
    ├── PaymentController.php
    ├── FinancialController.php
    └── StudentController.php
```

### Adding New Features

1. **Create Controller**: Add new controller class in `src/`
2. **Update Routes**: Add routes in `routes.php`
3. **Database Changes**: Update `mysql/init.sql`
4. **Test**: Use the API endpoints

## Integration

### With Auth Service
- Token verification for cashier authentication
- User role validation
- Session management

### With Other Services
- Student data synchronization
- Class information integration
- Teacher coordination

## Security

- CORS headers configured
- Input validation and sanitization
- SQL injection prevention with prepared statements
- Token-based authentication

## Monitoring

- Session tracking
- Transaction logging
- Error handling and logging
- Performance monitoring

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if MySQL container is running
   - Verify database credentials
   - Check network connectivity

2. **API Not Responding**
   - Verify container status
   - Check logs: `docker-compose logs cashier-backend`
   - Ensure port 8082 is available

3. **Permission Issues**
   - Check file permissions
   - Verify Docker user permissions

### Logs
```bash
# View backend logs
docker-compose logs cashier-backend

# View database logs
docker-compose logs mysql

# Follow logs in real-time
docker-compose logs -f cashier-backend
```

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test thoroughly

## License

This project is part of the Class Management System. 