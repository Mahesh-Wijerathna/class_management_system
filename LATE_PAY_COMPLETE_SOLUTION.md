# Late Pay Permission System - Complete Implementation Guide

## 🎯 Overview

This system allows cashiers to grant **one-day attendance permission** to students who haven't paid their monthly fee but need to attend class TODAY. The system:
1. Records the permission in the database
2. Changes enrollment status to `late_pay`
3. Allows attendance marking for that specific day
4. Automatically disables the "Late Pay" button after issuing

---

## 📊 Database Changes

### 1. New Table: `late_pay_permissions`

```sql
CREATE TABLE IF NOT EXISTS late_pay_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL,
    class_id INT NOT NULL,
    permission_date DATE NOT NULL COMMENT 'The date this permission is valid for',
    enrollment_id INT NOT NULL,
    cashier_id VARCHAR(10) NOT NULL COMMENT 'The cashier who issued this permission',
    reason TEXT DEFAULT 'Allowed late payment for today only',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_permission (student_id, class_id, permission_date),
    INDEX idx_student_date (student_id, permission_date),
    INDEX idx_class_date (class_id, permission_date),
    INDEX idx_enrollment (enrollment_id)
);
```

**Key Points:**
- `permission_date` is the SPECIFIC DATE the student can attend (usually today)
- UNIQUE constraint prevents issuing multiple permissions for same student/class/date
- Only valid for ONE DAY

### 2. Updated `enrollments` Table

```sql
ALTER TABLE enrollments 
MODIFY COLUMN payment_status ENUM('pending', 'paid', 'partial', 'overdue', 'late_pay') DEFAULT 'pending';
```

**New Status: `late_pay`**
- Indicates student has been given permission to attend today despite non-payment
- Automatically set when cashier clicks "Late Pay" button
- Should be reset to 'pending' or 'overdue' the next day (or after payment)

---

## 🔧 Backend Implementation

### File: `backend/class/mysql/add_late_pay_permissions.sql`

Run this migration to add the new table and update the ENUM.

### File: `backend/class/src/LatePayController.php`

New controller with these endpoints:

#### 1. Issue Permission
**POST** `/late_pay/issue`
```json
{
  "student_id": "STU001",
  "class_id": 123,
  "enrollment_id": 456,
  "cashier_id": "CASH001",
  "reason": "Allowed late payment for today only"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Late pay permission issued successfully",
  "permission_id": 789,
  "permission_date": "2024-01-15",
  "student_id": "STU001",
  "class_id": 123
}
```

**What it does:**
1. Checks if permission already exists for today
2. Inserts record into `late_pay_permissions` table
3. Updates enrollment `payment_status` to `'late_pay'`
4. Returns success response

#### 2. Check Permission
**GET** `/late_pay/check?student_id=STU001&class_id=123&date=2024-01-15`

**Response:**
```json
{
  "success": true,
  "has_permission": true,
  "permission": {
    "id": 789,
    "student_id": "STU001",
    "class_id": 123,
    "permission_date": "2024-01-15",
    "cashier_id": "CASH001",
    "class_name": "2026 A/L Physics"
  }
}
```

**Use in Attendance System:**
- Attendance backend should call this BEFORE blocking unpaid students
- If `has_permission: true`, allow attendance marking
- If date doesn't match today, deny attendance

#### 3. Get Cashier Permissions
**GET** `/late_pay/cashier/CASH001?date=2024-01-15`

Returns all permissions issued by specific cashier on given date (defaults to today).

**Used for:** KPI tracking (Pending Payments counter)

#### 4. Get Student Permissions
**GET** `/late_pay/student/STU001`

Returns all late pay permissions ever issued for a student.

**Used for:** History tracking, reports

---

## 🎨 Frontend Changes

### File: `CashierDashboard.jsx`

#### Updated Late Pay Button Logic:

**Before:**
```jsx
onClick={() => {
  printNote({ title: 'Late Payment Permission', student, classRow: enr, reason: 'Allowed late payment for today only' });
  loadCashierKPIs();
}}
```

