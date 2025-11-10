# Auth Folder Purpose - Clear Explanation

## Your Question
> "What is the purpose of this auth folder? Is it needed to include cashier related things??"

## Short Answer
**NO!** The auth folder is for **authentication only** (login, registration, password management). Cashier-specific business logic should **NOT** be added here.

---

## Auth Folder Purpose

### Location
```
backend/auth/
```

### Purpose: **Central Authentication Service**
The auth service is responsible for:

1. **User Management**
   - Creating user accounts (students, teachers, admin, **cashiers**)
   - Storing user credentials (userid, password, role)
   - Managing user profiles (name, email, phone)

2. **Authentication**
   - Login/logout
   - Password verification
   - JWT token generation
   - Session management

3. **Security**
   - Password hashing
   - OTP generation/verification
   - Rate limiting (prevent brute force attacks)
   - Refresh token management

4. **User Data Storage**
   - `users` table - All users (students, teachers, admin, cashiers)
   - `students` table - Student profile details
   - `refresh_tokens` table - Token management
   - `login_attempts` table - Security tracking

### What Auth Does
```
┌─────────────────────────────┐
│      Auth Service           │
├─────────────────────────────┤
│ ✅ Login/Registration       │
│ ✅ Password Management      │
│ ✅ User Role Management     │
│ ✅ Token Generation         │
│ ✅ User Profile Data        │
└─────────────────────────────┘
```

### Files in Auth Service
```
backend/auth/
├── src/
│   ├── UserController.php    ← Login, registration, profile
│   ├── UserModel.php         ← User database operations
│   ├── RateLimiter.php       ← Security (rate limiting)
│   ├── OtpModel.php          ← OTP generation/verification
│   ├── BarcodeController.php ← Student ID barcode generation
│   └── routes.php            ← API routing
├── mysql/
│   └── init.sql              ← Users, students, tokens tables
└── Dockerfile
```

---

## Cashier Folder Purpose

### Location
```
backend/cashier/
```

### Purpose: **Cashier Session & Cash Management**
The cashier service is responsible for:

1. **Session Management**
   - Daily cashier sessions
   - KPI tracking (collections, receipts, pending payments)
   - Session locking/unlocking

2. **Cash Drawer Management**
   - Opening/closing balance
   - Cash in/out transactions
   - Balance reconciliation

3. **Activity Logging**
   - Audit trail of all cashier actions
   - Payment collection logs
   - Late note issuance logs

4. **Cashier-Specific Data**
   - `cashier_sessions` table
   - `session_activities` table
   - `cash_drawer_transactions` table

### What Cashier Does
```
┌─────────────────────────────┐
│    Cashier Service          │
├─────────────────────────────┤
│ ✅ Session Management       │
│ ✅ KPI Tracking            │
│ ✅ Cash Drawer Control      │
│ ✅ Activity Audit Trail    │
│ ✅ Day End Reports         │
└─────────────────────────────┘
```

---

## Why NOT Mix Them?

### ❌ Bad Approach (Don't Do This)
```
backend/auth/
├── src/
│   ├── UserController.php
│   ├── CashierSessionController.php  ← ❌ WRONG! Don't add here
│   └── CashierKPIController.php      ← ❌ WRONG! Don't add here
└── mysql/
    └── init.sql
        ├── users table
        ├── cashier_sessions table       ← ❌ WRONG! Don't add here
        └── cash_drawer_transactions     ← ❌ WRONG! Don't add here
```

**Problems:**
- 🚫 Violates Single Responsibility Principle
- 🚫 Auth service becomes bloated
- 🚫 Harder to maintain and scale
- 🚫 Tight coupling between services
- 🚫 Can't deploy/scale services independently

