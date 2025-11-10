# Payment Outstanding & Update Issues - FIXED

## Issues Fixed

### 1. Outstanding Balance Calculation
**Problem:** Outstanding was calculated using original fee, not discounted fee
- Example: Class fee LKR 3,000 with -450 discount = LKR 2,550
- But outstanding showed LKR 3,000 instead of considering discount

**Solution:** 
Modified calculation in `CashierDashboard.jsx` (line ~1083):
```javascript
// If totalFee is using original fee but class has discount, recalculate
if (totalFee === monthly && isRevisionClass && discountPrice > 0) {
  totalFee = finalMonthlyFee;
}
const outstanding = totalFee - paidAmount;
```

### 2. Outstanding Not Updating After Payment
**Problem:** After making payment, outstanding amount didn't update
- Payment was recorded in financial_records
- But enrollment's `paid_amount` was not updated

**Solution:**
Added backend endpoint to update enrollment payment:

**Backend:** `backend/class/src/routes.php`
```php
} elseif ($path === '/update_enrollment_payment') {
    $studentId = $input['student_id'];
    $classId = $input['class_id'];
    $paymentAmount = $input['payment_amount'];
    $result = $enrollmentController->updateEnrollmentPayment($studentId, $classId, $paymentAmount);
    echo json_encode($result);
}
```

**Backend:** `backend/class/src/EnrollmentController.php`
- Added new method `updateEnrollmentPayment()` 
- Updates `paid_amount` by adding new payment
- Updates `payment_status` (pending/partial/paid)
- Returns new outstanding balance

**Frontend:** `CashierDashboard.jsx` (line ~237)
```javascript
// After payment success, update enrollment
await fetch('http://localhost:8087/routes.php/update_enrollment_payment', {
  method: 'POST',
  body: JSON.stringify({
    student_id: student.studentId,
    class_id: classData.classId,
    payment_amount: finalFee
  })
});
```

## Files Modified

### Frontend:
1. `frontend/src/pages/dashboard/cashierDashboard/CashierDashboard.jsx`
   - Line ~1083: Fixed outstanding calculation to use discounted fee
   - Line ~237: Added enrollment payment update after payment

### Backend:
1. `backend/class/src/routes.php`
   - Added `/update_enrollment_payment` endpoint

2. `backend/class/src/EnrollmentController.php`
   - **NEEDS MANUAL ADDITION:** Add method from `ADD_TO_ENROLLMENT_CONTROLLER.php`

## Installation Steps

### 1. Add Method to EnrollmentController

Open `backend/class/src/EnrollmentController.php` and add this method **BEFORE** the final closing `}`:

```php
/**
 * Update enrollment payment amount
 */
public function updateEnrollmentPayment($studentId, $classId, $paymentAmount) {
    try {
        $this->db->begin_transaction();
        
        // Get current enrollment
        $stmt = $this->db->prepare("
            SELECT id, paid_amount, total_fee 
            FROM enrollments 
            WHERE student_id = ? AND class_id = ? AND status = 'active'
            LIMIT 1
        ");
        $stmt->bind_param("si", $studentId, $classId);
        $stmt->execute();
        $result = $stmt->get_result();
        $enrollment = $result->fetch_assoc();
        
        if (!$enrollment) {
            return ['success' => false, 'message' => 'Enrollment not found'];
        }
        
        // Calculate new paid amount
        $newPaidAmount = floatval($enrollment['paid_amount']) + floatval($paymentAmount);
        $totalFee = floatval($enrollment['total_fee']);
        
        // Determine new payment status
        $newPaymentStatus = 'pending';
        if ($newPaidAmount >= $totalFee) {
            $newPaymentStatus = 'paid';
        } elseif ($newPaidAmount > 0) {
            $newPaymentStatus = 'partial';
        }
        
        // Update enrollment
        $updateStmt = $this->db->prepare("
            UPDATE enrollments 
            SET paid_amount = ?, 
                payment_status = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $updateStmt->bind_param("dsi", $newPaidAmount, $newPaymentStatus, $enrollment['id']);
        
        if ($updateStmt->execute()) {
            $this->db->commit();
            return [
                'success' => true,
                'message' => 'Payment updated successfully',
                'data' => [
                    'paid_amount' => $newPaidAmount,
                    'payment_status' => $newPaymentStatus,
                    'outstanding' => $totalFee - $newPaidAmount
                ]
            ];
        } else {
            $this->db->rollback();
            return ['success' => false, 'message' => 'Failed to update enrollment'];
        }
        
    } catch (Exception $e) {
        $this->db->rollback();
        error_log("Error updating enrollment payment: " . $e->getMessage());
        return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
    }
}
```

### 2. Restart Backend Containers

```bash
cd backend
docker-compose restart class
```

### 3. Test

1. Load a student with outstanding balance
2. Click "Pay Now"
3. Make payment
4. Outstanding should decrease by payment amount
5. When fully paid, should show "Already Paid This Month"

## Testing Checklist

- [ ] Outstanding calculation shows correct amount (with discount applied)
- [ ] After payment, outstanding decreases
- [ ] After full payment, shows "Already Paid This Month"
- [ ] Payment History shows payment record
- [ ] Enrollment in class backend has updated `paid_amount`

## Status
✅ Frontend code: COMPLETE
✅ Backend endpoint: COMPLETE
⏳ Backend method: **NEEDS MANUAL ADDITION** (see above)

## Date
October 9, 2025
