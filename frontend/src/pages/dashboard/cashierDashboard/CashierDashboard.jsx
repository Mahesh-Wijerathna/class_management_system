import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { FaLock, FaLockOpen, FaSignOutAlt, FaBarcode, FaUserPlus, FaMoneyBill, FaHistory, FaFileInvoice, FaStickyNote, FaSearch, FaCamera, FaUser, FaPhone, FaGraduationCap, FaClock, FaExclamationTriangle, FaCheckCircle, FaEdit, FaPlus } from 'react-icons/fa';
import { getUserData, logout as authLogout } from '../../../api/apiUtils';
import { getBarcode as apiGetBarcode } from '../../../api/auth';
import { getStudentById } from '../../../api/students';
import { getStudentPayments, createPayment, generateInvoice } from '../../../api/payments';
import { getActiveClasses } from '../../../api/classes';
import PhysicalStudentRegisterTab from '../adminDashboard/PhysicalStudentRegisterTab';
import BarcodeScanner from '../../../components/BarcodeScanner';

const Section = React.memo(({ title, children, right }) => (
  <div className="bg-white rounded-md shadow p-4">
    <div className="flex items-center justify-between border-b pb-2 mb-3">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {right}
    </div>
    {children}
  </div>
));

// Memoized search input component to prevent focus loss
const ClassSearchInput = React.memo(({ value, onChange, onClear }) => (
  <div className="relative">
    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      type="text"
      placeholder="Search class name (e.g., Physics, Chemistry)..."
      value={value}
      onChange={onChange}
      className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
      autoComplete="off"
    />
    {value && (
      <button
        onClick={onClear}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        type="button"
      >
        ✕
      </button>
    )}
  </div>
));

const InfoItem = ({ label, value }) => (
  <div className="flex text-xs justify-between py-1 border-b last:border-b-0">
    <span className="text-slate-500">{label}</span>
    <span className="text-slate-800 font-medium truncate max-w-[60%] text-right">{value ?? '-'}</span>
  </div>
);

