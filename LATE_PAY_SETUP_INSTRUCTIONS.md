# Late Pay System - Quick Setup Instructions

## ✅ What Was Implemented

### 1. Database Migration
**File:** `backend/class/mysql/add_late_pay_permissions.sql`
- Creates `late_pay_permissions` table
- Adds `'late_pay'` status to enrollment payment_status ENUM

### 2. Backend API
**File:** `backend/class/src/LatePayController.php`
- Handles late pay permission issuance and checking
- Routes integrated in `backend/class/src/routes.php`

### 3. Attendance Backend Integration
**File:** `backend/attendance-backend/src/AttendanceController.php`
- Added `hasLatePayPermission()` helper function
- Updated payment checks to allow attendance when late pay permission exists
- Checks permission at 3 critical points:
  1. When status is `'late_pay'`
  2. Before blocking expired grace period
  3. Before blocking unpaid status

### 4. Frontend Integration
**File:** `frontend/src/pages/dashboard/cashierDashboard/CashierDashboard.jsx`
- Late Pay button calls API to issue permission
- Button disabled when permission already issued
- Updates enrollment status to `'late_pay'`
- Refreshes student data after issuing

---

## 🚀 Setup Steps

### Step 1: Run Database Migration
```sql
-- Connect to your MySQL database
mysql -u root -p class_db

-- Run the migration
source backend/class/mysql/add_late_pay_permissions.sql;

-- Verify table created
SHOW TABLES LIKE 'late_pay_permissions';
DESC late_pay_permissions;

-- Verify ENUM updated
SHOW COLUMNS FROM enrollments LIKE 'payment_status';
```

### Step 2: Restart Backend Services
Make sure all backend services are running:
- Class Backend (port 8087)
- Attendance Backend (check your port)

### Step 3: Test the Workflow

#### Test 1: Issue Late Pay Permission
1. Open Cashier Dashboard
2. Scan a student with unpaid status
3. Click "Late Pay" button on a class
4. Expected: 
   - ✅ Success toast appears
   - ✅ Button changes to "Late Pay Issued" and becomes disabled
   - ✅ Tooltip shows "Late pay already issued for today"

#### Test 2: Verify Database Record
```sql
-- Check if permission was created
SELECT * FROM late_pay_permissions 
WHERE permission_date = CURDATE()
ORDER BY issued_at DESC
LIMIT 5;

-- Check enrollment status updated
SELECT student_id, class_id, payment_status 
FROM enrollments 
WHERE payment_status = 'late_pay';
```

#### Test 3: Test Attendance Marking
1. Try to mark attendance for the student with late pay permission
2. Expected: ✅ Attendance should be allowed (not blocked)
3. Check attendance record created:
```sql
SELECT * FROM attendance_records 
WHERE student_id = 'YOUR_STUDENT_ID' 
AND DATE(join_time) = CURDATE();
```

#### Test 4: Verify Next Day Blocking
1. Change system date to tomorrow (or wait until tomorrow)
2. Try to mark attendance for same student/class
3. Expected: ❌ Attendance should be blocked (permission expired)

---

## 📋 API Endpoints

### Issue Permission
```
POST http://localhost:8087/routes.php/late_pay/issue
Body: {
  "student_id": "STU001",
  "class_id": 123,
  "enrollment_id": 456,
  "cashier_id": "CASH001",
  "reason": "Allowed late payment for today only"
}
```

### Check Permission
```
GET http://localhost:8087/routes.php/late_pay/check?student_id=STU001&class_id=123
```

### Get Cashier's Permissions (for KPI)
```
GET http://localhost:8087/routes.php/late_pay/cashier/CASH001?date=2024-11-08
```

---

## 🔍 How Attendance Check Works

```php
// Attendance Backend Logic Flow:

1. Student tries to mark attendance
2. System checks enrollment payment status
3. If status is 'late_pay' OR hasLatePayPermission() returns true:
   → ALLOW attendance (even if unpaid)
4. If no permission and unpaid:
   → BLOCK attendance
```

**Critical:** Permission is DATE-SPECIFIC. Only valid for the exact `permission_date` in the database!

---

## 🐛 Troubleshooting

### Issue: Late Pay button doesn't work
**Check:**
1. Browser console for errors
2. Backend running: `http://localhost:8087/routes.php/test`
3. Database migration ran successfully

### Issue: Attendance still blocked after late pay
**Check:**
1. `late_pay_permissions` table has record for today
2. Attendance backend has latest code
3. Restart attendance backend service
4. Check attendance backend logs

### Issue: Button doesn't disable after clicking
**Check:**
1. API call successful (check Network tab)
2. `loadStudentData()` called to refresh
3. `payment_status` updated in database

---

## ✅ Success Indicators

1. ✅ Database table `late_pay_permissions` exists
2. ✅ Enrollment `payment_status` can be `'late_pay'`
3. ✅ Late Pay button appears in cashier dashboard
4. ✅ Button disabled after clicking once
5. ✅ Record inserted in database with today's date
6. ✅ Attendance allowed for student TODAY
7. ✅ Attendance blocked TOMORROW (permission expired)

---

## 📝 Files Modified

### Backend
- ✅ `backend/class/mysql/add_late_pay_permissions.sql` (NEW)
- ✅ `backend/class/src/LatePayController.php` (NEW)
- ✅ `backend/class/src/routes.php` (MODIFIED)
- ✅ `backend/attendance-backend/src/AttendanceController.php` (MODIFIED)

### Frontend
- ✅ `frontend/src/pages/dashboard/cashierDashboard/CashierDashboard.jsx` (MODIFIED)

---

## 🎯 Key Points

1. **One Day Only** - Permission valid ONLY for the specific date
2. **One Permission Per Day** - Can't issue multiple for same student/class/date
3. **Automatic Blocking** - Next day, student must pay or get new permission
4. **Status Update** - Enrollment status becomes `'late_pay'`
5. **Button Disabled** - Can't click again once issued for today

---

## 🚀 Next Steps (Optional Enhancements)

1. **Auto-Reset Status** - Cron job to reset `'late_pay'` to `'pending'` daily
2. **Permission History** - View all late pay permissions issued
3. **Reports** - Track which students frequently need permissions
4. **SMS Notification** - Alert student when permission granted
5. **Multi-day Permissions** - Allow 2-3 day permissions

---

**Setup Complete! 🎉**
Student can now attend class on the specific day when late pay permission is issued by cashier.
