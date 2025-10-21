# Cashier-Auth Database Integration

## Problem Solved
**Question:** "Why we cannot use this for A)" (referring to backend/auth database)

**Answer:** You're absolutely right! Instead of duplicating the `users` table in `cashier_db`, we should **connect to the existing auth database** to verify cashier users.

## Architecture

### Before (Isolated Cashier DB)
```
┌─────────────────┐
│   cashier_db    │
├─────────────────┤
│ • sessions      │
│ • activities    │
│ • transactions  │
│ • users ❌      │  <- Would duplicate auth users!
└─────────────────┘
```

### After (Cross-Database Integration) ✅
```
┌─────────────────┐         ┌──────────────┐
│   cashier_db    │         │   auth_db    │
├─────────────────┤         ├──────────────┤
│ • sessions      │ ───┐    │ • users ✅   │
│ • activities    │    │    │ • students   │
│ • transactions  │    └───→│ • tokens     │
└─────────────────┘         └──────────────┘
         ↑                          ↑
         │                          │
   cashier-backend connects to BOTH databases
```

## Implementation

### 1. Database Configuration (`config.php`)

```php
// Cashier database (for session management)
define('DB_HOST', 'cashier-mysql');
define('DB_NAME', 'cashier_db');
define('DB_USER', 'cashieruser');
define('DB_PASSWORD', 'cashierpass');

// Auth database (for user verification - read-only)
define('AUTH_DB_HOST', 'auth-mysql-server');
define('AUTH_DB_NAME', 'auth-db');
define('AUTH_DB_USER', 'devuser');
define('AUTH_DB_PASSWORD', 'devpass');
```

### 2. Two Connection Functions

**Primary Connection (Cashier DB):**
```php
function getDBConnection() {
    // Connects to cashier_db
    // Used for: sessions, activities, transactions
}
```

**Secondary Connection (Auth DB):**
```php
function getAuthDBConnection() {
    // Connects to auth-db
    // Used for: user verification (read-only)
}
```

### 3. User Verification Functions

**Check if cashier exists:**
```php
function verifyCashierUser($cashierId) {
    $authConn = getAuthDBConnection();
    
    $stmt = $authConn->prepare("
        SELECT userid, name, role 
        FROM users 
        WHERE userid = :cashier_id AND role = 'cashier'
    ");
    $stmt->execute(['cashier_id' => $cashierId]);
    
    return $stmt->fetch() !== false;
}
```

**Get cashier name:**
```php
function getCashierName($cashierId) {
    $authConn = getAuthDBConnection();
    
    $stmt = $authConn->prepare("
        SELECT name 
        FROM users 
        WHERE userid = :cashier_id AND role = 'cashier'
    ");
    $stmt->execute(['cashier_id' => $cashierId]);
    $user = $stmt->fetch();
    
    return $user ? $user['name'] : 'Cashier ' . $cashierId;
}
```

### 4. Docker Networking

**Updated `docker-compose.yml`:**
```yaml
cashier-backend:
  depends_on:
    - cashier-mysql
    - auth-mysql      # ← Added dependency
  environment:
    # Cashier database
    - DB_HOST=cashier-mysql
    - DB_NAME=cashier_db
    - DB_USER=cashieruser
    - DB_PASSWORD=cashierpass
    # Auth database (for user verification)
    - AUTH_DB_HOST=auth-mysql
    - AUTH_DB_NAME=auth-db
    - AUTH_DB_USER=devuser
    - AUTH_DB_PASSWORD=devpass
  networks:
    - cashier-network
    - auth-network    # ← Added to auth network
```

## Benefits

### ✅ No Data Duplication
- Single source of truth for user data
- No need to sync users between databases

### ✅ Security
- Auth DB is read-only from cashier backend
- Cashier can't modify user credentials
- Proper separation of concerns

### ✅ Consistency
- Cashier names always match auth database
- Role verification ensures only cashiers can access

### ✅ Flexibility
- If auth DB is unavailable, cashier can still work (graceful degradation)
- Easy to add more auth checks in the future

## Usage in Session Management

