# Physical Student Registration - Admission Fee Input Feature

## Problem Statement
When registering a new student through the Physical Student Registration form, there was an "Admission Fee Collected (Optional)" checkbox, but it did not have an input field to specify the actual admission fee amount. The cashier had no way to enter the admission fee value during registration, making it impossible to record variable admission fee amounts in the database.

## Solution Overview
Added a **dynamic admission fee amount input field** that appears when the cashier checks the "Admission Fee Collected (Optional)" checkbox. This implementation follows the same pattern used in the **Quick Enrollment modal** in the Cashier Dashboard.

## Changes Made

### File: `PhysicalStudentRegisterTab.jsx`

#### 1. Added Import for Payment API
```jsx
import { createPayment } from '../../../api/payments';
```

#### 2. Added State Variables for Admission Fee
```jsx
// Admission fee state variables
const [collectAdmissionFee, setCollectAdmissionFee] = useState(false);
const [admissionFeeAmount, setAdmissionFeeAmount] = useState(5000); // Default admission fee
```

#### 3. Added Admission Fee UI in Step 3 (Review Step)
Located after the parent mobile number field and before the Back/Register buttons:

```jsx
{/* Admission Fee Section */}
<div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mt-4">
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={collectAdmissionFee}
      onChange={(e) => setCollectAdmissionFee(e.target.checked)}
      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <div className="flex-1">
      <span className="font-semibold text-[#1a365d]">Admission Fee Collected (Optional)</span>
      <div className="text-xs text-green-700 mt-1">
        ✅ Check this ONLY if the student paid admission fee AND will enroll in Physical Only/Hybrid 1/Hybrid 2/Hybrid 4 classes.
      </div>
      <div className="text-xs text-blue-700 mt-1">
        ℹ️ Not required for Online Only/ Hybrid 3 students. Can be collected later via Cashier Dashboard.
      </div>
    </div>
  </label>
  
  {/* Admission Fee Amount Input - Only show when checkbox is checked */}
  {collectAdmissionFee && (
    <div className="mt-4 bg-white rounded-lg p-3 border-2 border-blue-400">
      <label className="block text-sm font-semibold text-[#1a365d] mb-2">
        Admission Fee Amount (LKR) *
      </label>
      <input
        type="number"
        value={admissionFeeAmount}
        onChange={(e) => setAdmissionFeeAmount(Number(e.target.value) || 0)}
        className="w-full px-4 py-3 border-2 border-[#1a365d] rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg font-semibold"
        min="0"
        step="100"
        placeholder="Enter admission fee amount"
      />
      <div className="text-xs text-slate-600 mt-2">
        💡 Default: LKR 5,000 (can be adjusted)
      </div>
    </div>
  )}
</div>
```

**Features:**
- ✅ Checkbox to enable/disable admission fee collection
- ✅ Input field appears only when checkbox is checked
- ✅ Default amount of LKR 5,000 (editable)
- ✅ Number input with validation (min: 0, step: 100)
- ✅ Clear instructions about when to collect admission fee
- ✅ Professional styling matching the existing form

#### 4. Added Payment Recording Logic in `handleRegister()`
After barcode saving and before WhatsApp message:

```jsx
// Record admission fee payment if checkbox is checked
if (collectAdmissionFee && admissionFeeAmount > 0) {
  try {
    const admissionPayload = {
      paymentType: 'admission_fee',
      paymentMethod: 'cash',
      channel: 'physical',
      studentId: response.userid,
      amount: admissionFeeAmount,
      notes: 'Admission Fee - Collected during physical registration',
    };
    
    const admissionPaymentRes = await createPayment(admissionPayload);
    
    if (admissionPaymentRes?.success) {
      console.log('✅ Admission fee payment recorded: LKR', admissionFeeAmount);
    } else {
      console.error('❌ Failed to record admission fee payment:', admissionPaymentRes?.message);
      // Show warning but don't fail registration
      alert('⚠️ Registration successful but admission fee payment recording failed.\n\nPlease record the admission fee payment manually in the Cashier Dashboard.');
    }
  } catch (error) {
    console.error('Error recording admission fee payment:', error);
    alert('⚠️ Registration successful but admission fee payment recording failed.\n\nPlease record the admission fee payment manually in the Cashier Dashboard.');
  }
}
```

**Features:**
- ✅ Only records payment if checkbox is checked AND amount > 0
- ✅ Uses the same `createPayment` API as the Quick Enrollment modal
- ✅ Payment type: `admission_fee`
- ✅ Payment method: `cash` (physical registration always uses cash)
- ✅ Channel: `physical`
- ✅ Includes descriptive notes for tracking
- ✅ Doesn't fail registration if payment recording fails (shows warning instead)

