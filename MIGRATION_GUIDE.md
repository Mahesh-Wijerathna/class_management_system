# 🚀 **TCMS Migration Guide: From Dummy Data to Live Production**

## 📋 **Overview**

This guide will help you transform your TCMS (Teacher/Student/Class Management System) from using dummy data and local storage to a fully functional, industry-ready application with real database integration.

## 🎯 **Migration Phases**

### **Phase 1: Database Setup** ✅

#### **1.1 Initialize Database**
```bash
# Start MySQL container
docker run -d \
  --name tcms_mysql \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -e MYSQL_DATABASE=tcms_db \
  -e MYSQL_USER=tcms_user \
  -e MYSQL_PASSWORD=your_password \
  -p 3306:3306 \
  mysql:8.0

# Import schema
mysql -h localhost -u tcms_user -p tcms_db < backend/database_schema.sql
```

#### **1.2 Verify Database Connection**
```bash
# Test connection
mysql -h localhost -u tcms_user -p tcms_db -e "SHOW TABLES;"
```

### **Phase 2: Backend API Implementation** ✅

#### **2.1 Update Environment Configuration**
```bash
# Copy environment template
cp frontend/env.example frontend/.env

# Update API URLs in .env
REACT_APP_API_BASE_URL=http://localhost:8081
REACT_APP_CLASS_API_BASE_URL=http://localhost:8087
REACT_APP_TEACHER_API_BASE_URL=http://localhost:8088
REACT_APP_STUDENT_API_BASE_URL=http://localhost:8089
```

#### **2.2 Start Backend Services**
```bash
# Start all backend services
cd backend/auth && docker compose up -d
cd ../class && docker compose up -d
cd ../teacher && docker compose up -d
cd ../student && docker compose up -d
```

#### **2.3 Test API Endpoints**
```bash
# Test authentication
curl -X POST http://localhost:8081/routes.php/login \
  -H "Content-Type: application/json" \
  -d '{"userid":"ADMIN001","password":"password"}'

# Test class listing
curl -X GET http://localhost:8087/routes.php/classes
```

### **Phase 3: Frontend Integration** 🔄

#### **3.1 Update Components**

**Replace localStorage with API calls:**

```javascript
// OLD: localStorage approach
const getClassList = () => {
  const stored = localStorage.getItem('classes');
  return stored ? JSON.parse(stored) : [];
};

// NEW: API approach
const [classes, setClasses] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadClasses = async () => {
    try {
      const response = await getAllClasses();
      if (response.success) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  loadClasses();
}, []);
```

#### **3.2 Update Key Components**

**Files to update:**
- `frontend/src/pages/dashboard/adminDashboard/AllClasses.jsx` ✅
- `frontend/src/pages/dashboard/adminDashboard/CreateClass.jsx`
- `frontend/src/pages/dashboard/studentDashboard/MyClasses.jsx`
- `frontend/src/pages/dashboard/adminDashboard/FinancialRecordsOverview.jsx`
- `frontend/src/pages/dashboard/adminDashboard/StudentEnrollment.jsx`

#### **3.3 Remove Dummy Data Files**
```bash
# Remove dummy data files
rm frontend/src/pages/dashboard/adminDashboard/financialDummyData.js
rm frontend/src/pages/dashboard/studentDashboard/PurchaseStudyPackData.js
```

### **Phase 4: Data Migration** 🔄

#### **4.1 Migrate Existing Data**

**Create migration script:**
```javascript
// scripts/migrateData.js
const migrateLocalStorageToAPI = async () => {
  // Get data from localStorage
  const classes = JSON.parse(localStorage.getItem('classes') || '[]');
  const students = JSON.parse(localStorage.getItem('students') || '[]');
  const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
  
  // Migrate classes
  for (const cls of classes) {
    await createClass(cls);
  }
  
  // Migrate students
  for (const student of students) {
    await createStudent(student);
  }
  
  // Migrate teachers
  for (const teacher of teachers) {
    await createTeacher(teacher);
  }
};
```

#### **4.2 Seed Initial Data**

**Create seed script:**
```sql
-- scripts/seed_data.sql
INSERT INTO classes (class_name, subject, teacher, stream, delivery_method, fee, status) VALUES
('Advanced Mathematics', 'Mathematics', 'Dr. John Smith', 'A/L-Maths', 'online', 8000.00, 'active'),
('Physics Fundamentals', 'Physics', 'Prof. Sarah Johnson', 'A/L-Science', 'hybrid', 7500.00, 'active');

INSERT INTO students (userid, firstName, lastName, mobile, stream, status) VALUES
('S001', 'Alice', 'Perera', '0712345678', 'A/L-Science', 'active'),
('S002', 'Bob', 'Silva', '0712345679', 'A/L-Maths', 'active');
```

### **Phase 5: Testing & Validation** 🔄

#### **5.1 API Testing**
```bash
# Test all endpoints
npm run test:api

# Test specific endpoints
curl -X GET http://localhost:8081/routes.php/health
curl -X GET http://localhost:8087/routes.php/classes
curl -X GET http://localhost:8088/routes.php/teachers
```

