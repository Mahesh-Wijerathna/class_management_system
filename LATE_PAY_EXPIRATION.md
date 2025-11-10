# Late Pay Auto-Expiration System

## Overview
Late pay permissions are automatically expired at the end of each day. When a permission expires, the enrollment's `payment_status` is reset from `'late_pay'` back to `'overdue'`, ensuring students must pay before attending the next day.

## How It Works

### 1. Database Tracking
- `late_pay_permissions` table stores: `student_id`, `class_id`, `permission_date`, `enrollment_id`, `cashier_id`, `reason`
- Each permission has a `permission_date` (YYYY-MM-DD format)
- Permissions are only valid for the specific date they were issued

### 2. Expiration Logic
The `expireYesterdayPermissions()` method:
1. Finds all enrollments with `payment_status = 'late_pay'`
2. Checks if their `permission_date` is before today
3. Resets `payment_status` to `'overdue'` for expired permissions

### 3. API Endpoint
**POST** `http://localhost:8087/routes.php/late_pay/expire`

**Response:**
```json
{
  "success": true,
  "message": "Expired 3 late pay permissions - status changed to overdue",
  "expired_count": 3,
  "checked_enrollments": 3
}
```

## Automatic Scheduling

### Option 1: Windows Task Scheduler (Recommended for Windows)
1. Open Task Scheduler
2. Create New Task:
   - **Name**: Expire Late Pay Permissions
   - **Trigger**: Daily at 11:59 PM
   - **Action**: Start a program
   - **Program**: `powershell.exe`
   - **Arguments**: `-ExecutionPolicy Bypass -File "d:\Academic\Semester 7\Final Undergraduate Project\frontend_project\class_management_system\scripts\expire_late_pay.ps1"`
3. Save the task

### Option 2: Manual Command (For Testing)
```powershell
# Test the expiration API directly
Invoke-RestMethod -Uri "http://localhost:8087/routes.php/late_pay/expire" -Method Post

# Or run the PowerShell script
powershell.exe -File "scripts\expire_late_pay.ps1"
```

### Option 3: Linux Cron Job
```bash
# Edit crontab
crontab -e

# Add this line to run at 11:59 PM daily
59 23 * * * /path/to/scripts/expire_late_pay.sh
```

## Manual Expiration

### Via API Call
```javascript
// Call from frontend or Postman
fetch('http://localhost:8087/routes.php/late_pay/expire', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => console.log(data));
```

### Via PowerShell
```powershell
cd "d:\Academic\Semester 7\Final Undergraduate Project\frontend_project\class_management_system"
.\scripts\expire_late_pay.ps1
```

### Via Database Query
```sql
-- Reset all late_pay enrollments from yesterday or earlier
UPDATE enrollments e
JOIN late_pay_permissions lpp ON e.id = lpp.enrollment_id
SET e.payment_status = 'overdue'
WHERE e.payment_status = 'late_pay' 
AND lpp.permission_date < CURDATE();
```

## Logging
- PowerShell script logs to: `logs/late_pay_expiry.log`
- Bash script logs to: `/var/log/late_pay_expiry.log`
- Log format:
  ```
  [2025-11-10 23:59:00] Starting late pay expiration process...
  [2025-11-10 23:59:01] SUCCESS: {"success":true,"expired_count":2}
  [2025-11-10 23:59:01] Expired 2 late pay permissions
  [2025-11-10 23:59:01] Late pay expiration process completed
  ---
  ```

## Testing the Expiration

### 1. Create a Test Permission
```sql
-- Insert a permission with yesterday's date
INSERT INTO late_pay_permissions 
(student_id, class_id, enrollment_id, permission_date, cashier_id, reason)
VALUES ('S02326', 123, 456, '2025-11-09', 'CASH001', 'Test permission');

-- Set enrollment to late_pay status
UPDATE enrollments SET payment_status = 'late_pay' WHERE id = 456;
```

### 2. Run Expiration
```powershell
Invoke-RestMethod -Uri "http://localhost:8087/routes.php/late_pay/expire" -Method Post
```

### 3. Verify Result
```sql
-- Check if status was reset
SELECT id, student_id, class_id, payment_status 
FROM enrollments 
WHERE id = 456;
-- Should show payment_status = 'overdue'
```

## Important Notes

1. **Date-Specific**: Permissions are ONLY valid for the date issued
2. **Automatic Reset**: Status changes from `'late_pay'` → `'overdue'` at day end
3. **No Grace Period**: Expiration happens exactly at the scheduled time
4. **Reprint Capability**: Cashiers can reprint notes multiple times on the same day
5. **Database Cleanup**: Old permissions (30+ days) can be cleaned via `/late_pay/cleanup`
6. **Student Access**: After expiration, students will be blocked from attendance until they pay

## Troubleshooting

### Permissions Not Expiring
1. Check if scheduled task is running:
   ```powershell
   Get-ScheduledTask -TaskName "Expire Late Pay Permissions"
   ```
2. Check log file for errors
3. Verify API is accessible:
   ```powershell
   curl http://localhost:8087/routes.php/test
   ```

### Manual Fix
If auto-expiration fails, run manually:
```powershell
cd backend/class
docker exec -i class-mysql-server mysql -uroot -proot class_db -e "
UPDATE enrollments e
JOIN late_pay_permissions lpp ON e.id = lpp.enrollment_id
SET e.payment_status = 'overdue'
WHERE e.payment_status = 'late_pay' 
AND lpp.permission_date < CURDATE();
"
```

## Security Considerations
- The expiration endpoint requires no authentication (internal cron job)
- Consider adding API key if exposed to network
- Logs contain sensitive data - restrict file permissions
- Keep log files rotated to prevent disk space issues

## Future Enhancements
- [ ] Email notifications for expired permissions
- [ ] Dashboard widget showing expiring permissions
- [ ] Automatic payment reminders after expiration
- [ ] Weekly summary report of late pay usage