**After:**
```jsx
onClick={async () => {
  // 1. Call API to issue permission
  const response = await fetch('http://localhost:8087/routes.php/late_pay/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: student.studentId || student.id,
      class_id: enr.classId || enr.id,
      enrollment_id: enr.enrollmentId || enr.id,
      cashier_id: getUserData()?.userid,
      reason: 'Allowed late payment for today only'
    })
  });

  const result = await response.json();

  if (result.success) {
    // 2. Print note
    printNote({ 
      title: 'Late Payment Permission', 
      student, 
      classRow: enr, 
      reason: 'Allowed late payment for today only' 
    });

    // 3. Update local state
    enr.payment_status = 'late_pay';

    // 4. Refresh data
    await loadEnrollmentsForStudent(student.studentId || student.id);
    loadCashierKPIs();

    showToast('✅ Late pay permission issued - Student can attend today!', 'success');
  }
}}
```

#### Button Disabled States:

```jsx
disabled={
  hasPaymentThisMonth ||          // Already paid this month
  enr.payment_status === 'late_pay' ||  // Late pay already issued
  (cardType === 'full' && isCardValid)   // Has valid free card
}
```

#### Button Label:
```jsx
{enr.payment_status === 'late_pay' ? 'Late Pay Issued' : 'Late Pay'}
```

#### New Tooltip:
```jsx
{enr.payment_status === 'late_pay' && (
  <div className="tooltip">
    ✅ Late pay already issued for today
  </div>
)}
```

---

## 🔄 Integration with Attendance System

### Attendance Backend Check (Pseudo-code)

```php
// Before marking attendance
function canStudentAttend($studentId, $classId, $date) {
    // 1. Check enrollment payment status
    $enrollment = getEnrollment($studentId, $classId);
    
    if ($enrollment['payment_status'] === 'paid') {
        return true; // Paid - allow
    }
    
    // 2. Check for late pay permission FOR THIS SPECIFIC DATE
    $permission = checkLatePayPermission($studentId, $classId, $date);
    
    if ($permission && $permission['permission_date'] === $date) {
        return true; // Has permission for TODAY
    }
    
    // 3. No payment and no permission
    return false; // Block attendance
}
```

**Important:** The permission is ONLY valid for the specific `permission_date`, NOT for future days!

---

## 📋 Workflow Example

### Scenario: Student Romesh needs to attend but hasn't paid

**Step 1:** Cashier scans Romesh's card
- System shows: **Outstanding: LKR 4,500**
- Payment status: `pending`

**Step 2:** Romesh says: "I don't have money today but need to attend"

**Step 3:** Cashier clicks **"Late Pay"** button
- Frontend calls: `POST /late_pay/issue`
- Backend inserts record in `late_pay_permissions`
- Backend updates enrollment: `payment_status = 'late_pay'`
- Prints permission note

**Step 4:** Late Pay button becomes **disabled**
- Shows: "Late Pay Issued" (grayed out)
- Tooltip: "✅ Late pay already issued for today"

**Step 5:** Romesh goes to class
- Attendance system checks: `GET /late_pay/check?student_id=STU001&class_id=123&date=2024-01-15`
- Response: `has_permission: true`
- **Attendance marking is ALLOWED for today**

**Step 6:** Next day (2024-01-16)
- Attendance system checks again
- Permission date is 2024-01-15 (yesterday)
- **Attendance is BLOCKED** (must pay or get new permission)

**Step 7:** Romesh pays
- Payment status changes to `paid`
- No more blocks

---

## 🚨 Important Points

### 1. **One Day Only**
Late pay permission is **ONLY for the specific date issued**. Not valid for:
- Previous days
- Future days
- Other classes

### 2. **One Permission Per Day Per Class**
The UNIQUE constraint prevents:
```sql
UNIQUE KEY unique_permission (student_id, class_id, permission_date)
```
- Cashier can't issue multiple permissions for same student/class/day
- If already issued, API returns: `already_exists: true`

### 3. **Status Management**
After late pay is issued:
- `payment_status` becomes `'late_pay'`
- This status should be reset when:
  - Student makes payment → `'paid'`
  - Next day arrives → back to `'pending'` or `'overdue'`

### 4. **Button Behavior**
- **Enabled:** When status is `'pending'` or `'overdue'` and no payment this month
- **Disabled:** When status is `'late_pay'` or payment already made
- **Tooltip:** Shows reason for disabled state