#### **5.2 Frontend Testing**
```bash
# Start frontend
cd frontend && npm start

# Run tests
npm test

# Test user flows
# 1. Login as admin
# 2. Create a class
# 3. Register a student
# 4. Enroll student in class
# 5. Mark attendance
# 6. Record payment
```

#### **5.3 Integration Testing**
```bash
# Test complete workflows
npm run test:integration

# Test specific scenarios
npm run test:auth
npm run test:classes
npm run test:payments
```

### **Phase 6: Production Deployment** 🔄

#### **6.1 Environment Setup**
```bash
# Copy production environment
cp env.production .env.production

# Update production variables
nano .env.production
```

#### **6.2 Build Production Images**
```bash
# Build all services
docker compose -f docker-compose.prod.yml build

# Build specific service
docker compose -f docker-compose.prod.yml build auth_service
```

#### **6.3 Deploy to Production**
```bash
# Deploy all services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

#### **6.4 SSL Configuration**
```bash
# Generate SSL certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# Update nginx configuration
nano nginx/nginx.conf
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Database Connection Issues**
```bash
# Check MySQL status
docker logs tcms_mysql

# Test connection
mysql -h localhost -u tcms_user -p tcms_db -e "SELECT 1;"
```

#### **2. API Endpoint Issues**
```bash
# Check service logs
docker logs tcms_auth_service
docker logs tcms_class_service

# Test endpoints
curl -v http://localhost:8081/routes.php/health
```

#### **3. Frontend Build Issues**
```bash
# Clear cache
rm -rf frontend/node_modules
npm install

# Rebuild
npm run build
```

#### **4. CORS Issues**
```bash
# Update CORS configuration in backend
# Add to .htaccess or PHP headers
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
```

## 📊 **Performance Optimization**

### **1. Database Optimization**
```sql
-- Add indexes for better performance
CREATE INDEX idx_classes_status ON classes(status);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
```

### **2. Caching Strategy**
```php
// Implement Redis caching
$redis = new Redis();
$redis->connect('redis', 6379);

// Cache frequently accessed data
$classes = $redis->get('classes_list');
if (!$classes) {
    $classes = $db->query("SELECT * FROM classes WHERE status = 'active'");
    $redis->setex('classes_list', 3600, json_encode($classes));
}
```

### **3. API Response Optimization**
```php
// Implement pagination
$page = $_GET['page'] ?? 1;
$limit = $_GET['limit'] ?? 20;
$offset = ($page - 1) * $limit;

$query = "SELECT * FROM classes LIMIT $limit OFFSET $offset";
```

## 🔒 **Security Checklist**

### **1. Environment Variables**
- [ ] All sensitive data moved to environment variables
- [ ] Production secrets are secure and unique
- [ ] No hardcoded credentials in code

### **2. API Security**
- [ ] JWT tokens properly implemented
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention

### **3. Frontend Security**
- [ ] HTTPS enforced in production
- [ ] Secure cookie settings
- [ ] XSS protection enabled
- [ ] CSRF protection implemented

## 📈 **Monitoring & Analytics**

### **1. Application Monitoring**
```bash
# Access monitoring dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)

# Set up alerts
# Configure Grafana alerts for:
# - High error rates
# - Slow response times
# - Database connection issues
```

### **2. Log Management**
```bash
# View application logs
docker compose -f docker-compose.prod.yml logs -f

# Set up log rotation
# Configure logrotate for production logs
```

## 🎉 **Success Criteria**

### **Phase 1: Database** ✅
- [x] Database schema created
- [x] Tables populated with initial data
- [x] Database connections working

### **Phase 2: Backend** ✅
- [x] All API endpoints implemented
- [x] Authentication working
- [x] CRUD operations functional

### **Phase 3: Frontend** 🔄
- [ ] All components using API calls
- [ ] No localStorage dependencies
- [ ] Error handling implemented
- [ ] Loading states added

### **Phase 4: Data Migration** 🔄
- [ ] Existing data migrated
- [ ] Data integrity verified
- [ ] Backup procedures in place

### **Phase 5: Testing** 🔄
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] User acceptance testing complete

### **Phase 6: Production** 🔄
- [ ] Production environment deployed
- [ ] SSL certificates configured
- [ ] Monitoring and logging active
- [ ] Backup procedures tested

## 📞 **Support**

If you encounter issues during migration:

1. **Check the logs**: `docker logs <service_name>`
2. **Verify configuration**: Ensure all environment variables are set
3. **Test endpoints**: Use curl or Postman to test API endpoints
4. **Review documentation**: Check the API documentation for correct usage

## 🚀 **Next Steps**

After successful migration:

1. **Performance Tuning**: Optimize database queries and API responses
2. **Feature Enhancement**: Add new features using the new architecture
3. **Scalability**: Implement horizontal scaling for high traffic
4. **Advanced Analytics**: Add business intelligence and reporting features
5. **Mobile App**: Develop mobile applications using the same API

---

**🎯 Goal**: Transform your TCMS from a dummy data prototype to a production-ready, scalable application that can handle real-world usage with proper security, performance, and reliability. 