#### 5. Reset Admission Fee State When Registering Another Student
```jsx
// Reset admission fee state
setCollectAdmissionFee(false);
setAdmissionFeeAmount(5000);
```

## Database Integration

### Payment Record Structure
When the admission fee is collected, the following record is created in the `payment` table via the payment backend API:

```json
{
  "paymentType": "admission_fee",
  "paymentMethod": "cash",
  "channel": "physical",
  "studentId": "S0XXXX",
  "amount": 5000,
  "notes": "Admission Fee - Collected during physical registration"
}
```

### Backend API Endpoint
- **Endpoint**: `POST http://localhost:8088/routes.php/create_payment`
- **Function**: `createPayment()` from `src/api/payments.js`
- **Response**: Returns transaction ID and success status

## User Workflow

### Scenario 1: Collecting Admission Fee During Registration
1. Cashier fills out student registration form (Steps 1 & 2)
2. On Step 3 (Review), cashier checks "Admission Fee Collected" checkbox
3. Input field appears with default amount (LKR 5,000)
4. Cashier can adjust the amount if needed (e.g., 3,000 or 10,000)
5. Cashier clicks "Register"
6. System:
   - ✅ Creates student account
   - ✅ Generates student ID and barcode
   - ✅ Records admission fee payment in database
   - ✅ Sends welcome WhatsApp message
7. Registration success screen shows student ID and barcode

### Scenario 2: Deferring Admission Fee
1. Cashier fills out student registration form
2. On Step 3, cashier **does not check** the admission fee checkbox
3. Cashier clicks "Register"
4. System:
   - ✅ Creates student account
   - ✅ Generates student ID and barcode
   - ❌ Does not record admission fee payment
   - ✅ Sends welcome WhatsApp message
5. Admission fee can be collected later via Cashier Dashboard

## Error Handling

### Payment Recording Failure
If the payment API fails while recording the admission fee:
- ✅ Student registration is **NOT rolled back** (student is still created)
- ✅ Alert is shown to the cashier
- ✅ Cashier is instructed to record payment manually in the Cashier Dashboard
- ✅ Error is logged to console for debugging

### Why Not Roll Back?
- Student account creation and payment recording are separate operations
- Rolling back would require complex transaction management across multiple backends
- It's safer to allow manual payment recording than to lose the entire registration

## Validation Rules

| Field | Validation |
|-------|-----------|
| **Checkbox** | Optional - No validation |
| **Amount** | Must be ≥ 0 if checkbox is checked |
| **Amount** | Number input with step of 100 |
| **Payment Recording** | Only triggered if checkbox is checked AND amount > 0 |

## Consistency with Quick Enrollment Modal

This implementation follows the **exact same pattern** as the Quick Enrollment modal in the Cashier Dashboard:

| Feature | Quick Enrollment | Physical Registration |
|---------|-----------------|---------------------|
| Default Amount | LKR 1,000 | LKR 5,000 |
| Editable Amount | ✅ Yes | ✅ Yes |
| Payment Type | `admission_fee` | `admission_fee` |
| Payment Method | `cash` | `cash` |
| Channel | `physical` | `physical` |
| Error Handling | Non-blocking | Non-blocking |

## Testing Checklist

- [x] Checkbox appears on Step 3 (Review)
- [x] Input field appears when checkbox is checked
- [x] Input field hides when checkbox is unchecked
- [x] Default value is LKR 5,000
- [x] Amount can be edited
- [x] Registration succeeds when checkbox is unchecked
- [x] Registration succeeds when checkbox is checked with valid amount
- [x] Payment is recorded in database when checkbox is checked
- [x] Payment is NOT recorded when checkbox is unchecked
- [x] Error alert shows if payment recording fails
- [x] Student is still created even if payment recording fails
- [x] State resets when clicking "Register Another Student"

## Benefits

✅ **Flexible Admission Fee**: Cashiers can now enter variable admission fee amounts  
✅ **Database Tracking**: All admission fees are properly recorded in the payment system  
✅ **Consistent UX**: Matches the Quick Enrollment modal pattern  
✅ **Clear Instructions**: Guidance on when to collect admission fees  
✅ **Non-Blocking**: Payment failures don't prevent student registration  
✅ **Audit Trail**: All payments include notes for tracking purposes  

## Future Enhancements

1. **Add receipt printing** for admission fee payments during registration
2. **Show payment confirmation** in the success screen
3. **Add payment history** link in the success screen
4. **Validate against duplicate** admission fee payments
5. **Add payment method selection** (cash/bank transfer/card)

## Date
Implemented: October 17, 2025  
Developer: GitHub Copilot  
Reviewed: Pending