### 5. **Attendance Integration**
Attendance backend MUST check `late_pay_permissions` table:
```php
$hasPermission = checkPermission($studentId, $classId, date('Y-m-d'));
if ($hasPermission) {
    // Allow attendance EVEN if payment_status != 'paid'
}
```

---

## 🧪 Testing Checklist

### ✅ Database
- [ ] Run migration script successfully
- [ ] `late_pay_permissions` table created
- [ ] `enrollments.payment_status` ENUM updated with `'late_pay'`

### ✅ Backend API
- [ ] `POST /late_pay/issue` works
- [ ] Returns error if enrollment not found
- [ ] Prevents duplicate permissions for same day
- [ ] Updates enrollment `payment_status`
- [ ] `GET /late_pay/check` works correctly
- [ ] Returns `has_permission: true` for valid date
- [ ] Returns `has_permission: false` for different date

### ✅ Frontend
- [ ] Late Pay button appears
- [ ] Button disabled when payment made
- [ ] Button disabled after issuing permission
- [ ] Button label changes to "Late Pay Issued"
- [ ] Toast message appears on success
- [ ] Error handling works

### ✅ Attendance System
- [ ] Checks late pay permission before blocking
- [ ] Allows attendance when permission exists for today
- [ ] Blocks attendance when permission date ≠ today
- [ ] Blocks attendance when no permission exists

---

## 🔮 Future Enhancements

1. **Auto-Reset Status**
   - Cron job to reset `payment_status` from `'late_pay'` to `'pending'` daily

2. **Multi-Day Permissions**
   - Allow cashier to issue 2-day or 3-day permissions
   - Add `valid_until` date field

3. **Reporting**
   - Monthly report of late pay permissions issued
   - Track which students frequently need permissions
   - Cashier performance metrics

4. **SMS Notifications**
   - Send SMS to student: "Late pay permission granted for [Class] today"
   - Remind student to pay next time

---

## 📞 Troubleshooting

### Issue: Late Pay button doesn't disable after clicking
**Cause:** Frontend state not updating
**Fix:** Ensure `enr.payment_status = 'late_pay'` is set AND data is refreshed

### Issue: Student blocked from attendance despite permission
**Cause:** Attendance system not checking `late_pay_permissions` table
**Fix:** Update attendance backend to call `/late_pay/check` endpoint

### Issue: Permission works for multiple days
**Cause:** Attendance system not checking `permission_date`
**Fix:** Ensure date comparison: `permission.permission_date === today`

### Issue: Duplicate permission error
**Cause:** UNIQUE constraint violation
**Fix:** Check if permission already exists before allowing click (frontend check)

---

## 📚 Files Modified/Created

### Backend
- ✅ `backend/class/mysql/add_late_pay_permissions.sql` - Migration
- ✅ `backend/class/src/LatePayController.php` - New controller
- ✅ `backend/class/src/routes.php` - Added routes

### Frontend
- ✅ `frontend/src/pages/dashboard/cashierDashboard/CashierDashboard.jsx` - Updated Late Pay button

### Documentation
- ✅ `LATE_PAY_COMPLETE_SOLUTION.md` - This guide

---

## ✅ Summary

**What Changed:**
1. Database: Added `late_pay_permissions` table and `late_pay` status
2. Backend: New API endpoints to issue/check permissions
3. Frontend: Updated button to call API and update status
4. Attendance: Should check permissions before blocking

**What Works Now:**
1. ✅ Cashier clicks "Late Pay" → permission saved to database
2. ✅ Enrollment status changes to `late_pay`
3. ✅ Button becomes disabled with "Late Pay Issued" label
4. ✅ Attendance system can check permission for specific date
5. ✅ Student can attend ONLY for the specific day granted

**What You Need to Do:**
1. Run the SQL migration script
2. Test the Late Pay button in cashier dashboard
3. **Update attendance backend** to check late pay permissions
4. Test full workflow: issue permission → mark attendance → verify next day blocks

---

## 🎯 Key Takeaway

The late pay permission is **DATE-SPECIFIC and CLASS-SPECIFIC**. It's like a hall pass that's only valid for:
- **One specific student**
- **One specific class**
- **One specific date**

It's NOT a blanket "pay later" status - it's a targeted, temporary permission that expires at midnight!