// Student Details Modal - Full information popup
const StudentDetailsModal = ({ student, onClose }) => {
  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-5 rounded-t-xl sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {(student.firstName || 'S')[0]}{(student.lastName || 'T')[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {student.firstName} {student.lastName}
                </h2>
                <div className="text-sm opacity-90 mt-1">Student ID: {student.studentId || student.id}</div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FaUser className="text-emerald-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">First Name</div>
                <div className="font-medium">{student.firstName || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Last Name</div>
                <div className="font-medium">{student.lastName || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Student ID</div>
                <div className="font-medium">{student.studentId || student.id || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Stream</div>
                <div className="font-medium">{student.stream || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">School</div>
                <div className="font-medium">{student.school || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Registered Date</div>
                <div className="font-medium">
                  {student.registeredDate || student.createdAt || student.created_at 
                    ? new Date(student.registeredDate || student.createdAt || student.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : '-'}
                </div>
              </div>
              {student.nic && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">NIC</div>
                  <div className="font-medium">{student.nic}</div>
                </div>
              )}
              {student.gender && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Gender</div>
                  <div className="font-medium">{student.gender}</div>
                </div>
              )}
              {student.birthday && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Birthday</div>
                  <div className="font-medium">{student.birthday}</div>
                </div>
              )}
              {(student.address || student.city) && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 mb-1">Address</div>
                  <div className="font-medium text-sm">
                    {student.address || '-'}
                    {student.city && (
                      <span className="text-slate-600 ml-2">({student.city})</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FaPhone className="text-blue-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Mobile</div>
                <div className="font-medium">{student.mobile || student.phone || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Email</div>
                <div className="font-medium text-sm break-all">{student.email || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Parent/Guardian Mobile</div>
                <div className="font-medium">{student.parentMobile || student.guardianPhone || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">WhatsApp</div>
                <div className="font-medium">{student.whatsapp || student.mobile || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Fast Receipt Printer - Opens print dialog immediately
const printPaymentReceipt = ({ student, classData, paymentData, cashierName }) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow pop-ups to print receipts');
    return;
  }

  const receiptDate = new Date();
  const formattedDate = receiptDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = receiptDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Receipt - ${paymentData.transactionId || 'N/A'}</title>
      <style>
        @media print {
          @page { margin: 0; }
          body { margin: 0.5cm; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          padding: 20px;
          max-width: 80mm;
          margin: 0 auto;
        }
        .receipt {
          border: 2px dashed #333;
          padding: 15px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .header .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 5px;
        }
        .header .logo-icon {
          font-size: 24px;
        }
        .header h1 {
          font-size: 20px;
          font-weight: bold;
          margin: 0;
        }
        .header .subtitle {
          font-size: 12px;
          color: #666;
        }
        .section {
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px dashed #999;
        }
        .section:last-child {
          border-bottom: none;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .row .label {
          font-weight: bold;
          color: #333;
        }
        .row .value {
          text-align: right;
          color: #000;
        }
        .total-section {
          background: #f0f0f0;
          padding: 10px;
          margin: 15px 0;
          border-radius: 5px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #333;
          font-size: 11px;
        }
        .thank-you {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo">
            <span class="logo-icon">🎓</span>
            <h1>TCMS</h1>
          </div>
          <div class="subtitle">Payment Receipt</div>
        </div>

        <div class="section">
          <div class="row">
            <span class="label">Receipt No:</span>
            <span class="value">${paymentData.transactionId || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Date/Time:</span>
            <span class="value">${formattedDate}, ${formattedTime}</span>
          </div>
          <div class="row">
            <span class="label">Cashier:</span>
            <span class="value">${cashierName || 'Cashier'}</span>
          </div>
        </div>

        <div class="section">
          <div class="row">
            <span class="label">Student Name:</span>
            <span class="value">${student.firstName} ${student.lastName}</span>
          </div>
          <div class="row">
            <span class="label">Student ID:</span>
            <span class="value">${student.studentId || student.id}</span>
          </div>
          <div class="row">
            <span class="label">Contact:</span>
            <span class="value">${student.mobile || student.phone || 'N/A'}</span>
          </div>
        </div>

        <div class="section">
          <div class="row">
            <span class="label">Class:</span>
            <span class="value">${classData.className || classData.subject}</span>
          </div>
          ${paymentData.originalFee && paymentData.discount ? `
            <div class="row">
              <span class="label">Original Fee:</span>
              <span class="value">LKR ${Number(paymentData.originalFee).toLocaleString()}</span>
            </div>
            <div class="row">
              <span class="label">Discount:</span>
              <span class="value">- LKR ${Number(paymentData.discount).toLocaleString()}</span>
            </div>
          ` : ''}
          <div class="row">
            <span class="label">Payment Method:</span>
            <span class="value">${paymentData.paymentMethod || 'Cash'}</span>
          </div>
        </div>

        <div class="total-section">
          <div class="total-row">
            <span>AMOUNT PAID:</span>
            <span>LKR ${Number(paymentData.amount).toLocaleString()}</span>
          </div>
        </div>

        ${paymentData.notes ? `
          <div class="section">
            <div class="row">
              <span class="label">Notes:</span>
            </div>
            <div style="margin-top: 5px; font-size: 12px; color: #666;">
              ${paymentData.notes}
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <div class="thank-you">Thank You!</div>
          <div>For inquiries, please contact the office</div>
          <div style="margin-top: 5px;">This is a computer-generated receipt</div>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 250);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
};

// Payment History Modal - Detailed view of all payments
const PaymentHistoryModal = ({ student, payments, onClose }) => {
  if (!student || !payments) return null;

  const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const completedPayments = payments.filter(p => (p.status || 'completed') === 'completed');
  const pendingPayments = payments.filter(p => (p.status || '') === 'pending');

  const getStatusColor = (status) => {
    switch(status || 'completed') {
      case 'completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'failed': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FaHistory className="text-3xl" />
                Payment History
              </h2>
              <div className="text-sm opacity-90 mt-1">
                {student.firstName} {student.lastName} - ID: {student.studentId || student.id}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="bg-slate-50 px-6 py-4 border-b grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="text-xs text-slate-600 mb-1">Total Payments</div>
            <div className="text-2xl font-bold text-slate-800">{payments.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-emerald-200">
            <div className="text-xs text-emerald-600 mb-1">Completed</div>
            <div className="text-2xl font-bold text-emerald-700">{completedPayments.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="text-xs text-slate-600 mb-1">Total Amount</div>
            <div className="text-2xl font-bold text-emerald-600">LKR {totalAmount.toFixed(2)}</div>
          </div>
        </div>

        {/* Payment List */}
        <div className="flex-1 overflow-y-auto p-6">
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <FaHistory className="text-6xl text-slate-300 mx-auto mb-4" />
              <div className="text-slate-500 text-lg">No payment history available</div>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-lg font-semibold text-slate-800">
                          {payment.class_name || payment.className || payment.description || 'Class Payment'}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                          {(payment.status || 'completed').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Transaction ID</div>
                          <div className="font-medium text-slate-700">
                            {payment.transaction_id || payment.transactionId || payment.id || '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Payment Date</div>
                          <div className="font-medium text-slate-700">
                            {formatDate(payment.date || payment.createdAt || payment.created_at)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Payment Method</div>
                          <div className="font-medium text-slate-700">
                            {payment.payment_method || payment.paymentMethod || 'Cash'}
                          </div>
                        </div>
                      </div>

                      {payment.notes && (
                        <div className="mt-2 text-sm text-slate-600 bg-slate-50 rounded p-2">
                          <span className="font-medium">Notes:</span> {payment.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-emerald-600">
                        LKR {Number(payment.amount || 0).toFixed(2)}
                      </div>
                      {payment.discount && Number(payment.discount) > 0 && (
                        <div className="text-xs text-orange-600 mt-1">
                          Discount: LKR {Number(payment.discount).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {payments.length} payment{payments.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Quick Payment Modal for FAST cashier workflow
const QuickPaymentModal = ({ student, classData, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(true);
  const payButtonRef = useRef(null);

  const monthlyFee = Number(classData.monthlyFee || 0);
  const discountPrice = Number(classData.revisionDiscountPrice || 0);
  const isRevisionClass = classData.courseType === 'revision';
  
  // Calculate final fee after discount
  const finalFee = isRevisionClass && discountPrice > 0 ? monthlyFee - discountPrice : monthlyFee;
  
  const totalFee = Number(classData.totalFee || 0);
  const paidAmount = Number(classData.paidAmount || 0);
  const outstanding = totalFee - paidAmount;

  useEffect(() => {
    // Auto-focus pay button so Enter key works immediately
    setTimeout(() => payButtonRef.current?.focus(), 100);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      const payload = {
        paymentType: 'class_payment',
        paymentMethod: 'cash',
        channel: 'physical',
        studentId: student.studentId || student.id,
        classId: classData.classId || classData.id,
        amount: finalFee, // Use final fee after discount
        notes: isRevisionClass && discountPrice > 0 
          ? `Monthly fee payment (${discountPrice} revision discount applied)`
          : 'Monthly fee payment', // Changed from 'note' to 'notes'
      };
      
      const res = await createPayment(payload);
      if (res?.success) {
        // Update enrollment paid_amount in class backend
        try {
          const enrollmentUpdateRes = await fetch('http://localhost:8087/routes.php/update_enrollment_payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: student.studentId || student.id,
              class_id: classData.classId || classData.id,
              payment_amount: finalFee
            })
          });
          const updateResult = await enrollmentUpdateRes.json();
          if (!updateResult?.success) {
            console.error('Failed to update enrollment:', updateResult);
          }
        } catch (e) {
          console.error('Failed to update enrollment payment:', e);
        }
        
        // Extract transaction ID - API might return it in different fields
        const transactionId = res?.transactionId || res?.data?.transactionId || res?.data?.transaction_id;
        
        // Print receipt if option is selected
        if (printReceipt && transactionId) {
          const receiptData = {
            transactionId: transactionId,
            amount: finalFee,
            paymentMethod: 'Cash',
            notes: payload.notes,
            originalFee: isRevisionClass && discountPrice > 0 ? monthlyFee : null,
            discount: isRevisionClass && discountPrice > 0 ? discountPrice : null
          };
          
          // Get cashier name from user data
          const userData = getUserData();
          
          // Print receipt using fast print function
          printPaymentReceipt({
            student: student,
            classData: classData,
            paymentData: receiptData,
            cashierName: userData?.name || 'Cashier'
          });
        }
        
        onSuccess({ amount: finalFee, transactionId: transactionId || res?.transactionId });
      } else {
        alert(res?.message || 'Payment failed');
        setSubmitting(false);
      }
    } catch (e) {
      alert(e?.message || 'Payment failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-5 rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>⚡</span>
            <span>Quick Payment</span>
          </h2>
          <div className="text-sm opacity-90 mt-1">{classData.className || classData.subject}</div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Student Info */}
          <div className="bg-slate-50 rounded-lg p-4 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-600 mb-1">Student</div>
                <div className="font-semibold text-slate-800 text-lg">{student.firstName} {student.lastName}</div>
                <div className="text-sm text-slate-600">{student.studentId || student.id}</div>
              </div>
            </div>
          </div>

          {/* Payment Amount - Large Display */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-xl p-6 mb-5">
            <div className="text-center">
              {isRevisionClass && discountPrice > 0 ? (
                <>
                  <div className="text-sm text-slate-600 font-medium mb-2">Original Fee</div>
                  <div className="text-2xl font-semibold text-slate-500 line-through mb-1">
                    LKR {monthlyFee.toLocaleString()}
                  </div>
                  <div className="text-sm text-orange-600 font-medium mb-3">
                    - {discountPrice.toLocaleString()} (Revision Discount)
                  </div>
                  <div className="border-t-2 border-emerald-400 pt-3 mt-2">
                    <div className="text-sm text-emerald-700 font-medium mb-2">Final Amount to Pay</div>
                    <div className="text-5xl font-bold text-emerald-900">
                      LKR {finalFee.toLocaleString()}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-emerald-700 font-medium mb-2">Monthly Fee</div>
                  <div className="text-5xl font-bold text-emerald-900">
                    LKR {finalFee.toLocaleString()}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Outstanding Alert */}
          {outstanding > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-5">
              <div className="flex items-center gap-2 text-orange-800 text-sm">
                <span className="text-lg">⚠️</span>
                <div>
                  <span className="font-semibold">Outstanding Balance: </span>
                  <span className="font-bold">LKR {outstanding.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Print Receipt Option */}
          <div className="mb-5">
            <label className="flex items-center gap-3 cursor-pointer bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={printReceipt}
                onChange={(e) => setPrintReceipt(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center gap-2">
                <span className="text-lg">🖨️</span>
                <span className="font-medium text-slate-700">Generate Payment Receipt</span>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              ref={payButtonRef}
              type="submit"
              disabled={submitting}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-white text-lg transition-all ${
                submitting
                  ? 'bg-emerald-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {submitting ? '⏳ Processing...' : '💰 Pay Now'}
            </button>
          </div>

          {/* Keyboard Hint */}
          <div className="mt-4 text-center text-sm text-slate-500">
            Press <kbd className="px-2 py-1 bg-slate-200 rounded font-mono">Enter</kbd> to complete payment
          </div>
        </form>
      </div>
    </div>
  );
};

// Quick Enrollment Modal for FAST enrollment workflow
const QuickEnrollmentModal = ({ student, studentEnrollments = [], onClose, onSuccess }) => {
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payNow, setPayNow] = useState(true);
  const [printReceipt, setPrintReceipt] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await getActiveClasses();
      const classes = response?.data || response || [];
      
      // Filter out classes the student is already enrolled in
      const enrolledClassIds = studentEnrollments.map(enr => enr.classId || enr.class_id);
      const unenrolledClasses = classes.filter(cls => !enrolledClassIds.includes(cls.id));
      
      setAvailableClasses(unenrolledClasses);
    } catch (error) {
      console.error('Failed to load classes:', error);
      alert('Failed to load available classes');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedClass || submitting) return;

    try {
      setSubmitting(true);
      
      const monthlyFee = Number(selectedClass.fee || 0);
      const discountPrice = Number(selectedClass.revisionDiscountPrice || selectedClass.revision_discount_price || 0);
      const isRevisionClass = (selectedClass.courseType || selectedClass.course_type) === 'revision';
      
      // Check if student is enrolled in related theory class to apply discount
      const relatedTheoryId = selectedClass.relatedTheoryId || selectedClass.related_theory_id;
      const isEnrolledInTheory = relatedTheoryId && studentEnrollments.some(
        enr => (enr.classId || enr.class_id) === relatedTheoryId
      );
      
      // Only apply discount if enrolled in theory class
      const canGetDiscount = isRevisionClass && discountPrice > 0 && isEnrolledInTheory;
      const finalFee = canGetDiscount ? monthlyFee - discountPrice : monthlyFee;

      const studentIdToUse = student.studentId || student.id;

      // STEP 1: Always create enrollment first in class backend
      const enrollmentData = {
        student_id: studentIdToUse,
        class_id: selectedClass.id,
        payment_status: payNow ? 'paid' : 'pending',
        total_fee: finalFee,
        paid_amount: payNow ? finalFee : 0,
        status: 'active'
      };
      
      const enrollResponse = await fetch('http://localhost:8087/routes.php/create_enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollmentData)
      });
      
      const enrollResult = await enrollResponse.json();
      
      if (!enrollResult?.success) {
        alert(enrollResult?.message || 'Enrollment creation failed');
        setSubmitting(false);
        return;
      }

      // STEP 2: If paying now, record the payment in financial records
      if (payNow) {
        const studentIdForPayment = studentIdToUse; // Use same ID as enrollment
        
        const payload = {
          paymentType: 'class_payment',
          paymentMethod: 'cash',
          channel: 'physical',
          studentId: studentIdForPayment,
          classId: selectedClass.id,
          amount: finalFee,
          notes: 'First month payment (enrollment)', // Changed from 'note' to 'notes'
        };
        
        const paymentRes = await createPayment(payload);
        
        if (!paymentRes?.success) {
          alert('Enrollment created but payment recording failed: ' + (paymentRes?.message || 'Unknown error'));
          onSuccess({ enrolled: true, paid: false });
          return;
        }
        
        // Extract transaction ID - API might return it in different fields
        const transactionId = paymentRes?.transactionId || paymentRes?.data?.transactionId || paymentRes?.data?.transaction_id;
        
        // Print receipt if option is selected
        if (printReceipt && transactionId) {
          const receiptData = {
            transactionId: transactionId,
            amount: finalFee,
            paymentMethod: 'Cash',
            notes: 'First month payment (enrollment)',
            originalFee: canGetDiscount && discountPrice > 0 ? monthlyFee : null,
            discount: canGetDiscount && discountPrice > 0 ? discountPrice : null
          };
          
          // Get cashier name from user data
          const userData = getUserData();
          
          // Print receipt using fast print function
          printPaymentReceipt({
            student: student,
            classData: {
              className: selectedClass.class_name,
              subject: selectedClass.subject
            },
            paymentData: receiptData,
            cashierName: userData?.name || 'Cashier'
          });
        }
        
        onSuccess({ enrolled: true, paid: true, amount: finalFee });
      } else {
        onSuccess({ enrolled: true, paid: false });
      }
    } catch (error) {
      alert(error?.message || 'Enrollment failed');
      setSubmitting(false);
    }
  };

  const selectedClassFee = selectedClass ? Number(selectedClass.fee || 0) : 0;
  const selectedClassDiscount = selectedClass ? Number(selectedClass.revisionDiscountPrice || selectedClass.revision_discount_price || 0) : 0;
  const isRevision = (selectedClass?.courseType || selectedClass?.course_type) === 'revision';
  
  // Check if student is enrolled in the related theory class for the selected class
  const selectedRelatedTheoryId = selectedClass ? (selectedClass.relatedTheoryId || selectedClass.related_theory_id) : null;
  const isEnrolledInSelectedTheory = selectedRelatedTheoryId && studentEnrollments.some(
    enr => (enr.classId || enr.class_id) === selectedRelatedTheoryId
  );
  
  // Only apply discount if enrolled in theory class
  const canGetSelectedDiscount = isRevision && selectedClassDiscount > 0 && isEnrolledInSelectedTheory;
  const finalFee = canGetSelectedDiscount ? selectedClassFee - selectedClassDiscount : selectedClassFee;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 rounded-t-xl sticky top-0">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaPlus />
            <span>Quick Enrollment</span>
          </h2>
          <div className="text-sm opacity-90 mt-1">
            {student.firstName} {student.lastName} ({student.studentId || student.id})
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg text-slate-600">Loading classes...</div>
            </div>
          ) : (
            <>
              {/* Class Selection */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Select Class to Enroll:
                </label>
                <div className="space-y-2 max-h-[400px] overflow-y-auto border border-slate-200 rounded-lg p-3">
                  {availableClasses.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FaCheckCircle className="text-4xl mx-auto mb-3 text-emerald-400" />
                      <div className="font-semibold text-lg mb-1">All Caught Up!</div>
                      <div className="text-sm">Student is already enrolled in all available active classes</div>
                    </div>
                  ) : (
                    availableClasses.map((cls) => {
                      const fee = Number(cls.fee || 0);
                      const discount = Number(cls.revisionDiscountPrice || cls.revision_discount_price || 0);
                      const isRev = (cls.courseType || cls.course_type) === 'revision';
                      
                      // Check if student is enrolled in the related theory class
                      const relatedTheoryId = cls.relatedTheoryId || cls.related_theory_id;
                      const isEnrolledInTheory = relatedTheoryId && studentEnrollments.some(
                        enr => (enr.classId || enr.class_id) === relatedTheoryId
                      );
                      
                      // Only apply discount if it's a revision class AND student is enrolled in theory class
                      const canGetDiscount = isRev && discount > 0 && isEnrolledInTheory;
                      const final = canGetDiscount ? fee - discount : fee;
                      
                      return (
                        <div
                          key={cls.id}
                          onClick={() => setSelectedClass(cls)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedClass?.id === cls.id
                              ? 'border-blue-600 bg-blue-50 shadow-md'
                              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-slate-800 text-lg mb-2">{cls.class_name}</div>
                              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                                <span className="font-medium">{cls.subject}</span>
                                <span>•</span>
                                <span>{cls.stream}</span>
                                <span>•</span>
                                <span>{cls.teacher}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  (cls.deliveryMethod || cls.delivery_method) === 'online' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {(cls.deliveryMethod || cls.delivery_method) === 'online' ? '🌐 Online' : '🏫 Physical'}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  (cls.courseType || cls.course_type) === 'revision' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {(cls.courseType || cls.course_type) === 'revision' ? '📚 Revision' : '📖 Theory'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              {canGetDiscount ? (
                                <>
                                  <div className="text-sm text-slate-400 line-through">LKR {fee.toLocaleString()}</div>
                                  <div className="text-lg font-bold text-emerald-600">LKR {final.toLocaleString()}</div>
                                  <div className="text-xs text-orange-600">(-{discount.toLocaleString()} discount)</div>
                                </>
                              ) : isRev && discount > 0 && !isEnrolledInTheory ? (
                                <>
                                  <div className="text-lg font-bold text-slate-700">LKR {fee.toLocaleString()}</div>
                                  <div className="text-xs text-amber-600 mt-1">
                                    ⚠️ Enroll in theory first for discount
                                  </div>
                                </>
                              ) : (
                                <div className="text-lg font-bold text-emerald-600">LKR {final.toLocaleString()}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected Class Summary */}
              {selectedClass && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5 mb-5">
                  <div className="text-center">
                    <div className="text-sm text-blue-700 font-medium mb-2">Selected Class</div>
                    <div className="text-2xl font-bold text-blue-900 mb-2">{selectedClass.class_name}</div>
                    {canGetSelectedDiscount ? (
                      <div className="text-lg">
                        <span className="text-slate-500 line-through">LKR {selectedClassFee.toLocaleString()}</span>
                        <span className="mx-2">→</span>
                        <span className="text-emerald-600 font-bold">LKR {finalFee.toLocaleString()}</span>
                        <div className="text-xs text-orange-600 mt-1">Theory class discount applied</div>
                      </div>
                    ) : isRevision && selectedClassDiscount > 0 && !isEnrolledInSelectedTheory ? (
                      <div>
                        <div className="text-xl font-bold text-slate-700">LKR {selectedClassFee.toLocaleString()}/month</div>
                        <div className="text-sm text-amber-600 mt-2 bg-amber-50 rounded-lg p-2 border border-amber-200">
                          ⚠️ Student must enroll in the related theory class first to get the LKR {selectedClassDiscount.toLocaleString()} discount
                        </div>
                      </div>
                    ) : (
                      <div className="text-xl font-bold text-emerald-600">LKR {finalFee.toLocaleString()}/month</div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Options */}
              <div className="space-y-3 mb-5">
                <label className="flex items-center gap-3 cursor-pointer bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors border-2 border-transparent hover:border-emerald-300">
                  <input
                    type="checkbox"
                    checked={payNow}
                    onChange={(e) => setPayNow(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xl">💰</span>
                    <div>
                      <div className="font-semibold text-slate-700">Pay First Month Now</div>
                      <div className="text-xs text-slate-600">Complete enrollment with immediate payment</div>
                    </div>
                  </div>
                  {selectedClass && payNow && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-600">LKR {finalFee.toLocaleString()}</div>
                    </div>
                  )}
                </label>

                {payNow && (
                  <label className="flex items-center gap-3 cursor-pointer bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors ml-8">
                    <input
                      type="checkbox"
                      checked={printReceipt}
                      onChange={(e) => setPrintReceipt(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🖨️</span>
                      <span className="font-medium text-slate-700">Generate Payment Receipt</span>
                    </div>
                  </label>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnroll}
                  disabled={!selectedClass || submitting}
                  className={`flex-1 px-6 py-4 rounded-xl font-bold text-white text-lg transition-all ${
                    !selectedClass || submitting
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {submitting ? '⏳ Processing...' : payNow ? '💰 Enroll & Pay' : '✅ Enroll'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CashierDashboard() {
  const user = useMemo(() => getUserData(), []);
  const [isLocked, setIsLocked] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scanValue, setScanValue] = useState('');
  const scanInputRef = useRef(null);
  const studentPanelRef = useRef(null); // Ref for scrolling to student panel
  const mainContentRef = useRef(null); // Ref for scrolling to main content area (student + cashier tools)

  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [kpis, setKpis] = useState({ totalToday: 0, receipts: 0, pending: 0, drawer: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  
  // Student details modal state
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  
  // Payment history modal state
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  
  // Quick payment modal state
  const [showQuickPay, setShowQuickPay] = useState(false);
  const [quickPayClass, setQuickPayClass] = useState(null);
  const quickPayAmountRef = useRef(null);
  
  // Quick enrollment modal state
  const [showQuickEnroll, setShowQuickEnroll] = useState(false);
  
  // Class filter/search state
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  // Memoize search handler to prevent input re-renders
  const handleSearchChange = useCallback((e) => {
    setClassSearchTerm(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setClassSearchTerm('');
  }, []);

  // Handle filter change with smooth scroll to student panel
  const handleFilterChange = useCallback((filterType) => {
    setSelectedClassFilter(filterType);
    // Scroll to student panel to show filtered results
    setTimeout(() => {
      studentPanelRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }, []);

  // Memoize filtered enrollments to prevent re-renders
  const filteredEnrollments = useMemo(() => {
    if (!enrollments || enrollments.length === 0) return [];
    
    return enrollments.filter(enr => {
      // Apply search filter
      if (classSearchTerm) {
        const searchLower = classSearchTerm.toLowerCase();
        const className = (enr.className || '').toLowerCase();
        const subject = (enr.subject || '').toLowerCase();
        if (!className.includes(searchLower) && !subject.includes(searchLower)) {
          return false;
        }
      }
      
      // Apply payment status filter
      if (selectedClassFilter === 'unpaid') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const hasPaymentThisMonth = (payments || []).some(p => {
          const paymentDate = p.payment_date || p.date;
          const paymentClassId = p.class_id || p.classId;
          const paymentMonth = paymentDate ? paymentDate.slice(0, 7) : null;
          return paymentMonth === currentMonth && 
                 Number(paymentClassId) === Number(enr.classId) &&
                 (p.status === 'paid' || p.status === 'completed');
        });
        return !hasPaymentThisMonth;
      } else if (selectedClassFilter === 'paid') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const hasPaymentThisMonth = (payments || []).some(p => {
          const paymentDate = p.payment_date || p.date;
          const paymentClassId = p.class_id || p.classId;
          const paymentMonth = paymentDate ? paymentDate.slice(0, 7) : null;
          return paymentMonth === currentMonth && 
                 Number(paymentClassId) === Number(enr.classId) &&
                 (p.status === 'paid' || p.status === 'completed');
        });
        return hasPaymentThisMonth;
      }
      
      return true; // 'all' filter
    });
  }, [enrollments, classSearchTerm, selectedClassFilter, payments]);

  // Helpers to talk to class backend for special notes
  const requestLatePay = async ({ studentId, classId }) => {
    const url = 'http://localhost:8087/routes.php/request_late_payment';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, classId })
    });
    return res.json();
  };

  const requestForgetCard = async ({ studentId, classId }) => {
    const url = 'http://localhost:8087/routes.php/request_forget_card';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, classId })
    });
    return res.json();
  };

  const printNote = ({ title, student, classRow, reason }) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const today = new Date().toLocaleString();
    w.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { font-size: 20px; margin: 0 0 12px; }
            .row { margin: 6px 0; }
            .muted { color: #555; }
            .box { border: 1px solid #ddd; padding: 12px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="box">
            <div class="row"><strong>Date/Time:</strong> ${today}</div>
            <div class="row"><strong>Student:</strong> ${student?.firstName || ''} ${student?.lastName || ''} (${student?.studentId || student?.id})</div>
            <div class="row"><strong>Class:</strong> ${classRow?.className || classRow?.subject || classRow?.id || ''}</div>
            ${reason ? `<div class="row"><strong>Reason:</strong> ${reason}</div>` : ''}
            <div class="row muted">This is an auto-generated note for front-desk verification.</div>
          </div>
          <div style="margin-top:24px" class="row">__________________________<br/>Cashier Signature</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  useEffect(() => {
    const focusInput = () => {
      // Don't auto-focus if scanner modal is open or if user is typing in a form field
      if (showScanner) return;
      const activeElement = document.activeElement;
      const isFormField = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'SELECT'
      );
      if (isFormField) return; // Don't steal focus from form fields
      scanInputRef.current && scanInputRef.current.focus();
    };
    window.addEventListener('click', focusInput);
    focusInput();
    return () => window.removeEventListener('click', focusInput);
  }, [showScanner]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isLocked) return;
      
      switch(e.key) {
        case 'F1':
          e.preventDefault();
          scanInputRef.current?.focus();
          break;
        case 'F2':
          e.preventDefault();
          setShowScanner(true);
          break;
        case 'F9':
          e.preventDefault();
      setStudent(null);
      setEnrollments([]);
      setPayments([]);
      setError('');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isLocked]);

  const handleLogout = async () => {
    await authLogout();
  };

  const handleLockToggle = () => {
    setIsLocked(prev => !prev);
  };

  const loadStudentData = async (studentId) => {
    try {
      setLoading(true);
      setError('');
      try { await apiGetBarcode(studentId); } catch (_) {}
      const studentRes = await getStudentById(studentId);
      const profile = studentRes?.data || studentRes;
      setStudent(profile);
      
      // Fetch enrollments from class backend
      try {
        const enrollRes = await fetch(`http://localhost:8087/routes.php/get_enrollments_by_student?studentId=${studentId}`);
        if (enrollRes.ok) {
          const enrollData = await enrollRes.json();
          const enrollments = enrollData?.data || enrollData || [];
          
          // Transform snake_case to camelCase for consistency
          const transformedEnrollments = enrollments.map(enr => ({
            ...enr,
            classId: enr.class_id || enr.classId,
            className: enr.class_name || enr.className,
            monthlyFee: enr.fee || enr.monthlyFee,
            revisionDiscountPrice: enr.revision_discount_price || enr.revisionDiscountPrice,
            studentId: enr.student_id || enr.studentId,
            enrollmentDate: enr.enrollment_date || enr.enrollmentDate,
            paymentStatus: enr.payment_status || enr.paymentStatus,
            totalFee: enr.total_fee || enr.totalFee,
            paidAmount: enr.paid_amount || enr.paidAmount,
            nextPaymentDate: enr.next_payment_date || enr.nextPaymentDate,
            deliveryMethod: enr.delivery_method || enr.deliveryMethod,
            courseType: enr.course_type || enr.courseType,
            zoomLink: enr.zoom_link || enr.zoomLink,
            startDate: enr.start_date || enr.startDate,
            endDate: enr.end_date || enr.endDate,
            maxStudents: enr.max_students || enr.maxStudents,
            currentStudents: enr.current_students || enr.currentStudents
          }));
          
          setEnrollments(transformedEnrollments);
        } else {
          setEnrollments([]);
        }
      } catch (e) {
        console.error('Failed to fetch enrollments:', e);
        setEnrollments([]);
      }
      
      const payRes = await getStudentPayments(studentId);
      const fetchedPayments = payRes?.data || payRes || [];
      setPayments(fetchedPayments);
      
      // Add to recent students
      if (profile) {
        setRecentStudents(prev => {
          const filtered = prev.filter(s => s.studentId !== profile.studentId);
          return [{ 
            studentId: profile.studentId || profile.id, 
            name: `${profile.firstName} ${profile.lastName}`,
            stream: profile.stream,
            timestamp: new Date()
          }, ...filtered].slice(0, 10);
        });
      }
    } catch (err) {
      setStudent(null);
      setEnrollments([]);
      setPayments([]);
      setError(err?.message || 'Failed to load student');
    } finally {
      setLoading(false);
      // Auto-scroll to student panel after loading
      setTimeout(() => {
        studentPanelRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!scanValue) return;
    const value = scanValue.trim();
    setScanValue('');
    if (isLocked) return;
    loadStudentData(value);
  };

  // Focus back to scan input after payment/enrollment
  const focusBackToScan = useCallback(() => {
    setTimeout(() => {
      scanInputRef.current?.focus();
      scanInputRef.current?.select();
    }, 300);
  }, []);

  // Memoize the student panel to prevent unnecessary re-renders that cause input focus loss
  const studentPanelContent = useMemo(() => {
    // Calculate total outstanding balance based on actual enrollment data
    const totalOutstanding = enrollments.reduce((total, enr) => {
      const totalFee = Number(enr.totalFee || 0);
      const paidAmount = Number(enr.paidAmount || 0);
      const outstanding = totalFee - paidAmount;
      return total + outstanding;
    }, 0);

    return (
      <div ref={studentPanelRef}>
      <Section title="Student Information">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-slate-600">Loading student data...</span>
          </div>
        ) : student ? (
          <div className="space-y-4">
            {/* Student Header - Clickable for full details */}
            <div 
              onClick={() => setShowStudentDetails(true)}
              className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 border border-emerald-200 cursor-pointer hover:shadow-lg hover:border-emerald-300 transition-all group"
              title="Click to view full student details"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform">
                    {(student.firstName || 'S')[0]}{(student.lastName || 'T')[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {student.firstName} {student.lastName}
                      <span className="ml-2 text-xs text-slate-500 font-normal opacity-0 group-hover:opacity-100 transition-opacity">
                        👁️ Click for details
                      </span>
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1"><FaUser className="text-xs" /> {student.studentId || student.id}</span>
                      <span className="flex items-center gap-1"><FaGraduationCap className="text-xs" /> {student.stream || 'N/A'}</span>
                      <span className="flex items-center gap-1"><FaPhone className="text-xs" /> {student.mobile || student.phone || 'N/A'}</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">{student.school || 'School not specified'}</div>
                  </div>
                </div>
                {totalOutstanding > 0 && (
                  <div className="text-right">
                    <div className="text-sm text-orange-600 font-medium">Outstanding Balance</div>
                    <div className="text-2xl font-bold text-orange-700">LKR {totalOutstanding.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Class Enrollments */}
            <div>
              <h4 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FaGraduationCap className="text-emerald-600" />
                Enrolled Classes & Fees
                <span className="ml-auto text-sm font-normal text-slate-500">
                  {enrollments?.length || 0} {enrollments?.length === 1 ? 'class' : 'classes'}
                </span>
              </h4>
              
              {/* Quick Filter & Search - Only show if student has multiple classes */}
              {enrollments && enrollments.length > 2 && (
                <div className="mb-4 space-y-2">
                  {/* Search Box */}
                  <ClassSearchInput
                    value={classSearchTerm}
                    onChange={handleSearchChange}
                    onClear={handleClearSearch}
                  />
                  
                  {/* Quick Filter Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleFilterChange('all')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedClassFilter === 'all'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      All Classes
                    </button>
                    <button
                      onClick={() => handleFilterChange('unpaid')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedClassFilter === 'unpaid'
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      📋 Need Payment
                    </button>
                    <button
                      onClick={() => handleFilterChange('paid')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedClassFilter === 'paid'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      ✅ Already Paid
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {(enrollments || []).length === 0 ? (
                  <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg">
                    <FaGraduationCap className="text-3xl mx-auto mb-2 text-slate-300" />
                    <div>No class enrollments found</div>
                  </div>
                ) : filteredEnrollments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FaSearch className="text-3xl mx-auto mb-3 text-slate-300" />
                    <div className="text-lg font-medium">No classes match your filter</div>
                    <div className="text-sm mt-2">
                      {classSearchTerm ? `Try a different search term or clear the search` : `Try changing the filter selection`}
                    </div>
                  </div>
                ) : (
                  filteredEnrollments.map((enr) => {
                    const monthly = Number(enr.monthlyFee || 0);
                    const discountPrice = Number(enr.revisionDiscountPrice || 0);
                    const isRevisionClass = enr.courseType === 'revision';
                    
                    // Calculate final fee after discount
                    const finalMonthlyFee = isRevisionClass && discountPrice > 0 ? monthly - discountPrice : monthly;
                    
                    // Get total fee and paid amount from enrollment
                    let totalFee = Number(enr.totalFee || 0);
                    const paidAmount = Number(enr.paidAmount || 0);
                    
                    // If totalFee is not set or is using original fee, recalculate with discount
                    // This ensures outstanding calculation uses the correct discounted fee
                    if (totalFee === monthly && isRevisionClass && discountPrice > 0) {
                      totalFee = finalMonthlyFee;
                    }
                    
                    const outstanding = totalFee - paidAmount; // Calculate actual outstanding
                    const paymentStatus = enr.paymentStatus || 'pending';
                    
                    // Check if payment already made this month to prevent duplicates
                    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
                    const hasPaymentThisMonth = (payments || []).some(p => {
                      const paymentDate = p.payment_date || p.date;
                      const paymentClassId = p.class_id || p.classId;
                      const paymentMonth = paymentDate ? paymentDate.slice(0, 7) : null;
                      return paymentMonth === currentMonth && 
                             Number(paymentClassId) === Number(enr.classId) &&
                             (p.status === 'paid' || p.status === 'completed');
                    });
                    
                    // Format next payment date
                    let nextDueDisplay = 'N/A';
                    if (enr.nextPaymentDate) {
                      try {
                        const dueDate = new Date(enr.nextPaymentDate);
                        const today = new Date();
                        const diffTime = dueDate - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        // Format: "Nov 1, 2025 (24 days)"
                        nextDueDisplay = dueDate.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        });
                        
                        if (diffDays > 0) {
                          nextDueDisplay += ` (${diffDays} days)`;
                        } else if (diffDays === 0) {
                          nextDueDisplay += ' (Today)';
                        } else {
                          nextDueDisplay += ` (${Math.abs(diffDays)} days overdue)`;
                        }
                      } catch (e) {
                        nextDueDisplay = enr.nextPaymentDate;
                      }
                    } else if (outstanding <= 0) {
                      nextDueDisplay = 'Paid in full';
                    }
                    
                    return (
                      <div key={enr.classId || enr.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h5 className="text-lg font-semibold text-slate-800">{enr.className || enr.subject || 'Class'}</h5>
                                <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                                  <span>{enr.subject || 'N/A'}</span>
                                  <span>•</span>
                                  <span>{enr.stream || 'N/A'}</span>
                                  <span>•</span>
                                  <span>{enr.teacher || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                  <span className={`px-2 py-0.5 rounded-full ${
                                    enr.deliveryMethod === 'online' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {enr.deliveryMethod || 'N/A'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full ${
                                    isRevisionClass 
                                      ? 'bg-purple-100 text-purple-700' 
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {isRevisionClass ? 'Revision' : 'Theory'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-slate-600">Monthly Fee</div>
                                {isRevisionClass && discountPrice > 0 ? (
                                  <div>
                                    <div className="text-sm text-slate-400 line-through">
                                      LKR {monthly.toLocaleString()}
                                    </div>
                                    <div className="text-lg font-bold text-emerald-600">
                                      LKR {finalMonthlyFee.toLocaleString()}
                                      <span className="ml-2 text-xs text-orange-600 font-normal">
                                        (-{discountPrice.toLocaleString()})
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-lg font-bold text-emerald-600">
                                    LKR {finalMonthlyFee.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div className={`flex items-center gap-1 ${outstanding > 0 ? 'text-slate-600' : 'text-green-600'}`}>
                                <FaClock className="text-xs" />
                                Next Due: <span className="font-medium">{nextDueDisplay}</span>
                              </div>
                              {outstanding > 0 ? (
                                <div className="flex items-center gap-1 text-orange-600">
                                  <FaExclamationTriangle className="text-xs" />
                                  Outstanding: <span className="font-bold">LKR {outstanding.toLocaleString()}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-green-600">
                                  <FaCheckCircle className="text-xs" />
                                  Paid: <span className="font-bold">LKR {paidAmount.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                          {hasPaymentThisMonth ? (
                            <div className="flex-1 bg-green-50 border-2 border-green-300 text-green-700 px-4 py-2 rounded-lg font-semibold text-center flex items-center justify-center gap-2">
                              <FaCheckCircle className="text-lg" />
                              <span>Already Paid This Month</span>
                            </div>
                          ) : (
                            <button
                              className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                              onClick={() => {
                                // Open Quick Payment Modal
                                setQuickPayClass(enr);
                                setShowQuickPay(true);
                              }}
                            >
                              ⚡ Pay Now
                            </button>
                          )}
                          <button
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                            onClick={async () => {
                              const studentId = student.studentId || student.id;
                              try {
                                const r = await requestLatePay({ studentId, classId: enr.classId || enr.id });
                                if (!r?.success) alert(r?.message || 'LatePay request failed');
                                printNote({ title: 'Late Payment Permission', student, classRow: enr, reason: 'Allowed late payment for today only' });
                                setKpis(prev => ({ ...prev, pending: Number(prev.pending) + 1 }));
                                // Scroll back to student panel after generating note
                                setTimeout(() => {
                                  studentPanelRef.current?.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start' 
                                  });
                                }, 300);
                              } catch (e) { alert(e?.message || 'LatePay request failed'); }
                            }}
                          >
                            Late Note
                          </button>
                          <button
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            onClick={async () => {
                              const studentId = student.studentId || student.id;
                              try {
                                const r = await requestForgetCard({ studentId, classId: enr.classId || enr.id });
                                if (!r?.success) alert(r?.message || 'Permit request failed');
                                printNote({ title: 'Entry Permit - Forgot Card', student, classRow: enr, reason: 'Permit to enter without ID for this session' });
                                // Scroll back to student panel after generating note
                                setTimeout(() => {
                                  studentPanelRef.current?.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start' 
                                  });
                                }, 300);
                              } catch (e) { alert(e?.message || 'Permit request failed'); }
                            }}
                          >
                            Entry Permit
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <FaExclamationTriangle className="text-3xl mx-auto mb-3" />
            <div className="text-lg font-medium">Error loading student</div>
            <div className="text-sm">{error}</div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <FaUser className="text-4xl mx-auto mb-4 text-slate-300" />
            <div className="text-xl font-medium">Awaiting Student Scan</div>
            <div className="text-sm mt-2">Scan a student ID barcode to view their information and payment options</div>
          </div>
        )}
      </Section>
      </div>
    );
  }, [loading, student, enrollments, payments, filteredEnrollments, classSearchTerm, selectedClassFilter]);

  // Memoize history panel to prevent re-renders
  const historyPanelContent = useMemo(() => {
    const total = (payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const paymentCount = (payments || []).length;
    const recentPayments = (payments || []).slice(0, 5); // Show only 5 most recent
    
    return (
      <div 
        onClick={() => paymentCount > 0 && setShowPaymentHistory(true)}
        className={`bg-white rounded-md shadow-sm border-2 transition-all ${
          paymentCount > 0 
            ? 'border-emerald-200 hover:border-emerald-400 hover:shadow-md cursor-pointer' 
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between border-b p-4 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <FaHistory className="text-emerald-600 text-lg" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Payment History</h3>
              <div className="text-xs text-slate-500 mt-0.5">
                {paymentCount > 0 ? `${paymentCount} payment${paymentCount !== 1 ? 's' : ''} recorded` : 'No payments yet'}
              </div>
            </div>
          </div>
          {paymentCount > 0 && (
            <div className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-medium">
              Click to view all
            </div>
          )}
        </div>
        
        <div className="p-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-600 mb-1">Total Paid</div>
              <div className="text-lg font-bold text-emerald-600">LKR {total.toFixed(2)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-600 mb-1">Transactions</div>
              <div className="text-lg font-bold text-slate-800">{paymentCount}</div>
            </div>
          </div>

          {/* Recent Payments Preview */}
          <div className="space-y-2">
            {paymentCount === 0 ? (
              <div className="text-center py-8">
                <FaHistory className="text-4xl text-slate-300 mx-auto mb-2" />
                <div className="text-xs text-slate-500">No payment history</div>
                <div className="text-[10px] text-slate-400 mt-1">Payments will appear here</div>
              </div>
            ) : (
              <>
                <div className="text-xs font-semibold text-slate-700 mb-2">Recent Payments</div>
                {recentPayments.map((p, idx) => (
                  <div 
                    key={idx} 
                    className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700 truncate flex-1 mr-2">
                        {p.class_name || p.className || p.description || 'Class payment'}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 whitespace-nowrap">
                        LKR {Number(p.amount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        (p.status||'completed')==='completed' ? 'bg-green-100 text-green-700' :
                        (p.status||'')==='pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {(p.status || 'completed').toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {p.date || p.created_at || p.createdAt || '-'}
                      </span>
                    </div>
                  </div>
                ))}
                {paymentCount > 5 && (
                  <div className="text-center pt-2">
                    <div className="text-xs text-emerald-600 font-medium">
                      +{paymentCount - 5} more payment{paymentCount - 5 !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }, [payments]);

  // Memoize tools panel
  const toolsPanelContent = useMemo(() => (
    <Section title="Tools" right={<FaStickyNote className="text-slate-500" />}> 
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button className="flex items-center gap-2 border rounded px-3 py-2 hover:bg-slate-50"><FaFileInvoice /> Late Pay Note</button>
        <button className="flex items-center gap-2 border rounded px-3 py-2 hover:bg-slate-50"><FaStickyNote /> Forget Card Note</button>
      </div>
    </Section>
  ), []);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-bold">Institute Fee Management System</h1>
              <div className="text-sm text-slate-300">Cashier Dashboard - {user?.name || 'Cashier'}</div>
            </div>
            {isLocked && (
              <div className="bg-orange-600 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2">
                <FaLock className="text-xs" />
                Session Locked
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-slate-600 rounded text-xs">F1</kbd>
                <span>Focus Scan</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-slate-600 rounded text-xs">F2</kbd>
                <span>Scanner</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-slate-600 rounded text-xs">F9</kbd>
                <span>Clear</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab==='dashboard'?'bg-slate-600':'bg-slate-500 hover:bg-slate-600'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('register')} 
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab==='register'?'bg-slate-600':'bg-slate-500 hover:bg-slate-600'}`}
              >
                <FaUserPlus className="inline mr-2"/>
                Register
              </button>
              <button 
                onClick={handleLockToggle} 
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isLocked ? 'bg-orange-600 hover:bg-orange-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                {isLocked ? <><FaLock className="inline mr-2"/>Unlock</> : <><FaLockOpen className="inline mr-2"/>Lock</>}
              </button>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-700 transition-colors"
              >
                <FaSignOutAlt className="inline mr-2"/>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'register' ? (
        <div className="p-4">
          <PhysicalStudentRegisterTab />
        </div>
      ) : (
        <div className="p-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Today's Collections</div>
                  <div className="text-2xl font-bold text-emerald-600">LKR {Number(kpis.totalToday).toLocaleString()}</div>
                </div>
                <FaMoneyBill className="text-2xl text-emerald-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Receipts Issued</div>
                  <div className="text-2xl font-bold text-blue-600">{kpis.receipts}</div>
                </div>
                <FaFileInvoice className="text-2xl text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Pending Payments</div>
                  <div className="text-2xl font-bold text-orange-600">{kpis.pending}</div>
                </div>
                <FaClock className="text-2xl text-orange-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Cash Drawer</div>
                  <div className="text-2xl font-bold text-slate-600">LKR {Number(kpis.drawer).toLocaleString()}</div>
                </div>
                <FaLock className="text-2xl text-slate-500" />
              </div>
            </div>
          </div>

          {/* Student Scanner - Full Width */}
          <Section title="Student Lookup" right={<FaBarcode className="text-emerald-600" />}>
            <div className="space-y-4">
              <form onSubmit={handleScanSubmit} className="flex gap-3">
                <input
                  ref={scanInputRef}
                  value={scanValue}
                  onChange={(e)=>setScanValue(e.target.value)}
                  placeholder="Scan Student ID barcode or enter manually..."
                  className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button 
                  type="submit"
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Load Student
                </button>
                <button 
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <FaCamera className="inline mr-2" />
                  Scanner
                </button>
              </form>
              
              {/* Recent Students */}
              {recentStudents.length > 0 && (
                <div>
                  <div className="text-sm text-slate-600 mb-2">Recent Students:</div>
                  <div className="flex gap-2 flex-wrap">
                    {recentStudents.slice(0, 5).map((recent, idx) => (
                      <button
                        key={idx}
                        onClick={() => loadStudentData(recent.studentId)}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                      >
                        {recent.name} ({recent.studentId})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Added spacing between sections */}
          <div className="my-6"></div>

          {/* Main Content Layout - Student Info + Right Sidebar */}
          <div ref={mainContentRef} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Student Information Panel - Takes 2 columns */}
            <div className="lg:col-span-2">
              {studentPanelContent}
            </div>

            {/* Right Sidebar - Cashier Tools + Payment History stacked */}
            <div className="lg:col-span-1 space-y-4">
              {/* Cashier Tools Panel (Top) */}
              <Section title="Cashier Tools" right={<FaEdit className="text-slate-600" />}>
                <div className="space-y-2">
                  <button className="w-full bg-emerald-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                    <FaMoneyBill />
                    Start Cash Drawer
                  </button>
                  <button className="w-full bg-orange-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
                    <FaLock />
                    Close Out Cash
                  </button>
                  <button className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <FaFileInvoice />
                    Day End Report
                  </button>
                  <button 
                    onClick={() => setActiveTab('register')}
                    className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaUserPlus />
                    Register Student
                  </button>
                  <button 
                    onClick={() => {
                      if (student) {
                        setShowQuickEnroll(true);
                      } else {
                        alert('Please scan a student first to enroll them in a class');
                      }
                    }}
                    disabled={!student}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                      student 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <FaPlus />
                    Enroll New Class
                  </button>
                </div>
              </Section>

              {/* Payment History Panel (Bottom) */}
              {historyPanelContent}
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowScanner(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold">Camera Scanner</div>
              <button onClick={() => setShowScanner(false)} className="text-sm px-2 py-1 border rounded">Close</button>
            </div>
            <div className="p-4 flex items-center justify-center">
              <BarcodeScanner
                onScan={(code) => {
                  setShowScanner(false);
                  setActiveTab('dashboard');
                  if (!isLocked && code) loadStudentData(String(code).trim());
                }}
                onClose={() => setShowScanner(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Payment Modal */}
      {showQuickPay && quickPayClass && (
        <QuickPaymentModal 
          student={student}
          classData={quickPayClass}
          onClose={() => {
            setShowQuickPay(false);
            setQuickPayClass(null);
            // Scroll to student panel when modal closes (Cancel button)
            setTimeout(() => {
              studentPanelRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              });
            }, 100);
            // Focus back to scan input
            focusBackToScan();
          }}
          onSuccess={async (paymentData) => {
            // Refresh data after payment
            try {
              // Update KPIs immediately
              setKpis(prev => ({
                ...prev,
                totalToday: Number(prev.totalToday) + Number(paymentData.amount),
                receipts: Number(prev.receipts) + 1
              }));
              
              // Add delay to ensure database transaction is fully committed
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Reload student to update enrollment balances and payments
              await loadStudentData(student.studentId || student.id);
            } catch (e) {
              console.error('Failed to refresh after payment:', e);
            }
            setShowQuickPay(false);
            setQuickPayClass(null);
            // Focus back to scan input for next student
            focusBackToScan();
          }}
        />
      )}

      {/* Quick Enrollment Modal */}
      {showQuickEnroll && student && (
        <QuickEnrollmentModal 
          student={student}
          studentEnrollments={enrollments}
          onClose={() => {
            setShowQuickEnroll(false);
            // Scroll to student panel when modal closes (Cancel button)
            setTimeout(() => {
              studentPanelRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              });
            }, 100);
            // Focus back to scan input
            focusBackToScan();
          }}
          onSuccess={async (enrollmentData) => {
            // Refresh data after enrollment
            try {
              // Update KPIs immediately
              if (enrollmentData.paid) {
                setKpis(prev => ({
                  ...prev,
                  totalToday: Number(prev.totalToday) + Number(enrollmentData.amount || 0),
                  receipts: Number(prev.receipts) + 1
                }));
                
                // Add delay to ensure database transaction is fully committed
                // This is critical for payment records to be available
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              
              // Reload student to get updated enrollments AND payments
              await loadStudentData(student.studentId || student.id);
              alert('✅ Student enrolled successfully!');
              
              // Scroll to student panel to show updated enrollment
              setTimeout(() => {
                studentPanelRef.current?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'start' 
                });
              }, 200);
            } catch (e) {
              console.error('Failed to refresh after enrollment:', e);
            }
            setShowQuickEnroll(false);
            // Focus back to scan input for next student
            focusBackToScan();
          }}
        />
      )}

      {/* Student Details Modal */}
      {showStudentDetails && student && (
        <StudentDetailsModal 
          student={student}
          onClose={() => {
            setShowStudentDetails(false);
            // Scroll to student panel when modal closes
            setTimeout(() => {
              studentPanelRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              });
            }, 100);
            // Focus back to scan input
            focusBackToScan();
          }}
        />
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && student && (
        <PaymentHistoryModal
          student={student}
          payments={payments || []}
          onClose={() => {
            setShowPaymentHistory(false);
            // Scroll to main content area (student info + cashier tools) when modal closes
            setTimeout(() => {
              mainContentRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              });
            }, 100);
            // Focus back to scan input
            focusBackToScan();
          }}
        />
      )}
    </div>
  );
}