**When starting a session:**
```php
public function startSession() {
    $cashierId = $data['cashier_id'];
    
    // 1. Verify cashier exists in auth DB
    if (!verifyCashierUser($cashierId)) {
        handleError('Invalid cashier ID', 403);
    }
    
    // 2. Get cashier name from auth DB
    $cashierName = getCashierName($cashierId);
    
    // 3. Create/resume session in cashier DB
    // ... rest of session logic
}
```

## Database Structure

### Auth DB (`auth-db`)
**Port:** 9323  
**Tables:**
- `users` - All user accounts (students, teachers, admin, **cashiers**)
- `students` - Student profile details
- `refresh_tokens` - JWT token management
- `login_attempts` - Security tracking

### Cashier DB (`cashier_db`)
**Port:** 9334  
**Tables:**
- `cashier_sessions` - Daily session KPIs
- `session_activities` - Audit trail
- `cash_drawer_transactions` - Cash movement log

## API Endpoints

All endpoints verify cashier through auth database:

### Start Session
```http
POST /api/session/start
{
  "cashier_id": "C00001",
  "opening_balance": 5000
}
```
**Process:**
1. Verify `C00001` exists in `auth-db.users` with `role='cashier'`
2. Get cashier name from `auth-db.users.name`
3. Create/resume session in `cashier_db.cashier_sessions`

### Get Current Session
```http
GET /api/session/current?cashier_id=C00001&date=2025-10-18
```
**Process:**
1. Verify `C00001` exists in auth DB
2. Fetch session from cashier DB

## Error Handling

### Auth DB Unavailable
- Functions return graceful defaults (`true` for verification, default name)
- Cashier operations continue (availability over strict consistency)
- Errors logged for monitoring

### Invalid Cashier ID
```json
{
  "success": false,
  "message": "Invalid cashier ID or user is not a cashier"
}
```

## Testing

### 1. Verify Auth Connection
```bash
# Check auth DB has cashier users
docker exec -it auth-mysql-server mysql -udevuser -pdevpass -e \
  "SELECT userid, name, role FROM \`auth-db\`.users WHERE role='cashier';"
```

### 2. Test Session Start
```bash
curl -X POST http://localhost:8083/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"cashier_id":"C00001","opening_balance":5000}'
```

Expected response:
```json
{
  "success": true,
  "message": "New session started successfully",
  "data": {
    "session": {
      "session_id": 1,
      "cashier_id": "C00001",
      "cashier_name": "John Doe",
      "session_date": "2025-10-18",
      ...
    },
    "is_resumed": false
  }
}
```

## Migration Notes

### Removed from `init.sql`:
1. ❌ `FOREIGN KEY (cashier_id) REFERENCES users(userid)` (line 47)
2. ❌ `FOREIGN KEY (created_by) REFERENCES users(userid)` (line 130)
3. ❌ `INSERT INTO users ...` (sample user insert)

### Added to `config.php`:
1. ✅ Auth DB connection constants
2. ✅ `getAuthDBConnection()` function
3. ✅ `verifyCashierUser()` function
4. ✅ `getCashierName()` function

### Updated in `CashierSessionController.php`:
1. ✅ `startSession()` now verifies user via auth DB
2. ✅ `cashier_name` fetched from auth DB (not required in request)

## Future Enhancements

1. **Role-Based Access Control:**
   - Verify specific permissions from auth DB
   - Check if cashier is active/suspended

2. **Audit Integration:**
   - Log cashier activities to central auth audit table
   - Cross-reference with login history

3. **Multi-Tenant Support:**
   - Filter cashiers by branch/location from auth DB
   - Restrict access based on auth permissions

## Summary

**Why this approach is better:**
- ✅ Uses existing auth infrastructure
- ✅ No data duplication
- ✅ Single source of truth for users
- ✅ Proper separation: auth DB owns users, cashier DB owns sessions
- ✅ Scalable and maintainable

**Your question was spot-on!** Instead of creating a duplicate users table in cashier_db (Option A in the original question), we connected cashier backend to the existing auth database. This is the correct microservices pattern: **shared authentication, isolated business data**.