### ✅ Correct Approach (Microservices Pattern)
```
backend/
├── auth/              ← Authentication ONLY
│   └── Users, login, tokens
│
└── cashier/           ← Cashier business logic ONLY
    └── Sessions, KPIs, cash drawer
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Each service has one responsibility
- ✅ Independent deployment
- ✅ Easier to maintain and test
- ✅ Can scale services independently

---

## How They Work Together

### Cross-Service Integration (Current Solution)

```
┌──────────────────┐         ┌──────────────────┐
│   Auth Service   │         │ Cashier Service  │
│   Port: 8081     │         │   Port: 8083     │
├──────────────────┤         ├──────────────────┤
│ Database:        │         │ Database:        │
│ • auth-db        │◄────────│ • cashier_db     │
│                  │  Read   │                  │
│ users table:     │  Only   │ Verifies:        │
│ ┌──────────────┐ │         │ • cashier_id     │
│ │ C00001       │ │         │ • cashier_name   │
│ │ Test Cashier │ │         │ • role=cashier   │
│ │ role: cashier│ │         │                  │
│ └──────────────┘ │         └──────────────────┘
└──────────────────┘
```

### How It Works:

1. **Cashier Service Needs User Info:**
   ```php
   // In cashier backend (config.php)
   function verifyCashierUser($cashierId) {
       $authConn = getAuthDBConnection(); // Connect to auth DB
       
       $stmt = $authConn->prepare("
           SELECT userid, name, role 
           FROM users 
           WHERE userid = :cashier_id 
           AND role = 'cashier'
       ");
       
       return $user !== false;
   }
   ```

2. **No Duplication:**
   - User data stored ONCE in auth database
   - Cashier service reads (read-only access)
   - Single source of truth for user information

---

## What Goes Where?

### Auth Service (`backend/auth/`)
**Add here:**
- ✅ Login/logout endpoints
- ✅ User registration
- ✅ Password reset/forgot password
- ✅ User profile management
- ✅ Role management (student, teacher, admin, cashier)
- ✅ Token generation/refresh
- ✅ Security features (OTP, rate limiting)

**Database tables:**
- ✅ `users` - All system users
- ✅ `students` - Student details
- ✅ `refresh_tokens` - JWT tokens
- ✅ `login_attempts` - Security logs

### Cashier Service (`backend/cashier/`)
**Add here:**
- ✅ Session start/resume/close
- ✅ KPI updates (collections, receipts, pending)
- ✅ Cash drawer operations
- ✅ Activity logging
- ✅ Day end reports
- ✅ Payment collection tracking

**Database tables:**
- ✅ `cashier_sessions` - Daily sessions
- ✅ `session_activities` - Audit logs
- ✅ `cash_drawer_transactions` - Cash movements

---

## Example User Flow

### Scenario: Cashier Logs In and Starts Session

```
1. Login (Auth Service)
   POST http://localhost:8081/routes.php/login
   {
     "userid": "C00001",
     "password": "password123"
   }
   ↓
   Response: JWT token, user info (name, role)

2. Start Session (Cashier Service)
   POST http://localhost:8083/api/session/start
   {
     "cashier_id": "C00001",
     "opening_balance": 5000
   }
   ↓
   Cashier service verifies C00001 exists in auth DB
   ↓
   Creates session in cashier DB
   ↓
   Response: Session ID, KPIs
```

### Key Points:
- **Auth** handles login (step 1)
- **Cashier** handles business logic (step 2)
- **Cashier reads from auth DB** to verify user
- **No cashier logic in auth service**

---

## Common Questions

### Q: "Should I add cashier login to auth service?"
**A:** NO! Use the existing generic login endpoint. It already supports all roles (student, teacher, admin, cashier).

### Q: "Should I create cashier sessions table in auth database?"
**A:** NO! Sessions are cashier-specific business data. Keep in cashier database.

### Q: "Should I add cashier user registration to auth service?"
**A:** YES! User creation (any role) belongs in auth service. But session management belongs in cashier service.

### Q: "Can cashier service create users?"
**A:** NO! Only auth service creates users. Cashier service can only read user data for verification.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend                            │
│              (React - Port 3000)                        │
└────────────────┬───────────────────┬────────────────────┘
                 │                   │
          ┌──────┴────────┐   ┌─────┴──────────┐
          │               │   │                │
    ┌─────▼─────┐   ┌────▼────┐        ┌──────▼─────┐
    │   Auth    │   │ Cashier │        │  Student   │
    │  Service  │   │ Service │        │  Service   │
    │ Port:8081 │   │Port:8083│        │ Port:8084  │
    └─────┬─────┘   └────┬────┘        └──────┬─────┘
          │              │                    │
    ┌─────▼─────┐   ┌────▼────┐        ┌──────▼─────┐
    │  auth-db  │   │cashier_ │        │ student_db │
    │           │◄──│db       │        │            │
    │ • users   │   │• sessions│       │ • payments │
    └───────────┘   └─────────┘        └────────────┘
         ▲
         └──── Cashier reads users (read-only)
```

---

## Summary

### ✅ DO:
1. Keep auth for authentication only
2. Keep cashier for cashier business logic
3. Let cashier read from auth DB (read-only)
4. Maintain clear service boundaries

### ❌ DON'T:
1. Add cashier business logic to auth service
2. Duplicate user data in cashier database
3. Mix authentication with business logic
4. Create tight coupling between services

### 🎯 Remember:
**Auth Service = "Who are you?"**  
**Cashier Service = "What are you doing?"**

The auth folder's purpose is **authentication and user management for ALL roles**. Cashier-specific business logic should stay in the cashier folder. They communicate through database connections, maintaining clean separation of concerns.
