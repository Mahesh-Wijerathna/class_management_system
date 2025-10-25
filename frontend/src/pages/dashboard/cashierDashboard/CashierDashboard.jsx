import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { FaLock, FaLockOpen, FaSignOutAlt, FaBarcode, FaUserPlus, FaMoneyBill, FaHistory, FaFileInvoice, FaStickyNote, FaSearch, FaCamera, FaUser, FaPhone, FaGraduationCap, FaClock, FaExclamationTriangle, FaCheckCircle, FaEdit, FaPlus } from 'react-icons/fa';
import { getUserData, logout as authLogout } from '../../../api/apiUtils';
import { login } from '../../../api/auth';
import { getBarcode as apiGetBarcode } from '../../../api/auth';
import { getStudentById } from '../../../api/students';
import { getStudentPayments, createPayment, generateInvoice, getCashierStats } from '../../../api/payments';
import { getActiveClasses } from '../../../api/classes';
import { getStudentAttendance } from '../../../api/attendance';
import PhysicalStudentRegisterTab from '../adminDashboard/PhysicalStudentRegisterTab';
import BarcodeScanner from '../../../components/BarcodeScanner';
import AttendanceCalendar from '../../../components/AttendanceCalendar';

// Add CSS animation for toast notification
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-in-top {
    from {
      transform: translate(-50%, -100px);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
  
  .animate-slide-in-top {
    animation: slide-in-top 0.4s ease-out forwards;
  }
`;
if (!document.head.querySelector('[data-toast-styles]')) {
  style.setAttribute('data-toast-styles', 'true');
  document.head.appendChild(style);
}

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
      placeholder="Search class (e.g., 2026 A/L Physics, Physics, Chemistry)..."
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
  // Filter states - MUST be declared before any conditional returns
  const [filterMonth, setFilterMonth] = React.useState('all');
  const [filterYear, setFilterYear] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  // Early return check AFTER hooks
  if (!student || !payments) return null;

  // Generate year range: from 2020 to current year + 5 years
  const currentYear = new Date().getFullYear();
  const startYear = 2020; // Starting year for the system
  const endYear = currentYear + 25; // Include next 25 years for future payments
  
  // Create array of years from start to end, sorted newest first
  const availableYears = [];
  for (let year = endYear; year >= startYear; year--) {
    availableYears.push(year);
  }

  // Filter payments based on selected criteria
  const filteredPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.date || payment.created_at || payment.createdAt);
    const paymentMonth = paymentDate.getMonth() + 1;
    const paymentYear = paymentDate.getFullYear();
    const paymentStatus = payment.status || 'completed';
    const className = (payment.class_name || payment.className || '').toLowerCase();
    const transactionId = (payment.transaction_id || payment.transactionId || '').toLowerCase();

    // Month filter
    if (filterMonth !== 'all' && paymentMonth !== parseInt(filterMonth)) {
      return false;
    }

    // Year filter
    if (filterYear !== 'all' && paymentYear !== parseInt(filterYear)) {
      return false;
    }

    // Status filter
    if (filterStatus !== 'all' && paymentStatus !== filterStatus) {
      return false;
    }

    // Search filter
    if (searchTerm && !className.includes(searchTerm.toLowerCase()) && !transactionId.includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const completedPayments = filteredPayments.filter(p => {
    const status = p.status || 'completed';
    return status === 'completed' || status === 'paid';
  });
  const pendingPayments = filteredPayments.filter(p => (p.status || '') === 'pending');

  const getStatusColor = (status) => {
    switch(status || 'completed') {
      case 'paid': return 'bg-green-100 text-green-700 border-green-300';
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
            <div className="text-2xl font-bold text-slate-800">{filteredPayments.length}</div>
            {filteredPayments.length !== payments.length && (
              <div className="text-[10px] text-slate-500 mt-1">of {payments.length} total</div>
            )}
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

        {/* Filter Section */}
        <div className="bg-white px-6 py-4 border-b">
          <div className="flex items-center gap-3 mb-3">
            <FaSearch className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Filter Payments</h3>
            {(filterMonth !== 'all' || filterYear !== 'all' || filterStatus !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setFilterMonth('all');
                  setFilterYear('all');
                  setFilterStatus('all');
                  setSearchTerm('');
                }}
                className="ml-auto text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {/* Search */}
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Class or Transaction ID"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Month Filter */}
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Month</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="all">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Year</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none max-h-48 overflow-y-auto"
                style={{ maxHeight: '200px' }}
                size="1"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <FaHistory className="text-6xl text-slate-300 mx-auto mb-4" />
              <div className="text-slate-500 text-lg">
                {payments.length === 0 ? 'No payment history available' : 'No payments match the current filters'}
              </div>
              {payments.length > 0 && (
                <button
                  onClick={() => {
                    setFilterMonth('all');
                    setFilterYear('all');
                    setFilterStatus('all');
                    setSearchTerm('');
                  }}
                  className="mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Clear filters to see all payments
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((payment, idx) => {
                const paymentType = payment.payment_type || payment.paymentType || 'class_payment';
                const isAdmissionFee = paymentType === 'admission_fee';
                const className = payment.class_name || payment.className || '';
                
                // Display label with payment type
                let displayLabel = '';
                if (isAdmissionFee) {
                  displayLabel = className ? `Admission Fee (${className})` : 'Admission Fee';
                } else {
                  displayLabel = className || payment.description || 'Class Payment';
                }
                
                return (
                  <div 
                    key={idx}
                    className="bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {isAdmissionFee && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
                                ADMISSION FEE
                              </span>
                            )}
                            <div className="text-lg font-semibold text-slate-800">
                              {displayLabel}
                            </div>
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
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
            {filteredPayments.length !== payments.length && (
              <span className="text-slate-500"> (filtered from {payments.length} total)</span>
            )}
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

// Day End Report Modal - Comprehensive daily summary (supports 'summary' and 'full' modes)
const DayEndReportModal = ({ onClose, kpis, recentStudents, openingTime, mode = 'summary', transactions = [], perClass = [] }) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  // Aggregate transactions by class for full report
  const aggregatedByClass = React.useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    // If server returned perClass aggregates, prefer those (they're more reliable)
    if (Array.isArray(perClass) && perClass.length > 0) {
      return perClass.map(p => ({
        className: p.class_name || p.className || 'Unspecified',
        teacher: p.teacher || p.teacher_name || '-',
        freeCards: Number(p.free_count || 0),
        halfCards: Number(p.half_count || 0),
        totalAmount: Number(p.total_amount || 0),
        txCount: Number(p.tx_count || 0)
      }));
    }

    const map = {};
    transactions.forEach(t => {
      const cls = (t.class_name || t.className || 'Unspecified').trim() || 'Unspecified';
      if (!map[cls]) {
        map[cls] = {
          className: cls,
          teacher: t.teacher || t.teacher_name || '-',
          freeCards: 0,
          halfCards: 0,
          totalAmount: 0,
          txCount: 0
        };
      }
      const amt = Number(t.amount || 0);
      const ptype = (t.payment_type || t.paymentType || t.category || '').toLowerCase();
      const cardType = (t.card_type || t.cardType || '').toString().toLowerCase();

      // Prefer explicit card_type from backend when available
      if (ptype === 'class_payment') {
        if (cardType) {
          if (cardType === 'free') map[cls].freeCards += 1;
          else if (cardType === 'half') map[cls].halfCards += 1;
          else map[cls].txCount += 1; // count as a class payment (full)
        } else {
          // Fallback heuristics: amount===0 => free, notes mention 'half' => half
          if (amt === 0) {
            map[cls].freeCards += 1;
          } else {
            const notes = (t.notes || t.description || t.note || '').toString();
            if (notes && /half/i.test(notes)) {
              map[cls].halfCards += 1;
            }
            map[cls].txCount += 1;
          }
        }

        map[cls].totalAmount += amt;
      }
    });
    return Object.values(map).sort((a,b) => b.totalAmount - a.totalAmount);
  }, [transactions]);

  // Overall totals for summary (full/half/free counts and amounts)
  const aggregatedTotals = React.useMemo(() => {
    const totals = {
      fullCount: 0,
      fullAmount: 0,
      halfCount: 0,
      halfAmount: 0,
      freeCount: 0,
      freeAmount: 0,
    };
    if (!Array.isArray(transactions)) return totals;
    transactions.forEach(t => {
      const amt = Number(t.amount || 0);
      const ptype = (t.payment_type || t.paymentType || t.category || '').toLowerCase();
      const cardType = (t.card_type || t.cardType || '').toString().toLowerCase();

      if (ptype === 'class_payment') {
        if (cardType) {
          if (cardType === 'free') {
            totals.freeCount += 1;
            totals.freeAmount += 0;
          } else if (cardType === 'half') {
            totals.halfCount += 1;
            totals.halfAmount += amt;
          } else {
            totals.fullCount += 1;
            totals.fullAmount += amt;
          }
        } else {
          // fallback heuristics
          const notes = (t.notes || t.description || t.note || '').toString();
          if (amt === 0) {
            totals.freeCount += 1;
            totals.freeAmount += 0;
          } else if (/half/i.test(notes)) {
            totals.halfCount += 1;
            totals.halfAmount += amt;
          } else {
            totals.fullCount += 1;
            totals.fullAmount += amt;
          }
        }
      }
    });
    return totals;
  }, [transactions]);
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
  const timeStr = today.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const handlePrint = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const printWindow = window.open('', '_blank', 'width=1000,height=700');
      if (!printWindow) {
        alert('Please allow pop-ups to print the report');
        setIsGenerating(false);
        return;
      }

      // Build different HTML depending on mode
      let reportHTML = '';
      if (mode === 'full') {
        // Build full report with per-class aggregation table
        const rows = aggregatedByClass.map(r => `
          <tr>
            <td>${(r.className || '-')}</td>
            <td>${(r.teacher || '-')}</td>
            <td style="text-align:center">${r.halfCards || 0}</td>
            <td style="text-align:center">${r.freeCards || 0}</td>
            <td style="text-align:right">LKR ${Number(r.totalAmount || 0).toLocaleString()}</td>
            <td style="text-align:center">${r.txCount || 0}</td>
          </tr>
        `).join('');

        const totalCollected = aggregatedByClass.reduce((s, x) => s + (Number(x.totalAmount) || 0), 0);
        reportHTML = `
          <!doctype html>
          <html>
          <head>
            <meta charset="utf-8" />
            <title>Full Day End Report - ${dateStr}</title>
            <style>
              body{font-family:Arial,sans-serif;padding:20px}
              h1{color:#059669}
              table{width:100%;border-collapse:collapse;margin-top:20px}
              th,td{border:1px solid #e6e6e6;padding:8px;text-align:left}
              th{background:#f8fafc}
              .right{text-align:right}
            </style>
          </head>
          <body>
            <h1>TCMS - Full Day End Report</h1>
            <div><strong>Date:</strong> ${dateStr}</div>
            <div><strong>Generated:</strong> ${timeStr}</div>
            <div><strong>Cashier:</strong> ${getUserData()?.name || 'Cashier'}</div>

            <table>
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Teacher</th>
                  <th style="width:120px;text-align:center">Half Cards Issued</th>
                  <th style="width:120px;text-align:center">Free Cards Issued</th>
                  <th style="text-align:right">Total Amount Collected</th>
                  <th style="width:120px;text-align:center">Transactions</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
                <tr>
                  <td colspan="4" style="text-align:right;font-weight:bold">Grand Total</td>
                  <td style="text-align:right;font-weight:bold">LKR ${Number(totalCollected).toLocaleString()}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            <div style="margin-top:30px;text-align:center;font-size:12px;color:#666">Generated by TCMS - Full Day End Report</div>
            <script>window.print();</script>
          </body>
          </html>
        `;
      } else {
        // Summary mode - existing report (kept largely same)
        reportHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Day End Report - ${dateStr}</title>
            <style>
              @media print { @page { margin: 0.5in; } body { margin: 0; } .no-print { display: none; } }
              * { margin:0; padding:0; box-sizing:border-box }
              body { font-family: Arial, sans-serif; padding:20px }
              .report-container { max-width:800px; margin:0 auto }
              .header { text-align:center; border-bottom:3px solid #059669; padding-bottom:20px; margin-bottom:30px }
              .header h1 { font-size:28px; color:#059669 }
              .meta-info { display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:30px; padding:15px; background:#f1f5f9; border-radius:8px }
              .summary-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:15px}
              .card{padding:15px;border:2px solid #e2e8f0;border-radius:8px;background:#fff}
            </style>
          </head>
          <body>
            <div class="report-container">
              <div class="header"><h1>TCMS</h1><div>Day End Report</div></div>
              <div class="meta-info">
                <div><strong>Date:</strong> ${dateStr}</div>
                <div><strong>Generated:</strong> ${timeStr}</div>
                <div><strong>Cashier:</strong> ${getUserData()?.name || 'Cashier'}</div>
                <div><strong>Report Type:</strong> Daily Summary</div>
              </div>
              <div class="summary-grid">
                <div class="card"><div><strong>Today's Collections</strong></div><div>LKR ${Number(kpis.totalToday || 0).toLocaleString()}</div></div>
                <div class="card"><div><strong>Receipts Issued</strong></div><div>${kpis.receipts || 0}</div></div>
                <div class="card"><div><strong>Pending Payments</strong></div><div>${kpis.pending || 0}</div></div>
                <div class="card"><div><strong>Cash Drawer</strong></div><div>LKR ${Number(kpis.drawer || 0).toLocaleString()}</div></div>
              </div>
              <div style="margin-top:20px">Opening: ${openingTime || '-'} • Closing: ${timeStr}</div>
              <div style="margin-top:30px;text-align:center;color:#666;font-size:12px">Generated by TCMS</div>
            </div>
            <script>window.print();</script>
          </body>
          </html>
        `;
      }

      printWindow.document.write(reportHTML);
      printWindow.document.close();

      setTimeout(() => setIsGenerating(false), 500);
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FaFileInvoice className="text-3xl" />
                Day End Report
              </h2>
              <div className="text-sm opacity-90 mt-1">{dateStr} • {timeStr}</div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <style>
            {`
              #day-end-report-content .report-container {
                max-width: 800px;
                margin: 0 auto;
              }
              #day-end-report-content .header {
                text-align: center;
                border-bottom: 3px solid #059669;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              #day-end-report-content .header-title {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-bottom: 10px;
              }
              #day-end-report-content .logo-icon {
                font-size: 36px;
              }
              #day-end-report-content .header h1 {
                font-size: 28px;
                color: #059669;
                margin: 0;
              }
              #day-end-report-content .header .subtitle {
                font-size: 14px;
                color: #64748b;
              }
              #day-end-report-content .meta-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 30px;
                padding: 15px;
                background: #f1f5f9;
                border-radius: 8px;
              }
              #day-end-report-content .meta-item strong {
                color: #334155;
                margin-right: 8px;
              }
              #day-end-report-content .section {
                margin-bottom: 30px;
              }
              #day-end-report-content .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 2px solid #e2e8f0;
              }
              #day-end-report-content .summary-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 20px;
              }
              #day-end-report-content .summary-card {
                padding: 15px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                background: #ffffff;
              }
              #day-end-report-content .summary-card .label {
                font-size: 12px;
                color: #64748b;
                margin-bottom: 5px;
              }
              #day-end-report-content .summary-card .value {
                font-size: 24px;
                font-weight: bold;
                color: #1e293b;
              }
              #day-end-report-content .summary-card .value.success {
                color: #059669;
              }
              #day-end-report-content .summary-card .value.warning {
                color: #ea580c;
              }
              #day-end-report-content .table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
              }
              #day-end-report-content .table th,
              #day-end-report-content .table td {
                padding: 10px;
                text-align: left;
                border-bottom: 1px solid #e2e8f0;
              }
              #day-end-report-content .table th {
                background: #f8fafc;
                font-weight: 600;
                color: #475569;
                font-size: 13px;
              }
              #day-end-report-content .table td {
                font-size: 14px;
                color: #334155;
              }
              #day-end-report-content .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e2e8f0;
                text-align: center;
                font-size: 12px;
                color: #64748b;
              }
              #day-end-report-content .signature-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-top: 50px;
              }
              #day-end-report-content .signature-box {
                text-align: center;
              }
              #day-end-report-content .signature-line {
                border-top: 2px solid #000;
                margin: 40px 20px 10px;
              }
              #day-end-report-content .signature-label {
                font-size: 13px;
                color: #475569;
              }
              #day-end-report-content .highlight {
                background: #fef3c7;
                padding: 15px;
                border-left: 4px solid #f59e0b;
                border-radius: 4px;
                margin: 15px 0;
              }
            `}
          </style>
          <div id="day-end-report-content">
            <div className="report-container">
              {/* Header for Print */}
              <div className="header">
                <div className="header-title">
                  <span className="logo-icon">🎓</span>
                  <h1>TCMS</h1>
                </div>
                <div className="subtitle">Day End Report</div>
              </div>

              {/* Meta Information */}
              <div className="meta-info">
                <div className="meta-item">
                  <strong>Date:</strong> {dateStr}
                </div>
                <div className="meta-item">
                  <strong>Report Generated:</strong> {timeStr}
                </div>
                <div className="meta-item">
                  <strong>Cashier:</strong> {getUserData()?.name || 'Cashier'}
                </div>
                <div className="meta-item">
                  <strong>Report Type:</strong> Daily Summary
                </div>
              </div>

              {/* Financial Summary / Full table depending on mode */}
              {mode === 'full' ? (
                <div className="section">
                  <div className="section-title">Full Day - Collections by Class</div>
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Class Name</th>
                          <th>Teacher</th>
                          <th style={{ textAlign: 'center' }}>Half Cards Issued</th>
                          <th style={{ textAlign: 'center' }}>Free Cards Issued</th>
                          <th style={{ textAlign: 'right' }}>Total Amount Collected</th>
                          <th style={{ textAlign: 'center' }}>Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aggregatedByClass.map((r, idx) => (
                          <tr key={idx}>
                            <td>{r.className}</td>
                            <td>{r.teacher || '-'}</td>
                            <td style={{ textAlign: 'center' }}>{r.halfCards || 0}</td>
                            <td style={{ textAlign: 'center' }}>{r.freeCards || 0}</td>
                            <td style={{ textAlign: 'right' }}>LKR {Number(r.totalAmount || 0).toLocaleString()}</td>
                            <td style={{ textAlign: 'center' }}>{r.txCount || 0}</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold' }}>Grand Total</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {Number(aggregatedByClass.reduce((s, x) => s + (Number(x.totalAmount) || 0), 0)).toLocaleString()}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="section">
                  <div className="section-title">Financial Summary</div>
                  <div className="summary-grid">
                    <div className="summary-card">
                      <div className="label">Today's Collections</div>
                      <div className="value success">LKR {Number(kpis.totalToday || 0).toLocaleString()}</div>
                    </div>
                    <div className="summary-card">
                      <div className="label">Receipts Issued</div>
                      <div className="value">{kpis.receipts || 0}</div>
                    </div>
                    <div className="summary-card">
                      <div className="label">Pending Payments</div>
                      <div className="value warning">{kpis.pending || 0}</div>
                    </div>
                    <div className="summary-card">
                      <div className="label">Cash Drawer Total</div>
                      <div className="value">LKR {Number(kpis.drawer || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Full/Half/Free breakdown */}
                  <div style={{ marginTop: 16 }}>
                    <div className="section-title">Card Issuance Breakdown (Today)</div>
                    <div className="summary-grid">
                      <div className="summary-card">
                        <div className="label">Full Cards Issued (count)</div>
                        <div className="value">{aggregatedTotals.fullCount || 0}</div>
                        <div className="text-sm text-slate-500">Amount: LKR {Number(aggregatedTotals.fullAmount || 0).toLocaleString()}</div>
                      </div>
                      <div className="summary-card">
                        <div className="label">Half Cards Issued (count)</div>
                        <div className="value">{aggregatedTotals.halfCount || 0}</div>
                        <div className="text-sm text-slate-500">Amount: LKR {Number(aggregatedTotals.halfAmount || 0).toLocaleString()}</div>
                      </div>
                      <div className="summary-card">
                        <div className="label">Free Cards Issued</div>
                        <div className="value">{aggregatedTotals.freeCount || 0}</div>
                        <div className="text-sm text-slate-500">Amount: LKR {Number(aggregatedTotals.freeAmount || 0).toLocaleString()}</div>
                      </div>
                      <div className="summary-card">
                        <div className="label">Total Transactions</div>
                        <div className="value">{kpis.receipts || 0}</div>
                        <div className="text-sm text-slate-500">Total Collected: LKR {Number(kpis.totalToday || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Notes */}
              <div className="section">
                <div className="section-title">Summary & Notes</div>
                <table className="table">
                  <tbody>
                    <tr>
                      <td><strong>Opening Time:</strong></td>
                      <td>{openingTime || '-'}</td>
                    </tr>
                    <tr>
                      <td><strong>Closing Time:</strong></td>
                      <td>{timeStr}</td>
                    </tr>
                    <tr>
                      <td><strong>Total Transactions:</strong></td>
                      <td>{kpis.receipts || 0} receipts issued</td>
                    </tr>
                    <tr>
                      <td><strong>Payment Methods:</strong></td>
                      <td>Cash</td>
                    </tr>
                    <tr>
                      <td><strong>Status:</strong></td>
                      <td style={{ color: '#059669', fontWeight: 'bold' }}>Day End Completed</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature Section */}
              <div className="signature-section">
                <div className="signature-box">
                  <div className="signature-line"></div>
                  <div className="signature-label">Cashier Signature</div>
                </div>
                <div className="signature-box">
                  <div className="signature-line"></div>
                  <div className="signature-label">Manager Signature</div>
                </div>
              </div>

              {/* Footer */}
              <div className="footer">
                <div>Generated by TCMS (Tuition Class Management System)</div>
                <div>This is a computer-generated report and requires proper authorization.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Report ready for printing
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isGenerating
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  <FaFileInvoice />
                  Print Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Month End Report Modal - Comprehensive monthly summary
const MonthEndReportModal = ({ onClose, kpis }) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  
  const today = new Date();
  const monthStr = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long'
  });
  const dateStr = today.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
  const timeStr = today.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Get first and last day of current month
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const periodStr = `${firstDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  const handlePrint = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        alert('Please allow pop-ups to print the report');
        setIsGenerating(false);
        return;
      }

      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Month End Report - ${monthStr}</title>
          <style>
            @media print {
              @page { margin: 0.5in; }
              body { margin: 0; }
              .no-print { display: none; }
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: white;
            }
            .report-container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #059669;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header-title {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              margin-bottom: 10px;
            }
            .logo-icon {
              font-size: 36px;
            }
            .header h1 {
              font-size: 28px;
              color: #059669;
              margin: 0;
            }
            .header .subtitle {
              font-size: 14px;
              color: #64748b;
            }
            .meta-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 30px;
              padding: 15px;
              background: #f1f5f9;
              border-radius: 8px;
            }
            .meta-item strong {
              color: #334155;
              margin-right: 8px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e2e8f0;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .summary-card {
              padding: 15px;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              background: #ffffff;
            }
            .summary-card .label {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 5px;
            }
            .summary-card .value {
              font-size: 24px;
              font-weight: bold;
              color: #1e293b;
            }
            .summary-card .value.success {
              color: #059669;
            }
            .summary-card .value.warning {
              color: #ea580c;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .table th, .table td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            .table th {
              background: #f8fafc;
              font-weight: 600;
              color: #475569;
              font-size: 13px;
            }
            .table td {
              font-size: 14px;
              color: #334155;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              text-align: center;
              font-size: 12px;
              color: #64748b;
            }
            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-top: 50px;
            }
            .signature-box {
              text-align: center;
            }
            .signature-line {
              border-top: 2px solid #000;
              margin: 40px 20px 10px;
            }
            .signature-label {
              font-size: 13px;
              color: #475569;
            }
            .highlight {
              background: #fef3c7;
              padding: 15px;
              border-left: 4px solid #f59e0b;
              border-radius: 4px;
              margin: 15px 0;
            }
            .status-success {
              color: #059669;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <!-- Header -->
            <div class="header">
              <div class="header-title">
                <span class="logo-icon">🎓</span>
                <h1>TCMS</h1>
              </div>
              <div class="subtitle">Month End Report</div>
            </div>

            <!-- Meta Information -->
            <div class="meta-info">
              <div class="meta-item">
                <strong>Month:</strong> ${monthStr}
              </div>
              <div class="meta-item">
                <strong>Report Generated:</strong> ${dateStr}, ${timeStr}
              </div>
              <div class="meta-item">
                <strong>Period:</strong> ${periodStr}
              </div>
              <div class="meta-item">
                <strong>Cashier:</strong> ${getUserData()?.name || 'Cashier'}
              </div>
            </div>

            <!-- Financial Summary -->
            <div class="section">
              <div class="section-title">Monthly Financial Summary</div>
              <div class="summary-grid">
                <div class="summary-card">
                  <div class="label">Total Monthly Collections</div>
                  <div class="value success">LKR ${Number(kpis.totalToday || 0).toLocaleString()}</div>
                </div>
                <div class="summary-card">
                  <div class="label">Total Receipts Issued</div>
                  <div class="value">${kpis.receipts || 0}</div>
                </div>
                <div class="summary-card">
                  <div class="label">Pending Payments</div>
                  <div class="value warning">${kpis.pending || 0}</div>
                </div>
                <div class="summary-card">
                  <div class="label">Total Cash Collected</div>
                  <div class="value">LKR ${Number(kpis.drawer || 0).toLocaleString()}</div>
                </div>
              </div>
              ${kpis.totalToday > 0 ? `
                <div class="highlight">
                  <strong>💰 Average Transaction Value:</strong> LKR ${kpis.receipts > 0 ? (kpis.totalToday / kpis.receipts).toFixed(2) : '0.00'}
                </div>
              ` : ''}
            </div>

            <!-- Summary Notes -->
            <div class="section">
              <div class="section-title">Summary & Notes</div>
              <table class="table">
                <tbody>
                  <tr>
                    <td><strong>Reporting Period:</strong></td>
                    <td>${periodStr}</td>
                  </tr>
                  <tr>
                    <td><strong>Report Date:</strong></td>
                    <td>${dateStr}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Transactions:</strong></td>
                    <td>${kpis.receipts || 0} receipts issued</td>
                  </tr>
                  <tr>
                    <td><strong>Payment Methods:</strong></td>
                    <td>Cash</td>
                  </tr>
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td class="status-success">Month End Completed</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Signature Section -->
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Cashier Signature</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Manager Signature</div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div>Generated by TCMS (Tuition Class Management System)</div>
              <div>This is a computer-generated report and requires proper authorization.</div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
        </html>
      `;

      printWindow.document.write(reportHTML);
      printWindow.document.close();
      
      setTimeout(() => {
        setIsGenerating(false);
      }, 500);
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FaFileInvoice className="text-3xl" />
                Month End Report
              </h2>
              <div className="text-sm opacity-90 mt-1">{monthStr} • {dateStr}</div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <style>
            {`
              #month-end-report-content .report-container {
                max-width: 800px;
                margin: 0 auto;
              }
              #month-end-report-content .header {
                text-align: center;
                border-bottom: 3px solid #059669;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              #month-end-report-content .header-title {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-bottom: 10px;
              }
              #month-end-report-content .logo-icon {
                font-size: 36px;
              }
              #month-end-report-content .header h1 {
                font-size: 28px;
                color: #059669;
                margin: 0;
              }
              #month-end-report-content .header .subtitle {
                font-size: 14px;
                color: #64748b;
              }
              #month-end-report-content .meta-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 30px;
                padding: 15px;
                background: #f1f5f9;
                border-radius: 8px;
              }
              #month-end-report-content .meta-item strong {
                color: #334155;
                margin-right: 8px;
              }
              #month-end-report-content .section {
                margin-bottom: 30px;
              }
              #month-end-report-content .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 2px solid #e2e8f0;
              }
              #month-end-report-content .summary-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 20px;
              }
              #month-end-report-content .summary-card {
                padding: 15px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                background: #ffffff;
              }
              #month-end-report-content .summary-card .label {
                font-size: 12px;
                color: #64748b;
                margin-bottom: 5px;
              }
              #month-end-report-content .summary-card .value {
                font-size: 24px;
                font-weight: bold;
                color: #1e293b;
              }
              #month-end-report-content .summary-card .value.success {
                color: #059669;
              }
              #month-end-report-content .summary-card .value.warning {
                color: #ea580c;
              }
              #month-end-report-content .table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
              }
              #month-end-report-content .table th,
              #month-end-report-content .table td {
                padding: 10px;
                text-align: left;
                border-bottom: 1px solid #e2e8f0;
              }
              #month-end-report-content .table th {
                background: #f8fafc;
                font-weight: 600;
                color: #475569;
                font-size: 13px;
              }
              #month-end-report-content .table td {
                font-size: 14px;
                color: #334155;
              }
              #month-end-report-content .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e2e8f0;
                text-align: center;
                font-size: 12px;
                color: #64748b;
              }
              #month-end-report-content .signature-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-top: 50px;
              }
              #month-end-report-content .signature-box {
                text-align: center;
              }
              #month-end-report-content .signature-line {
                border-top: 2px solid #000;
                margin: 40px 20px 10px;
              }
              #month-end-report-content .signature-label {
                font-size: 13px;
                color: #475569;
              }
              #month-end-report-content .highlight {
                background: #fef3c7;
                padding: 15px;
                border-left: 4px solid #f59e0b;
                border-radius: 4px;
                margin: 15px 0;
              }
            `}
          </style>
          <div id="month-end-report-content">
            <div className="report-container">
              {/* Header for Print */}
              <div className="header">
                <div className="header-title">
                  <span className="logo-icon">🎓</span>
                  <h1>TCMS</h1>
                </div>
                <div className="subtitle">Month End Report</div>
              </div>

              {/* Meta Information */}
              <div className="meta-info">
                <div className="meta-item">
                  <strong>Month:</strong> {monthStr}
                </div>
                <div className="meta-item">
                  <strong>Report Generated:</strong> {dateStr}, {timeStr}
                </div>
                <div className="meta-item">
                  <strong>Period:</strong> {periodStr}
                </div>
                <div className="meta-item">
                  <strong>Cashier:</strong> {getUserData()?.name || 'Cashier'}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="section">
                <div className="section-title">Monthly Financial Summary</div>
                <div className="summary-grid">
                  <div className="summary-card">
                    <div className="label">Total Monthly Collections</div>
                    <div className="value success">LKR {Number(kpis.totalToday || 0).toLocaleString()}</div>
                  </div>
                  <div className="summary-card">
                    <div className="label">Total Receipts Issued</div>
                    <div className="value">{kpis.receipts || 0}</div>
                  </div>
                  <div className="summary-card">
                    <div className="label">Pending Payments</div>
                    <div className="value warning">{kpis.pending || 0}</div>
                  </div>
                  <div className="summary-card">
                    <div className="label">Total Cash Collected</div>
                    <div className="value">LKR {Number(kpis.drawer || 0).toLocaleString()}</div>
                  </div>
                </div>

                {kpis.totalToday > 0 && (
                  <div className="highlight">
                    <strong>💰 Average Transaction Value:</strong> LKR {kpis.receipts > 0 ? (kpis.totalToday / kpis.receipts).toFixed(2) : '0.00'}
                  </div>
                )}
              </div>

              {/* Summary Notes */}
              <div className="section">
                <div className="section-title">Summary & Notes</div>
                <table className="table">
                  <tbody>
                    <tr>
                      <td><strong>Reporting Period:</strong></td>
                      <td>{periodStr}</td>
                    </tr>
                    <tr>
                      <td><strong>Report Date:</strong></td>
                      <td>{dateStr}</td>
                    </tr>
                    <tr>
                      <td><strong>Total Transactions:</strong></td>
                      <td>{kpis.receipts || 0} receipts issued</td>
                    </tr>
                    <tr>
                      <td><strong>Payment Methods:</strong></td>
                      <td>Cash</td>
                    </tr>
                    <tr>
                      <td><strong>Status:</strong></td>
                      <td style={{ color: '#059669', fontWeight: 'bold' }}>Month End Completed</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature Section */}
              <div className="signature-section">
                <div className="signature-box">
                  <div className="signature-line"></div>
                  <div className="signature-label">Cashier Signature</div>
                </div>
                <div className="signature-box">
                  <div className="signature-line"></div>
                  <div className="signature-label">Manager Signature</div>
                </div>
              </div>

              {/* Footer */}
              <div className="footer">
                <div>Generated by TCMS (Tuition Class Management System)</div>
                <div>This is a computer-generated report and requires proper authorization.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Report ready for printing
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isGenerating
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  <FaFileInvoice />
                  Print Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Unlock Modal - Password verification to unlock dashboard
const UnlockModal = ({ onClose, onUnlock, cashierName }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    // Auto-focus password input
    setTimeout(() => passwordInputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Use the existing login API with email/userid and password
      const userData = getUserData();
      const credentials = {
        userid: userData?.email || userData?.userid || userData?.id,
        password: password
      };

      await login(credentials);
      
      // If login was successful (no error thrown), unlock the dashboard
      onUnlock();
      onClose();

    } catch (err) {
      setError('Incorrect password. Please try again.');
      setPassword('');
      passwordInputRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-5 rounded-t-xl">
          <div className="flex items-center justify-center gap-3">
            <FaLock className="text-3xl" />
            <div className="text-center">
              <h2 className="text-2xl font-bold">Session Locked</h2>
              <div className="text-sm opacity-90 mt-1">Enter your password to unlock</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center mb-4">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl font-bold text-orange-600">
                {cashierName ? cashierName.charAt(0).toUpperCase() : 'C'}
              </span>
            </div>
            <div className="font-semibold text-slate-800">{cashierName || 'Cashier'}</div>
            <div className="text-sm text-slate-500">Locked for security</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              ref={passwordInputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              disabled={isVerifying}
            />
            {error && (
              <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                <FaExclamationTriangle />
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying || !password.trim()}
            className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              isVerifying || !password.trim()
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {isVerifying ? (
              <>
                <span className="animate-spin">⏳</span>
                Verifying...
              </>
            ) : (
              <>
                <FaLockOpen />
                Unlock Dashboard
              </>
            )}
          </button>

          <div className="text-xs text-center text-slate-500 mt-4">
            <p>🔒 Your session is locked for security purposes.</p>
            <p className="mt-1">Enter your password to continue working.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

// Quick Payment Modal for FAST cashier workflow
const QuickPaymentModal = ({ student, classData, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
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
          : 'Monthly fee payment',
        cashierId: getUserData()?.userid,
        createdBy: getUserData()?.userid
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
              payment_amount: finalFee,
              payment_status: 'paid'
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
        
        // Always print receipt when payment is made
        if (transactionId) {
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

// Admission Fee Warning Modal - Information popup when student hasn't paid admission fee
const AdmissionFeeWarningModal = ({ onClose }) => {
  const buttonRef = React.useRef(null);

  React.useEffect(() => {
    // Auto-focus the button when modal opens
    buttonRef.current?.focus();

    // Handle Enter key press
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-5 rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>Admission Fee Not Paid</span>
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <p className="text-slate-800 font-medium mb-3">
              This student has not paid the admission fee yet.
            </p>
            <div className="space-y-2 text-sm text-slate-700">
              <p className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span><strong>Required for:</strong> Physical, Hybrid 1, Hybrid 2, Hybrid 4 classes</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Not needed for:</strong> Online Only, Hybrid 3 classes</span>
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Note:</strong> The admission fee can be collected via the Cashier Dashboard when the student enrolls in their first physical or hybrid class.
            </p>
          </div>

          <button
            ref={buttonRef}
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-yellow-300"
          >
            OK, I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

/* REMOVED: Complex Admission Fee Payment Modal
 * This modal was too complex - replaced with simple warning approach
 * Admission fee is now collected through Quick Enrollment modal's 2-option payment system
 * Kept here for reference/future use if needed
 *
// Admission Fee Payment Modal - MANDATORY for first physical/hybrid enrollment
const AdmissionFeeModal = ({ student, onClose, onSuccess }) => {
  const [admissionFee, setAdmissionFee] = useState(5000); // Default admission fee
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayAdmissionFee = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      const studentIdForPayment = student.studentId || student.id;
      
      // Record admission fee payment in payment backend (ALWAYS CASH)
      const payload = {
        paymentType: 'admission_fee',
        paymentMethod: 'cash',
        channel: 'physical',
        studentId: studentIdForPayment,
        amount: admissionFee,
        notes: 'Admission Fee - First time physical/hybrid enrollment',
        cashierId: getUserData()?.userid,
        createdBy: getUserData()?.userid
      };
      
      const paymentRes = await createPayment(payload);
      
      if (!paymentRes?.success) {
        alert(paymentRes?.message || 'Failed to record admission fee payment');
        setIsProcessing(false);
        return;
      }

      alert(`✅ Admission Fee Collected: LKR ${admissionFee.toFixed(2)}\n\nStudent can now proceed with class enrollment.`);
      onSuccess();
    } catch (error) {
      console.error('Admission fee payment error:', error);
      alert(error?.message || 'Failed to process admission fee payment');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-5 rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaExclamationTriangle className="text-3xl" />
            <span>Admission Fee Required</span>
          </h2>
          <div className="text-sm opacity-90 mt-1">
            {student.firstName} {student.lastName} ({student.studentId || student.id})
          </div>
        </div>

        <div className="p-6">
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-5">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-yellow-600 text-xl mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 mb-2">First Physical/Hybrid Class Enrollment</h3>
                <p className="text-sm text-yellow-800">
                  This student is enrolling in a physical or hybrid class for the first time. 
                  <strong> Admission fee MUST be collected before proceeding.</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Admission Fee Amount (LKR) *
              </label>
              <input
                type="number"
                value={admissionFee}
                onChange={(e) => setAdmissionFee(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-lg font-semibold"
                min="0"
                step="100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Payment Method
              </label>
              <div className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-300 rounded-lg text-slate-600 font-semibold flex items-center gap-2">
                <FaMoneyBill className="text-green-600 text-lg" />
                <span>Cash Only</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mt-5 border-2 border-slate-200">
            <div className="flex items-center justify-between text-lg font-bold">
              <span className="text-slate-700">Total to Collect:</span>
              <span className="text-orange-600">LKR {admissionFee.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handlePayAdmissionFee}
            disabled={isProcessing || admissionFee <= 0}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              `Collect LKR ${admissionFee.toFixed(2)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
*/

// Quick Enrollment Modal for FAST enrollment workflow
const QuickEnrollmentModal = ({ student, studentEnrollments = [], studentPayments = [], onClose, onSuccess }) => {
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payNow, setPayNow] = useState(true);
  const [paymentOption, setPaymentOption] = useState('both'); // 'both', 'admission_only', 'defer'
  const [admissionFee, setAdmissionFee] = useState(1000); // Default admission fee, but can be edited
  
  // Free Card and Half Card State
  const [cardType, setCardType] = useState('none'); // 'none', 'half', 'full'
  const [cardValidFrom, setCardValidFrom] = useState('');
  const [cardValidTo, setCardValidTo] = useState('');
  const [cardNotes, setCardNotes] = useState('');
  const [validFromOption, setValidFromOption] = useState('now'); // 'now', 'date', 'month'
  const [validToOption, setValidToOption] = useState('class_end'); // 'class_end', 'date', 'month'
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedToMonth, setSelectedToMonth] = useState('');
  
  // Auto-set dates based on options
  useEffect(() => {
    if (cardType === 'none') return;
    
    // Set Valid From date
    if (validFromOption === 'now') {
      const today = new Date().toISOString().split('T')[0];
      setCardValidFrom(today);
    } else if (validFromOption === 'month' && selectedMonth) {
      // First day of selected month
      setCardValidFrom(selectedMonth + '-01');
    }
    
    // Set Valid To date
    if (validToOption === 'class_end' && selectedClass) {
      const classEndDate = selectedClass.end_date || selectedClass.endDate;
      if (classEndDate) {
        setCardValidTo(classEndDate);
      }
    } else if (validToOption === 'month' && selectedToMonth) {
      // Last day of selected month
      const [year, month] = selectedToMonth.split('-');
      const lastDay = new Date(year, month, 0).getDate();
      setCardValidTo(`${selectedToMonth}-${lastDay}`);
    }
  }, [validFromOption, validToOption, selectedMonth, selectedToMonth, cardType, selectedClass]);
  
  // Check if admission fee is required
  const admissionFeePaid = studentPayments.some(payment => {
    const paymentType = (payment.payment_type || payment.paymentType || '').toLowerCase();
    return paymentType === 'admission_fee';
  });
  
  // Check if selected class requires physical attendance
  const requiresPhysicalAttendance = (deliveryMethod) => {
    const method = (deliveryMethod || '').toLowerCase().trim();
    return method === 'physical' || 
           method === 'physical only' ||
           method === 'hybrid 1' || 
           method === 'hybrid 2' || 
           method === 'hybrid 4' ||
           method.includes('physical');
  };
  
  const selectedClassNeedsAdmissionFee = selectedClass && 
    !admissionFeePaid && 
    requiresPhysicalAttendance(selectedClass.delivery_method || selectedClass.deliveryMethod);

  useEffect(() => {
    loadClasses();
  }, []);
  
  // Set default payment option when admission fee is required
  useEffect(() => {
    if (selectedClassNeedsAdmissionFee) {
      setPaymentOption('both'); // Default to paying everything
      setPayNow(true);
    }
  }, [selectedClassNeedsAdmissionFee]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await getActiveClasses();
      const classes = response?.data || response || [];
      
      // Filter out classes the student is already enrolled in
      const enrolledClassIds = studentEnrollments.map(enr => enr.classId || enr.class_id);
      let filteredClasses = classes.filter(cls => !enrolledClassIds.includes(cls.id));
      
      // Filter by student's stream - only show classes matching student's stream
      const studentStream = student.stream;
      if (studentStream) {
        filteredClasses = filteredClasses.filter(cls => {
          const classStream = cls.stream;
          // Match exactly if stream is specified
          return classStream === studentStream;
        });
      }
      
      setAvailableClasses(filteredClasses);
    } catch (error) {
      console.error('Failed to load classes:', error);
      alert('Failed to load available classes');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedClass || submitting) return;
    
    // Validate card dates if a card is selected
    if (cardType !== 'none') {
      if (!cardValidFrom || !cardValidTo) {
        alert('⚠️ Please specify validity period (From and To dates) for the card!');
        setSubmitting(false);
        return;
      }
      
      const fromDate = new Date(cardValidFrom);
      const toDate = new Date(cardValidTo);
      
      if (toDate <= fromDate) {
        alert('⚠️ "Valid To" date must be after "Valid From" date!');
        setSubmitting(false);
        return;
      }
    }

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
      let finalFee = canGetDiscount ? monthlyFee - discountPrice : monthlyFee;
      
      // Apply card discount ONLY if card is currently valid
      const today = new Date();
      const isCardCurrentlyValid = cardType !== 'none' && cardValidFrom && cardValidTo &&
        new Date(cardValidFrom) <= today && 
        new Date(cardValidTo) >= today;
      
      if (cardType === 'full' && isCardCurrentlyValid) {
        finalFee = 0; // Full free card - 100% discount
      } else if (cardType === 'half' && isCardCurrentlyValid) {
        finalFee = finalFee / 2; // Half free card - 50% discount
      }
      
      // Check if admission fee needs to be collected
      const needsAdmissionFee = selectedClassNeedsAdmissionFee;
      
      // CRITICAL VALIDATION: Block enrollment if admission fee is required but not being collected
      if (needsAdmissionFee && paymentOption === 'defer') {
        alert('❌ ENROLLMENT BLOCKED!\n\nAdmission fee (LKR ' + admissionFee.toLocaleString() + ') must be collected before enrolling in physical/hybrid classes.\n\nYou can either:\n1. Pay admission fee + monthly fee (LKR ' + (admissionFee + finalFee).toLocaleString() + ')\n2. Pay admission fee only (LKR ' + admissionFee.toLocaleString() + ') and defer monthly fee');
        setSubmitting(false);
        return;
      }
      
      // Calculate what's being paid
      const payingAdmissionFee = needsAdmissionFee && (paymentOption === 'both' || paymentOption === 'admission_only');
      const payingMonthlyFee = needsAdmissionFee 
        ? (paymentOption === 'both')
        : payNow;
      const totalAmount = (payingAdmissionFee ? admissionFee : 0) + (payingMonthlyFee ? finalFee : 0);

      const studentIdToUse = student.studentId || student.id;

      // STEP 1: Always create enrollment first in class backend
      const enrollmentData = {
        student_id: studentIdToUse,
        class_id: selectedClass.id,
        payment_status: payingMonthlyFee ? 'paid' : 'pending',
        total_fee: finalFee,
        paid_amount: payingMonthlyFee ? finalFee : 0,
        status: 'active',
        // Add card information
        card_type: cardType,
        card_valid_from: cardType !== 'none' ? cardValidFrom : null,
        card_valid_to: cardType !== 'none' ? cardValidTo : null,
        card_notes: cardType !== 'none' ? cardNotes : null
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

      // STEP 2: Record payments based on payment option
      const studentIdForPayment = studentIdToUse;
      
      // Create admission fee payment if needed
      if (payingAdmissionFee) {
        const admissionPayload = {
          paymentType: 'admission_fee',
          paymentMethod: 'cash',
          channel: 'physical',
          studentId: studentIdForPayment,
          classId: selectedClass.id,
          amount: admissionFee,
          notes: paymentOption === 'admission_only' 
            ? 'Admission Fee - Monthly fee deferred' 
            : 'Admission Fee - Collected with first month payment',
          cashierId: getUserData()?.userid,
          createdBy: getUserData()?.userid
        };
        
        const admissionPaymentRes = await createPayment(admissionPayload);
        
        if (!admissionPaymentRes?.success) {
          const errorMsg = admissionPaymentRes?.message || 'Unknown error';
          console.error('❌ Admission fee payment failed:', errorMsg);
          alert('Enrollment created but admission fee payment recording failed: ' + errorMsg + '\n\nPlease collect the admission fee manually.');
          setSubmitting(false);
          return;
        }
      }
      
      // Create class payment if paying monthly fee (and NOT full free card)
      if (payingMonthlyFee && cardType !== 'full') {
        // Build payment notes with card information
        let paymentNotes = needsAdmissionFee 
          ? 'First month payment (+ admission fee)' 
          : 'First month payment (enrollment)';
        
        if (cardType === 'half') {
          paymentNotes += ' - Half Free Card (50% discount)';
        }
        
        const classPayload = {
          paymentType: 'class_payment',
          paymentMethod: 'cash',
          channel: 'physical',
          studentId: studentIdForPayment,
          classId: selectedClass.id,
          amount: finalFee,
          notes: paymentNotes,
          cashierId: getUserData()?.userid,
          createdBy: getUserData()?.userid
        };
        
        const paymentRes = await createPayment(classPayload);
        
        if (!paymentRes?.success) {
          alert('Enrollment created but class payment recording failed: ' + (paymentRes?.message || 'Unknown error'));
          onSuccess({ enrolled: true, paid: false });
          return;
        }
        
        // Update enrollment paid_amount in class backend after successful payment
        try {
          const enrollmentUpdateRes = await fetch('http://localhost:8087/routes.php/update_enrollment_payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: studentIdForPayment,
              class_id: selectedClass.id,
              payment_amount: finalFee,
              payment_status: 'paid'
            })
          });
          const updateResult = await enrollmentUpdateRes.json();
          if (!updateResult?.success) {
            console.error('❌ Failed to update enrollment payment status:', updateResult);
          }
        } catch (e) {
          console.error('❌ Failed to update enrollment payment:', e);
        }
        
        // Extract transaction ID for receipt
        const transactionId = paymentRes?.transactionId || paymentRes?.data?.transactionId || paymentRes?.data?.transaction_id;
        
        // Always print receipt when payment is made
        if (transactionId && totalAmount > 0) {
          const receiptData = {
            transactionId: transactionId,
            amount: totalAmount,
            paymentMethod: 'Cash',
            notes: payingAdmissionFee && payingMonthlyFee
              ? `Class Fee: LKR ${finalFee.toLocaleString()} + Admission Fee: LKR ${admissionFee.toLocaleString()}`
              : payingAdmissionFee
              ? `Admission Fee Only: LKR ${admissionFee.toLocaleString()} (Monthly fee pending)`
              : 'First month payment',
            originalFee: canGetDiscount && discountPrice > 0 ? monthlyFee : null,
            discount: canGetDiscount && discountPrice > 0 ? discountPrice : null
          };
          
          const userData = getUserData();
          
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
      }
      
      // Success message based on payment option and card type
      let successMessage;
      if (cardType === 'full') {
        successMessage = `Enrollment complete with Full Free Card! No payment required.`;
      } else if (payingAdmissionFee && !payingMonthlyFee) {
        successMessage = `Admission fee collected (LKR ${admissionFee.toLocaleString()}). Monthly fee pending.`;
      } else {
        successMessage = `Enrollment complete! Total paid: LKR ${totalAmount.toLocaleString()}`;
      }
      
      onSuccess({ 
        enrolled: true, 
        paid: totalAmount > 0, 
        amount: totalAmount,
        message: successMessage
      });
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
  let finalFee = canGetSelectedDiscount ? selectedClassFee - selectedClassDiscount : selectedClassFee;
  
  // Apply card discount
  if (cardType === 'full') {
    finalFee = 0; // Full free card - no payment
  } else if (cardType === 'half') {
    finalFee = finalFee / 2; // Half free card - 50% discount
  }

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

              {/* Free Card / Half Card Options */}
              {selectedClass && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-5 mb-5">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-purple-900 flex items-center justify-center gap-2">
                      🎫 Special Cards (Optional)
                    </h3>
                    <p className="text-sm text-purple-700 mt-1">
                      Grant full or half free access to this class
                    </p>
                  </div>

                  {/* Card Type Selection */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Full Free Card */}
                    <label className={`flex items-center gap-3 cursor-pointer rounded-lg p-4 transition-all border-2 ${
                      cardType === 'full'
                        ? 'bg-emerald-100 border-emerald-500 shadow-md'
                        : 'bg-white border-slate-300 hover:border-emerald-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={cardType === 'full'}
                        onChange={(e) => setCardType(e.target.checked ? 'full' : 'none')}
                        className="w-5 h-5 text-emerald-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <span>🆓</span>
                          <span>Full Free Card</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">100% discount - No payment</div>
                      </div>
                    </label>

                    {/* Half Free Card */}
                    <label className={`flex items-center gap-3 cursor-pointer rounded-lg p-4 transition-all border-2 ${
                      cardType === 'half'
                        ? 'bg-blue-100 border-blue-500 shadow-md'
                        : 'bg-white border-slate-300 hover:border-blue-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={cardType === 'half'}
                        onChange={(e) => setCardType(e.target.checked ? 'half' : 'none')}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <span>🎟️</span>
                          <span>Half Free Card</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">50% discount - Pay half</div>
                      </div>
                    </label>
                  </div>

                  {/* Validity Period - Show only if a card is selected */}
                  {cardType !== 'none' && (
                    <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                      <div className="text-sm font-semibold text-purple-900 mb-3">
                        📅 Card Validity Period
                      </div>
                      
                      {/* Valid From Options */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          Valid From <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setValidFromOption('now')}
                            className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                              validFromOption === 'now'
                                ? 'bg-purple-100 border-purple-500 text-purple-900'
                                : 'bg-white border-slate-300 text-slate-700 hover:border-purple-300'
                            }`}
                          >
                            🕐 From Now
                          </button>
                          <button
                            type="button"
                            onClick={() => setValidFromOption('month')}
                            className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                              validFromOption === 'month'
                                ? 'bg-purple-100 border-purple-500 text-purple-900'
                                : 'bg-white border-slate-300 text-slate-700 hover:border-purple-300'
                            }`}
                          >
                            📅 Month
                          </button>
                          <button
                            type="button"
                            onClick={() => setValidFromOption('date')}
                            className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                              validFromOption === 'date'
                                ? 'bg-purple-100 border-purple-500 text-purple-900'
                                : 'bg-white border-slate-300 text-slate-700 hover:border-purple-300'
                            }`}
                          >
                            📆 Date
                          </button>
                        </div>
                        
                        {/* Show input based on selection */}
                        {validFromOption === 'month' && (
                          <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                            required
                          />
                        )}
                        {validFromOption === 'date' && (
                          <input
                            type="date"
                            value={cardValidFrom}
                            onChange={(e) => setCardValidFrom(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                            required
                          />
                        )}
                        {validFromOption === 'now' && (
                          <div className="text-xs text-emerald-600 bg-emerald-50 rounded p-2 mt-1">
                            ✓ Starting from today: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        )}
                      </div>

                      {/* Valid To Options */}
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          Valid To <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setValidToOption('class_end')}
                            className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                              validToOption === 'class_end'
                                ? 'bg-purple-100 border-purple-500 text-purple-900'
                                : 'bg-white border-slate-300 text-slate-700 hover:border-purple-300'
                            }`}
                          >
                            🎓 Class End
                          </button>
                          <button
                            type="button"
                            onClick={() => setValidToOption('month')}
                            className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                              validToOption === 'month'
                                ? 'bg-purple-100 border-purple-500 text-purple-900'
                                : 'bg-white border-slate-300 text-slate-700 hover:border-purple-300'
                            }`}
                          >
                            📅 Month
                          </button>
                          <button
                            type="button"
                            onClick={() => setValidToOption('date')}
                            className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                              validToOption === 'date'
                                ? 'bg-purple-100 border-purple-500 text-purple-900'
                                : 'bg-white border-slate-300 text-slate-700 hover:border-purple-300'
                            }`}
                          >
                            📆 Date
                          </button>
                        </div>
                        
                        {/* Show input based on selection */}
                        {validToOption === 'month' && (
                          <input
                            type="month"
                            value={selectedToMonth}
                            onChange={(e) => setSelectedToMonth(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                            required
                          />
                        )}
                        {validToOption === 'date' && (
                          <input
                            type="date"
                            value={cardValidTo}
                            onChange={(e) => setCardValidTo(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                            required
                          />
                        )}
                        {validToOption === 'class_end' && selectedClass && (
                          <div className="text-xs text-emerald-600 bg-emerald-50 rounded p-2 mt-1">
                            ✓ Until class ends: {selectedClass.end_date || selectedClass.endDate 
                              ? new Date(selectedClass.end_date || selectedClass.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                              : 'Not specified'}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={cardNotes}
                          onChange={(e) => setCardNotes(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm resize-none"
                          rows="2"
                          placeholder="Reason for granting card, sponsor name, etc."
                        />
                      </div>
                    </div>
                  )}

                  {/* Card Discount Summary */}
                  {cardType !== 'none' && (
                    <div className="mt-3 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-400 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {cardType === 'full' ? '🎉' : '✨'}
                          </span>
                          <div>
                            <div className="font-semibold text-emerald-900">
                              {cardType === 'full' ? 'Full Free Card Applied!' : 'Half Free Card Applied!'}
                            </div>
                            <div className="text-xs text-emerald-700">
                              {cardType === 'full' 
                                ? 'Student will be enrolled without any monthly fee payment'
                                : 'Student will pay only 50% of the monthly fee'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admission Fee Required Box - Moved to top */}
              {selectedClass && selectedClassNeedsAdmissionFee && (
                <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4 mb-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <div className="font-bold text-orange-900 mb-1">Admission Fee Required</div>
                      <div className="text-sm text-orange-800 mb-3">
                        Choose a payment option below. Admission fee must be collected before enrollment.
                      </div>
                      
                      {/* Editable Admission Fee Input */}
                      <div className="mt-3 bg-white rounded-lg p-3 border-2 border-orange-300">
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Admission Fee Amount (LKR) *
                        </label>
                        <input
                          type="number"
                          value={admissionFee}
                          onChange={(e) => setAdmissionFee(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none font-semibold text-lg"
                          min="0"
                          step="100"
                          placeholder="Enter admission fee amount"
                        />
                        <div className="text-xs text-slate-500 mt-1">
                          💡 Default: LKR 1,000 (can be adjusted)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Class Summary */}
              {selectedClass && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5 mb-5">
                  <div className="text-center">
                    <div className="text-sm text-blue-700 font-medium mb-2">Selected Class</div>
                    <div className="text-2xl font-bold text-blue-900 mb-3">{selectedClass.class_name}</div>
                    
                    {/* Fee Breakdown */}
                    <div className="bg-white rounded-lg p-4 mb-3">
                      <div className="space-y-2 text-sm">
                        {/* Class Fee - Show ORIGINAL fee (before discount) */}
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Monthly Class Fee:</span>
                          <span className="font-semibold text-slate-800">
                            LKR {selectedClassFee.toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Discount if applicable */}
                        {canGetSelectedDiscount && (
                          <div className="flex justify-between items-center text-green-600">
                            <span>Theory Class Discount:</span>
                            <span className="font-semibold">- LKR {selectedClassDiscount.toLocaleString()}</span>
                          </div>
                        )}
                        
                        {/* Admission Fee if applicable */}
                        {selectedClassNeedsAdmissionFee && payNow && (
                          <>
                            <div className="border-t border-slate-200 my-2"></div>
                            <div className="flex justify-between items-center text-orange-600">
                              <span className="flex items-center gap-1">
                                <span>⚠️</span>
                                <span>Admission Fee (First Time):</span>
                              </span>
                              <span className="font-semibold">LKR {admissionFee.toLocaleString()}</span>
                            </div>
                            <div className="text-xs text-orange-600 text-left bg-orange-50 rounded p-2 mt-1">
                              💡 One-time fee for physical/hybrid class access
                            </div>
                          </>
                        )}
                        
                        {/* Total */}
                        {payNow && (
                          <>
                            <div className="border-t-2 border-blue-300 my-2"></div>
                            <div className="flex justify-between items-center text-lg">
                              <span className="font-bold text-blue-900">Total Amount:</span>
                              <span className="font-bold text-emerald-600">
                                LKR {(finalFee + (selectedClassNeedsAdmissionFee ? admissionFee : 0)).toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Warning for theory enrollment */}
                    {isRevision && selectedClassDiscount > 0 && !isEnrolledInSelectedTheory && (
                      <div className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 border border-amber-200">
                        ⚠️ Enroll in theory class first to get LKR {selectedClassDiscount.toLocaleString()} discount
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Options */}
              <div className="space-y-3 mb-5">
                {selectedClassNeedsAdmissionFee ? (
                  /* Admission Fee Required - Show 2 options */
                  <>
                    {/* Option 1: Pay Everything (Admission + Monthly) */}
                    <label className={`flex items-center gap-3 cursor-pointer rounded-lg p-4 transition-colors border-2 ${
                      paymentOption === 'both'
                        ? 'bg-emerald-50 border-emerald-500 shadow-md'
                        : 'bg-white border-slate-300 hover:border-emerald-300'
                    }`}>
                      <input
                        type="radio"
                        name="paymentOption"
                        value="both"
                        checked={paymentOption === 'both'}
                        onChange={(e) => setPaymentOption(e.target.value)}
                        className="w-5 h-5 text-emerald-600"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xl">💰</span>
                        <div>
                          <div className="font-semibold text-slate-800">Pay Everything Now (Recommended)</div>
                          <div className="text-xs text-slate-600">Admission Fee + First Month Fee</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-600">
                          LKR {(finalFee + admissionFee).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          ({finalFee.toLocaleString()} + {admissionFee.toLocaleString()})
                        </div>
                      </div>
                    </label>
                    
                    {/* Option 2: Pay Admission Fee Only */}
                    <label className={`flex items-center gap-3 cursor-pointer rounded-lg p-4 transition-colors border-2 ${
                      paymentOption === 'admission_only'
                        ? 'bg-blue-50 border-blue-500 shadow-md'
                        : 'bg-white border-slate-300 hover:border-blue-300'
                    }`}>
                      <input
                        type="radio"
                        name="paymentOption"
                        value="admission_only"
                        checked={paymentOption === 'admission_only'}
                        onChange={(e) => setPaymentOption(e.target.value)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xl">🎟️</span>
                        <div>
                          <div className="font-semibold text-slate-800">Pay Admission Fee Only</div>
                          <div className="text-xs text-slate-600">Defer monthly fee for later</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          LKR {admissionFee.toLocaleString()}
                        </div>
                        <div className="text-xs text-orange-600">
                          + LKR {finalFee.toLocaleString()} pending
                        </div>
                      </div>
                    </label>
                  </>
                ) : (
                  /* Normal Case - No Admission Fee Required */
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
                        <div className="text-lg font-bold text-emerald-600">
                          LKR {finalFee.toLocaleString()}
                        </div>
                      </div>
                    )}
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
                  {submitting ? '⏳ Processing...' : cardType === 'full' ? '✅ Enroll' : (payNow ? '💰 Enroll & Pay' : '✅ Enroll')}
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
  
  // Helper function to add cashier ID to payment payloads
  const addCashierInfo = useCallback((payload) => ({
    ...payload,
    cashierId: user?.userid, // Add cashier ID for tracking
    createdBy: user?.userid  // Alternative field name
  }), [user]);
  
  // Initialize lock state from sessionStorage (persists during browser session, but cleared when tab is closed)
  const [isLocked, setIsLocked] = useState(() => {
    const savedLockState = sessionStorage.getItem('cashier_locked');
    return savedLockState === 'true';
  });
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scanValue, setScanValue] = useState('');
  const scanInputRef = useRef(null);
  const studentPanelRef = useRef(null); // Ref for scrolling to student panel
  const mainContentRef = useRef(null); // Ref for scrolling to main content area (student + cashier tools)
  const inactivityTimerRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [kpis, setKpis] = useState({ totalToday: 0, receipts: 0, pending: 0, drawer: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [openingTime, setOpeningTime] = useState('');
  
  // Track cashier opening time (first login of the day)
  useEffect(() => {
    const today = new Date().toDateString(); // e.g., "Thu Oct 09 2025"
    const storedDate = localStorage.getItem('cashier_login_date');
    const storedTime = localStorage.getItem('cashier_opening_time');
    
    if (storedDate === today && storedTime) {
      // Same day, use the FIRST login time that was stored
      setOpeningTime(storedTime);
    } else {
      // New day - record CURRENT time as the first login of this new day
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      localStorage.setItem('cashier_login_date', today);
      localStorage.setItem('cashier_opening_time', currentTime);
      setOpeningTime(currentTime);
    }
  }, []);
  
  // Load cashier KPIs from backend database
  const loadCashierKPIs = useCallback(async () => {
    try {
      const cashierId = user?.userid || 'unknown';
      const response = await getCashierStats(cashierId, 'today');
      
      if (response?.success && response?.data?.stats) {
        const stats = response.data.stats;
        setKpis({
          totalToday: Number(stats.total_collected || 0),
          receipts: Number(stats.total_receipts || 0),
          pending: Number(stats.pending_count || 0),
          drawer: Number(stats.cash_collected || 0)
        });
      }
    } catch (error) {
      console.error('Failed to load cashier KPIs:', error);
      // Keep existing KPIs on error
    }
  }, [user]);
  
  // Load KPIs on mount and set up auto-refresh
  useEffect(() => {
    loadCashierKPIs();
    
    // Refresh KPIs every 30 seconds to stay in sync with database
    const refreshInterval = setInterval(loadCashierKPIs, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [loadCashierKPIs]);

  // Show unlock modal on mount if the session was locked
  useEffect(() => {
    if (isLocked) {
      setShowUnlockModal(true);
    }
  }, []); // Run only once on mount
  
  // Student details modal state
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  
  // Payment history modal state
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  
  // Attendance data state
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  
  // Day End Report modal state
  const [showDayEndReport, setShowDayEndReport] = useState(false);
  const [dayEndMode, setDayEndMode] = useState('summary'); // 'summary' | 'full'
  const [dayEndLoading, setDayEndLoading] = useState(false);
  const [dayEndTransactions, setDayEndTransactions] = useState([]);
  const [dayEndPerClass, setDayEndPerClass] = useState([]);
  
  // Month End Report modal state
  const [showMonthEndReport, setShowMonthEndReport] = useState(false);
  
  // Quick payment modal state
  const [showQuickPay, setShowQuickPay] = useState(false);
  const [quickPayClass, setQuickPayClass] = useState(null);
  const quickPayAmountRef = useRef(null);
  
  // Quick enrollment modal state
  const [showQuickEnroll, setShowQuickEnroll] = useState(false);
  
  // REMOVED: Complex admission fee modal (no longer used)
  // Admission fee collected through Quick Enrollment modal instead
  
  // Admission fee status tracking
  const [admissionFeeStatus, setAdmissionFeeStatus] = useState(null); // 'paid', 'not_paid', or null
  const [showAdmissionFeeWarning, setShowAdmissionFeeWarning] = useState(false);
  
  // Class filter/search state
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('unpaid'); // Default to 'unpaid' (Need Payment)
  
  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Show toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000); // Auto-hide after 3 seconds
  }, []);

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
      // Apply search filter - search in multiple fields
      if (classSearchTerm) {
        const searchLower = classSearchTerm.toLowerCase();
        const className = (enr.className || '').toLowerCase();
        const subject = (enr.subject || '').toLowerCase();
        const stream = (enr.stream || '').toLowerCase();
        const teacher = (enr.teacher || '').toLowerCase();
        const courseType = (enr.courseType || '').toLowerCase();
        
        // Check if search term matches any of the fields
        const matchesSearch = 
          className.includes(searchLower) || 
          subject.includes(searchLower) || 
          stream.includes(searchLower) ||
          teacher.includes(searchLower) ||
          courseType.includes(searchLower);
          
        if (!matchesSearch) {
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
          const paymentType = p.payment_type || p.paymentType || 'class_payment';
          
          // CRITICAL: Only count CLASS payments, NOT admission fee payments
          return paymentMonth === currentMonth && 
                 Number(paymentClassId) === Number(enr.classId) &&
                 (p.status === 'paid' || p.status === 'completed') &&
                 paymentType !== 'admission_fee'; // EXCLUDE admission fee
        });
        return !hasPaymentThisMonth;
      } else if (selectedClassFilter === 'paid') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const hasPaymentThisMonth = (payments || []).some(p => {
          const paymentDate = p.payment_date || p.date;
          const paymentClassId = p.class_id || p.classId;
          const paymentMonth = paymentDate ? paymentDate.slice(0, 7) : null;
          const paymentType = p.payment_type || p.paymentType || 'class_payment';
          
          // CRITICAL: Only count CLASS payments, NOT admission fee payments
          return paymentMonth === currentMonth && 
                 Number(paymentClassId) === Number(enr.classId) &&
                 (p.status === 'paid' || p.status === 'completed') &&
                 paymentType !== 'admission_fee'; // EXCLUDE admission fee
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
      body: JSON.stringify({ 
        student_id: studentId, 
        class_id: classId 
      })
    });
    return res.json();
  };

  const requestForgetCard = async ({ studentId, classId }) => {
    const url = 'http://localhost:8087/routes.php/request_forget_card';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        student_id: studentId, 
        class_id: classId 
      })
    });
    return res.json();
  };

  const printNote = ({ title, student, classRow, reason }) => {
    const w = window.open('', '_blank');
    if (!w) return;
    
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const formattedTime = today.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    const cashierName = getUserData()?.name || 'Cashier';
    const studentId = student?.studentId || student?.id || '';
    const className = classRow?.className || classRow?.class_name || classRow?.subject || '';
    const teacherName = classRow?.teacher || classRow?.teacher_name || '';
    
    // Determine which type of note this is
    const isLatePay = title.toLowerCase().includes('late');
    const isEntryPermit = title.toLowerCase().includes('entry') || title.toLowerCase().includes('permit');
    
    let noteHTML = '';
    
    if (isLatePay) {
      // Late Payment Permission Note - Thermal receipt style
      noteHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Late Payment Permission - ${studentId}</title>
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
            .validity-box {
              background: #f0f0f0;
              padding: 8px;
              margin: 10px 0;
              text-align: center;
              border: 1px solid #999;
              font-weight: bold;
              font-size: 11px;
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
            .signatures {
              margin-top: 30px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              text-align: center;
            }
            .sig-line {
              border-top: 1px solid #000;
              margin: 30px 5px 5px;
            }
            .sig-label {
              font-size: 10px;
              color: #666;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px solid #333;
              font-size: 10px;
            }
            .thank-you {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 8px;
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
              <div class="subtitle">Late Payment Permission</div>
            </div>

            <div class="section">
              <div class="row">
                <span class="label">Date/Time:</span>
                <span class="value">${formattedDate}, ${formattedTime}</span>
              </div>
              <div class="row">
                <span class="label">Student:</span>
                <span class="value">${student?.firstName || ''} ${student?.lastName || ''}</span>
              </div>
              <div class="row">
                <span class="label">Student ID:</span>
                <span class="value">${studentId}</span>
              </div>
              <div class="row">
                <span class="label">Class:</span>
                <span class="value">${className}</span>
              </div>
              <div class="row">
                <span class="label">Teacher:</span>
                <span class="value">${teacherName}</span>
              </div>
            </div>

            <div class="section">
              <div style="font-size: 12px; text-align: center; font-style: italic; color: #555;">
                ${reason || 'Allowed late payment for today only'}
              </div>
            </div>

            <div class="signatures">
              <div>
                <div class="sig-line"></div>
                <div class="sig-label">Teacher Signature</div>
                <div class="sig-label">${teacherName}</div>
              </div>
              <div>
                <div class="sig-line"></div>
                <div class="sig-label">Admin Signature</div>
              </div>
            </div>

            <div class="footer">
              <div class="thank-you">⚠️ Valid for today only - ${formattedDate}</div>
              <div>Issued by: ${cashierName}</div>
              <div style="margin-top: 5px;">This is a computer-generated note</div>
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
    } else if (isEntryPermit) {
      // Entry Permit - Thermal receipt style with scannable barcode
      noteHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Entry Permit - ${studentId}</title>
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
            .barcode-section {
              text-align: center;
              margin: 15px 0;
              padding: 15px 10px;
              background: #f5f5f5;
              border: 1px solid #999;
            }
            .barcode-label {
              font-size: 11px;
              color: #666;
              margin-bottom: 10px;
              font-weight: bold;
            }
            .barcode-img {
              width: 100%;
              max-width: 250px;
              height: auto;
              margin: 10px 0;
            }
            .barcode-id {
              font-size: 14px;
              font-weight: bold;
              letter-spacing: 2px;
              margin-top: 5px;
            }
            .signature {
              margin-top: 30px;
              text-align: center;
            }
            .sig-line {
              border-top: 1px solid #000;
              margin: 25px 20px 5px;
            }
            .sig-label {
              font-size: 10px;
              color: #666;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px solid #333;
              font-size: 10px;
            }
            .thank-you {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 8px;
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
              <div class="subtitle">Entry Permit</div>
            </div>

            <div class="section">
              <div class="row">
                <span class="label">Date/Time:</span>
                <span class="value">${formattedDate}, ${formattedTime}</span>
              </div>
              <div class="row">
                <span class="label">Student:</span>
                <span class="value">${student?.firstName || ''} ${student?.lastName || ''}</span>
              </div>
              <div class="row">
                <span class="label">Student ID:</span>
                <span class="value">${studentId}</span>
              </div>
            </div>

            <div class="section">
              <div style="font-size: 12px; text-align: center; font-style: italic; color: #555;">
                ${reason || 'Permit to enter without ID card - Valid for all classes today'}
              </div>
            </div>

            <!-- Scannable Barcode Section -->
            <div class="barcode-section">
              <div class="barcode-label">STUDENT BARCODE - SCAN FOR ATTENDANCE</div>
              <img src="https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(studentId)}&code=Code128&dpi=96&dataseparator=" 
                   alt="Barcode" 
                   class="barcode-img"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
              <div class="barcode-id" style="display:none;">*${studentId}*</div>
              <div class="barcode-id">${studentId}</div>
            </div>

            <!-- Cashier Signature -->
            <div class="signature">
              <div class="sig-line"></div>
              <div class="sig-label">Cashier Signature</div>
              <div class="sig-label">${cashierName}</div>
            </div>

            <div class="footer">
              <div class="thank-you">⚠️ Valid for today only - ${formattedDate}</div>
              <div>Valid for all classes today</div>
              <div style="margin-top: 5px;">Issued by: ${cashierName}</div>
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
    } else {
      // Generic note format (fallback)
      noteHTML = `
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
              <div class="row"><strong>Date/Time:</strong> ${formattedDate}, ${formattedTime}</div>
              <div class="row"><strong>Student:</strong> ${student?.firstName || ''} ${student?.lastName || ''} (${studentId})</div>
              <div class="row"><strong>Class:</strong> ${className}</div>
              ${reason ? `<div class="row"><strong>Reason:</strong> ${reason}</div>` : ''}
              <div class="row muted">This is an auto-generated note for front-desk verification.</div>
            </div>
            <div style="margin-top:24px" class="row">__________________________<br/>Cashier Signature</div>
            <script>window.print();</script>
          </body>
        </html>
      `;
    }
    
    w.document.write(noteHTML);
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
          setAdmissionFeeStatus(null); // Reset admission fee status
          // Scroll to top of page and focus student lookup input after clearing
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => {
            scanInputRef.current?.focus();
            scanInputRef.current?.select();
          }, 300);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isLocked]);

  // Auto-lock after 5 minutes of inactivity
  useEffect(() => {
    const INACTIVITY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

    const resetTimer = () => {
      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Don't set timer if already locked
      if (isLocked) return;

      // Set new timer
      inactivityTimerRef.current = setTimeout(() => {
        setIsLocked(true);
        setShowUnlockModal(true);
      }, INACTIVITY_TIME);
    };

    // Events that indicate user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [isLocked]);

  const handleLogout = async () => {
    await authLogout();
  };

  const handleLockToggle = () => {
    if (isLocked) {
      // If locked, show unlock modal
      setShowUnlockModal(true);
    } else {
      // If unlocked, lock immediately
      setIsLocked(true);
      sessionStorage.setItem('cashier_locked', 'true');
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
    sessionStorage.setItem('cashier_locked', 'false');
    setShowUnlockModal(false);
    // Focus back to scan input after unlocking
    setTimeout(() => {
      focusBackToScan();
    }, 100);
  };

  // Helper function to check if delivery method requires physical attendance
  const requiresPhysicalAttendance = (deliveryMethod) => {
    const method = (deliveryMethod || '').toLowerCase().trim();
    // Delivery methods that include physical attendance:
    // - physical (Physical Only)
    // - hybrid 1 (Physical + Online)
    // - hybrid 2 (Physical + Recorded)
    // - hybrid 4 (Physical + Online + Recorded)
    // NOT required for: online, hybrid 3 (Online + Recorded only)
    return method === 'physical' || 
           method === 'physical only' ||
           method === 'hybrid 1' || 
           method === 'hybrid 2' || 
           method === 'hybrid 4' ||
           method.includes('physical');
  };

  // Helper function to check if student needs to pay admission fee
  const checkAdmissionFeeRequired = async (studentId, currentEnrollments, allPayments) => {
    // Check if student has any enrollments that require physical attendance
    const hasPhysicalEnrollment = currentEnrollments.some(enr => {
      const deliveryMethod = enr.delivery_method || enr.deliveryMethod || '';
      return requiresPhysicalAttendance(deliveryMethod);
    });
    
    // If no physical attendance enrollments, admission fee not required yet
    if (!hasPhysicalEnrollment) return false;
    
    // Check if admission fee has already been paid
    const admissionFeePaid = allPayments.some(payment => {
      const paymentType = (payment.payment_type || payment.paymentType || '').toLowerCase();
      return paymentType === 'admission_fee';
    });
    
    // If physical enrollment exists but no admission fee paid = REQUIRED
    return !admissionFeePaid;
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
      let transformedEnrollments = [];
      try {
        const enrollRes = await fetch(`http://localhost:8087/routes.php/get_enrollments_by_student?studentId=${studentId}`);
        if (enrollRes.ok) {
          const enrollData = await enrollRes.json();
          const enrollments = enrollData?.data || enrollData || [];
          
          // Transform snake_case to camelCase for consistency
          transformedEnrollments = enrollments.map(enr => ({
            ...enr,
            classId: enr.class_id || enr.classId,
            className: enr.class_name || enr.className,
            subject: enr.subject,
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
            currentStudents: enr.current_students || enr.currentStudents,
            paymentTrackingFreeDays: enr.payment_tracking_free_days || enr.paymentTrackingFreeDays || 7,
            card_type: enr.card_type || 'none',
            card_valid_from: enr.card_valid_from,
            card_valid_to: enr.card_valid_to,
            card_notes: enr.card_notes
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
      const fetchedPayments = Array.isArray(payRes?.data) ? payRes.data : (Array.isArray(payRes) ? payRes : []);
      setPayments(fetchedPayments);
      
      // Fetch student attendance data
      try {
        setAttendanceLoading(true);
        const attendanceRes = await getStudentAttendance(studentId);
        // API returns { success: true, data: [...], count: N }
        const attendanceRecords = attendanceRes?.data || [];
        console.log('Attendance data fetched:', attendanceRecords.length, 'records');
        
        // Enrich attendance records with class information from enrollments
        const enrichedAttendance = attendanceRecords.map(record => {
          // Find matching enrollment by class_id
          const matchingEnrollment = transformedEnrollments.find(
            enr => (enr.classId || enr.class_id) === record.class_id
          );
          
          return {
            ...record,
            class_name: matchingEnrollment?.className || matchingEnrollment?.class_name || 'Unknown Class',
            subject: matchingEnrollment?.subject || 'Subject N/A',
            className: matchingEnrollment?.className || matchingEnrollment?.class_name || 'Unknown Class'
          };
        });
        
        console.log('Enriched attendance with class info:', enrichedAttendance);
        setAttendanceData(Array.isArray(enrichedAttendance) ? enrichedAttendance : []);
      } catch (e) {
        console.error('Failed to fetch attendance:', e);
        setAttendanceData([]);
      } finally {
        setAttendanceLoading(false);
      }
      
      // Check admission fee payment status
      const admissionFeePaid = Array.isArray(fetchedPayments) && fetchedPayments.some(payment => {
        const paymentType = (payment.payment_type || payment.paymentType || '').toLowerCase();
        return paymentType === 'admission_fee';
      });
      
      // Check if student has physical/hybrid enrollments
      const hasPhysicalEnrollment = transformedEnrollments.some(enr => {
        const deliveryMethod = enr.delivery_method || enr.deliveryMethod || '';
        return requiresPhysicalAttendance(deliveryMethod);
      });
      
      // Set admission fee status for badge display
      if (admissionFeePaid) {
        // Student has paid admission fee - always show green "PAID" badge
        setAdmissionFeeStatus('paid');
      } else {
        // Student has NOT paid admission fee - show yellow "NOT PAID" badge + warning
        // This applies whether they have physical enrollments or not
        setAdmissionFeeStatus('not_paid');
        setTimeout(() => {
          setShowAdmissionFeeWarning(true);
        }, 500);
      }
      
      // Check if admission fee is required - just show simple warning (not blocking)
      const needsAdmissionFee = await checkAdmissionFeeRequired(studentId, transformedEnrollments, fetchedPayments);
      if (needsAdmissionFee) {
        // Show simple warning modal (non-blocking)
        // User can collect admission fee through Quick Enrollment modal
      }
      
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

  // Beep sound function (same as in BarcodeScanner)
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      o.start();
      o.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!scanValue) return;
    const value = scanValue.trim();
    setScanValue('');
    if (isLocked) return;
    playBeep(); // Play beep sound when searching for student
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
    // Calculate total outstanding balance based on monthly recurring payments
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    const totalOutstanding = enrollments.reduce((total, enr) => {
      const monthly = Number(enr.monthlyFee || enr.fee || 0);
      const discountPrice = Number(enr.revisionDiscountPrice || 0);
      const isRevisionClass = enr.courseType === 'revision';
      
      // Calculate final monthly fee after discount
      const finalMonthlyFee = isRevisionClass && discountPrice > 0 ? monthly - discountPrice : monthly;
      
      // Check if this class has MONTHLY payment for current month (EXCLUDE admission fee)
      const hasPaymentThisMonth = (payments || []).some(p => {
        const paymentDate = p.payment_date || p.date;
        const paymentClassId = p.class_id || p.classId;
        const paymentMonth = paymentDate ? paymentDate.slice(0, 7) : null;
        const paymentType = p.payment_type || p.paymentType || 'class_payment';
        
        // CRITICAL: Only count CLASS payments, NOT admission fee payments
        return paymentMonth === currentMonth && 
               Number(paymentClassId) === Number(enr.classId || enr.class_id) &&
               (p.status === 'paid' || p.status === 'completed') &&
               paymentType !== 'admission_fee'; // EXCLUDE admission fee
      });
      
      // For monthly recurring: outstanding = monthly fee if not paid this month, else 0
        // Exclude monthly fee from outstanding if free card is valid
        const today = new Date();
        const isFullCardValid = enr.card_type === 'full' && enr.card_valid_from && enr.card_valid_to &&
          new Date(enr.card_valid_from) <= today && new Date(enr.card_valid_to) >= today;
        const outstanding = (hasPaymentThisMonth || isFullCardValid) ? 0 : finalMonthlyFee;
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
                    
                    {/* Admission Fee Status Badge */}
                    {admissionFeeStatus === 'paid' && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-300 rounded-full text-xs font-semibold text-green-700">
                        <span>✓</span>
                        <span>Admission Fee Paid</span>
                      </div>
                    )}
                    {admissionFeeStatus === 'not_paid' && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 border border-yellow-400 rounded-full text-xs font-semibold text-yellow-800">
                        <span>⚠️</span>
                        <span>Admission Fee Required for Physical/Hybrid Classes</span>
                      </div>
                    )}
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
              
              {/* Quick Filter & Search - Always show if student has classes */}
              {enrollments && enrollments.length > 0 && (
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
                    let finalMonthlyFee = isRevisionClass && discountPrice > 0 ? monthly - discountPrice : monthly;
                    
                    // Apply card discount
                    const cardType = enr.card_type || 'none';
                    let originalFee = finalMonthlyFee;
                    if (cardType === 'full') {
                      finalMonthlyFee = 0; // Full free card
                    } else if (cardType === 'half') {
                      finalMonthlyFee = finalMonthlyFee / 2; // Half free card
                    }
                    
                    // Get paid amount from enrollment for display purposes
                    const paidAmount = Number(enr.paidAmount || 0);
                    
                    // Check if MONTHLY CLASS payment already made this month (EXCLUDE admission fee)
                    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
                    const hasPaymentThisMonth = (payments || []).some(p => {
                      const paymentDate = p.payment_date || p.date;
                      const paymentClassId = p.class_id || p.classId;
                      const paymentMonth = paymentDate ? paymentDate.slice(0, 7) : null;
                      const paymentType = p.payment_type || p.paymentType || 'class_payment';
                      
                      // CRITICAL: Only count CLASS payments, NOT admission fee payments
                      return paymentMonth === currentMonth && 
                             Number(paymentClassId) === Number(enr.classId) &&
                             (p.status === 'paid' || p.status === 'completed') &&
                             paymentType !== 'admission_fee'; // EXCLUDE admission fee
                    });
                    
                    // For monthly recurring payments: outstanding = monthly fee if not paid this month, else 0
                    const outstanding = hasPaymentThisMonth ? 0 : finalMonthlyFee;
                    
                    // Calculate payment dates - Always 1st of the month
                    let nextDueDisplay = 'N/A';
                    let gracePeriodDisplay = '';
                    let finalDueDisplay = '';
                    
                    // Always show next payment date, regardless of outstanding balance
                    // Monthly payments are ongoing, so next payment is always 1st of next month
                    try {
                      const today = new Date();
                      const currentMonthIndex = today.getMonth();
                      const currentYear = today.getFullYear();
                      
                      // Determine next payment date based on whether this month is paid
                      let nextPaymentDate;
                      if (hasPaymentThisMonth || outstanding <= 0) {
                        // Already paid this month - next payment is 1st of next month
                        nextPaymentDate = new Date(currentYear, currentMonthIndex + 1, 1);
                      } else {
                        // Not paid yet - payment due this month
                        if (today.getDate() > 1) {
                          // Past the 1st but not paid - next payment is 1st of next month
                          nextPaymentDate = new Date(currentYear, currentMonthIndex + 1, 1);
                        } else {
                          // It's the 1st today - payment due today
                          nextPaymentDate = new Date(currentYear, currentMonthIndex, 1);
                        }
                      }
                      
                      // Get grace period days from class payment tracking (default 7 days)
                      const gracePeriodDays = enr.paymentTrackingFreeDays || 7;
                      
                      // Final due date is payment date + grace period
                      const finalDueDate = new Date(nextPaymentDate);
                      finalDueDate.setDate(finalDueDate.getDate() + gracePeriodDays);
                      
                      // Calculate days until next payment date
                      const diffTime = nextPaymentDate - today;
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      // Calculate days until final due date
                      const finalDiffTime = finalDueDate - today;
                      const finalDiffDays = Math.ceil(finalDiffTime / (1000 * 60 * 60 * 24));
                      
                      // Format next payment date
                      nextDueDisplay = nextPaymentDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      });
                      
                      if (diffDays > 0) {
                        nextDueDisplay += ` (${diffDays} days)`;
                      } else if (diffDays === 0) {
                        nextDueDisplay += ' (Today)';
                      } else {
                        nextDueDisplay += ` (${Math.abs(diffDays)} days ago)`;
                      }
                      
                      // Grace period display
                      gracePeriodDisplay = `${gracePeriodDays} days grace period`;
                      
                      // Format final due date
                      finalDueDisplay = finalDueDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      });
                      
                      if (finalDiffDays > 0) {
                        finalDueDisplay += ` (${finalDiffDays} days)`;
                      } else if (finalDiffDays === 0) {
                        finalDueDisplay += ' (Today - Final Day!)';
                      } else {
                        finalDueDisplay += ` (${Math.abs(finalDiffDays)} days OVERDUE!)`;
                      }
                      
                    } catch (e) {
                      console.error('Error calculating payment dates:', e);
                      nextDueDisplay = 'Error calculating date';
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
                                  
                                  {/* Card Type Tags */}
                                    {(() => {
                                      const today = new Date();
                                      const isFullCardValid = enr.card_type === 'full' && enr.card_valid_from && enr.card_valid_to &&
                                        new Date(enr.card_valid_from) <= today && new Date(enr.card_valid_to) >= today;
                                      const isHalfCardValid = enr.card_type === 'half' && enr.card_valid_from && enr.card_valid_to &&
                                        new Date(enr.card_valid_from) <= today && new Date(enr.card_valid_to) >= today;
                                      if (isFullCardValid) {
                                        return (
                                          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white font-semibold animate-pulse">
                                            🆓 Free Card
                                          </span>
                                        );
                                      } else if (isHalfCardValid) {
                                        return (
                                          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-semibold">
                                            🎟️ Half Card
                                          </span>
                                        );
                                      } else {
                                        return null;
                                      }
                                    })()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-slate-600">Monthly Fee</div>
                                {cardType === 'full' ? (
                                  <div>
                                    <div className="text-sm text-slate-400 line-through">
                                      LKR {originalFee.toLocaleString()}
                                    </div>
                                    <div className="text-lg font-bold text-emerald-600">
                                      FREE
                                      <span className="ml-2 text-xs text-emerald-600 font-normal">
                                        (100% off)
                                      </span>
                                    </div>
                                  </div>
                                ) : cardType === 'half' ? (
                                  <div>
                                    <div className="text-sm text-slate-400 line-through">
                                      LKR {originalFee.toLocaleString()}
                                    </div>
                                    <div className="text-lg font-bold text-blue-600">
                                      LKR {finalMonthlyFee.toLocaleString()}
                                      <span className="ml-2 text-xs text-blue-600 font-normal">
                                        (50% off)
                                      </span>
                                    </div>
                                  </div>
                                ) : isRevisionClass && discountPrice > 0 ? (
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
                            <div className="flex flex-col gap-2 text-sm">
                              <div className={`flex items-center gap-1 ${outstanding > 0 ? 'text-slate-600' : 'text-green-600'}`}>
                                <FaClock className="text-xs" />
                                <span className="font-semibold">Next Payment Due:</span> <span className="font-medium">{nextDueDisplay}</span>
                              </div>
                              
                              {gracePeriodDisplay && (
                                <div className="flex items-center gap-1 text-blue-600 text-xs">
                                  <FaClock className="text-xs" />
                                  <span className="font-semibold">Grace Period:</span> <span className="font-medium">{gracePeriodDisplay}</span>
                                </div>
                              )}
                              
                              {finalDueDisplay && (
                                <div className={`flex items-center gap-1 ${
                                  finalDueDisplay.includes('OVERDUE') ? 'text-red-600' : 
                                  finalDueDisplay.includes('Final Day') ? 'text-orange-600' : 
                                  'text-purple-600'
                                } text-xs font-semibold`}>
                                  <FaExclamationTriangle className="text-xs" />
                                  <span>Final Due Date:</span> <span className="font-bold">{finalDueDisplay}</span>
                                </div>
                              )}
                              
                              {outstanding > 0 ? (
                                <div className="flex items-center gap-1 text-orange-600">
                                  <FaExclamationTriangle className="text-xs" />
                                  Outstanding: <span className="font-bold">LKR {outstanding.toLocaleString()}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-green-600">
                                  <FaCheckCircle className="text-xs" />
                                  Paid: <span className="font-bold">
                                    {(() => {
                                      const today = new Date();
                                      const isFullCardValid = cardType === 'full' && 
                                        enr.card_valid_from && enr.card_valid_to && 
                                        new Date(enr.card_valid_from) <= today && 
                                        new Date(enr.card_valid_to) >= today;
                                      const isHalfCardValid = cardType === 'half' && 
                                        enr.card_valid_from && enr.card_valid_to && 
                                        new Date(enr.card_valid_from) <= today && 
                                        new Date(enr.card_valid_to) >= today;
                                      
                                      if (isFullCardValid) {
                                        return 'LKR 0 (Free Card)';
                                      } else if (isHalfCardValid) {
                                        return `LKR ${paidAmount.toLocaleString()} (Half Card)`;
                                      } else {
                                        return `LKR ${paidAmount.toLocaleString()}`;
                                      }
                                    })()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                            {(() => {
                              // Check if free card is currently valid FIRST (highest priority)
                              const today = new Date();
                              const isCardValid = cardType === 'full' && 
                                enr.card_valid_from && 
                                enr.card_valid_to && 
                                new Date(enr.card_valid_from) <= today && 
                                new Date(enr.card_valid_to) >= today;
                              // Disable Late Pay button ONLY for valid free card (not half card)
                              const latePayDisabled = cardType === 'full' && enr.card_valid_from && enr.card_valid_to &&
                                new Date(enr.card_valid_from) <= today && new Date(enr.card_valid_to) >= today;
                              // Check free card BEFORE payment status
                              if (isCardValid) {
                                return (
                                  <div className="relative group flex-1">
                                    <button
                                      disabled
                                      className="w-full bg-gray-300 text-gray-500 px-4 py-2 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                      <FaLock className="text-lg" />
                                      <span>Pay Now</span>
                                    </button>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                      🆓 Free Card Active - No payment required
                                      <div className="text-xs mt-1">Valid until: {new Date(enr.card_valid_to).toLocaleDateString()}</div>
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </div>
                                );
                              } else if (hasPaymentThisMonth) {
                              return (
                                <div className="flex-1 bg-green-50 border-2 border-green-300 text-green-700 px-4 py-2 rounded-lg font-semibold text-center flex items-center justify-center gap-2">
                                  <FaCheckCircle className="text-lg" />
                                  <span>Already Paid This Month</span>
                                </div>
                              );
                            } else {
                              return (
                            <button
                              className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                              onClick={async () => {
                                // CRITICAL: Check if this class requires physical attendance and admission fee is required
                                const deliveryMethod = enr.delivery_method || enr.deliveryMethod || '';
                                const needsPhysicalAttendance = requiresPhysicalAttendance(deliveryMethod);
                                
                                if (needsPhysicalAttendance) {
                                  const needsAdmissionFee = await checkAdmissionFeeRequired(
                                    student.studentId || student.id,
                                    enrollments,
                                    payments
                                  );
                                  
                                  if (needsAdmissionFee) {
                                    showToast('⚠️ Admission fee must be collected first before class payment!', 'error');
                                    // Note: User should collect admission fee through Quick Enrollment modal
                                    return; // BLOCK payment
                                  }
                                }
                                
                                // Proceed with payment if admission fee check passed
                                // Direct payment without modal
                                const studentId = student.studentId || student.id;
                                const classId = enr.classId || enr.id;
                                
                                try {
                                  // Calculate final fee with discount and card
                                  const monthlyFee = Number(enr.monthlyFee || enr.fee || 0);
                                  const discountPrice = Number(enr.revisionDiscountPrice || 0);
                                  const isRevisionClass = enr.courseType === 'revision';
                                  let finalFee = isRevisionClass && discountPrice > 0 ? monthlyFee - discountPrice : monthlyFee;
                                  
                                  // Apply card discount ONLY if card is currently valid
                                  const cardType = enr.card_type || 'none';
                                  const today = new Date();
                                  const isCardCurrentlyValid = enr.card_valid_from && enr.card_valid_to &&
                                    new Date(enr.card_valid_from) <= today && 
                                    new Date(enr.card_valid_to) >= today;
                                  
                                  let paymentNotes = '';
                                  if (cardType === 'full' && isCardCurrentlyValid) {
                                    finalFee = 0; // Full free card
                                    paymentNotes = ' (Full Free Card - 100% discount)';
                                  } else if (cardType === 'half' && isCardCurrentlyValid) {
                                    finalFee = finalFee / 2; // Half free card
                                    paymentNotes = ' (Half Free Card - 50% discount)';
                                  } else if (isRevisionClass && discountPrice > 0) {
                                    paymentNotes = ` (${discountPrice} revision discount applied)`;
                                  } else {
                                    paymentNotes = '';
                                  }
                                  
                                  const payload = {
                                    paymentType: 'class_payment',
                                    paymentMethod: 'cash',
                                    channel: 'physical',
                                    studentId: studentId,
                                    classId: classId,
                                    amount: finalFee,
                                    notes: 'Monthly fee payment' + paymentNotes,
                                    cashierId: getUserData()?.userid,
                                    createdBy: getUserData()?.userid
                                  };
                                  
                                  const res = await createPayment(payload);
                                  
                                  if (res?.success) {
                                    // Update enrollment paid_amount in class backend
                                    try {
                                      const enrollmentUpdateRes = await fetch('http://localhost:8087/routes.php/update_enrollment_payment', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          student_id: studentId,
                                          class_id: classId,
                                          payment_amount: finalFee,
                                          payment_status: 'paid'
                                        })
                                      });
                                      const updateResult = await enrollmentUpdateRes.json();
                                      if (!updateResult?.success) {
                                        console.error('Failed to update enrollment:', updateResult);
                                      }
                                    } catch (e) {
                                      console.error('Failed to update enrollment payment:', e);
                                    }
                                    
                                    // Extract transaction ID
                                    const transactionId = res?.transactionId || res?.data?.transactionId || res?.data?.transaction_id;
                                    
                                    // Print receipt automatically
                                    if (transactionId) {
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
                                      
                                      // Print receipt
                                      printPaymentReceipt({
                                        student: student,
                                        classData: enr,
                                        paymentData: receiptData,
                                        cashierName: userData?.name || 'Cashier'
                                      });
                                    }
                                    
                                    // Add delay to ensure database transaction is fully committed
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                    
                                    // Reload student to update enrollment balances and payments
                                    await loadStudentData(studentId);
                                    
                                    // Refresh KPIs from backend
                                    await loadCashierKPIs();
                                    
                                    // Show success toast notification
                                    showToast(`Payment successful! LKR ${finalFee.toLocaleString()} paid for ${enr.className || enr.subject}`, 'success');
                                  } else {
                                    showToast(res?.message || 'Payment failed', 'error');
                                  }
                                } catch (e) {
                                  showToast(e?.message || 'Payment failed', 'error');
                                }
                              }}
                            >
                              ⚡ Pay Now
                            </button>
                              );
                            }
                          })()}
                          {/* Late Note button - Disabled when already paid with tooltip */}
                          <div className="relative group">
                            <button
                              disabled={hasPaymentThisMonth || (cardType === 'full' && enr.card_valid_from && enr.card_valid_to && new Date(enr.card_valid_from) <= new Date() && new Date(enr.card_valid_to) >= new Date())}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                hasPaymentThisMonth || (cardType === 'full' && enr.card_valid_from && enr.card_valid_to && new Date(enr.card_valid_from) <= new Date() && new Date(enr.card_valid_to) >= new Date())
                                  ? 'bg-orange-300 text-orange-100 cursor-not-allowed opacity-50'
                                  : 'bg-orange-600 text-white hover:bg-orange-700'
                              }`}
                              onClick={() => {
                                if (hasPaymentThisMonth || (cardType === 'full' && enr.card_valid_from && enr.card_valid_to && new Date(enr.card_valid_from) <= new Date() && new Date(enr.card_valid_to) >= new Date())) return;
                                try {
                                  printNote({ title: 'Late Payment Permission', student, classRow: enr, reason: 'Allowed late payment for today only' });
                                  // Refresh KPIs from backend
                                  loadCashierKPIs();
                                  // Scroll back to student panel after generating note
                                  setTimeout(() => {
                                    studentPanelRef.current?.scrollIntoView({ 
                                      behavior: 'smooth', 
                                      block: 'start' 
                                    });
                                  }, 300);
                                } catch (e) { 
                                  console.error('Error printing late note:', e);
                                  alert('Failed to generate late note'); 
                                }
                              }}
                            >
                              Late Pay
                            </button>
                            {/* Tooltip - Shows when button is disabled */}
                            {hasPaymentThisMonth && (
                              <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
                                ℹ️ Late Pay not needed - Payment already done this month
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                              </div>
                            )}
                          </div>
                          <button
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            onClick={() => {
                              try {
                                printNote({ title: 'Entry Permit - Forgot Card', student, classRow: enr, reason: 'Permit to enter without ID for this session - Valid for all classes today' });
                                // Scroll back to student panel after generating note
                                setTimeout(() => {
                                  studentPanelRef.current?.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start' 
                                  });
                                }, 300);
                              } catch (e) { 
                                console.error('Error printing entry permit:', e);
                                alert('Failed to generate entry permit'); 
                              }
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
                {recentPayments.map((p, idx) => {
                  const paymentType = p.payment_type || p.paymentType || 'class_payment';
                  const isAdmissionFee = paymentType === 'admission_fee';
                  const className = p.class_name || p.className || '';
                  
                  // Display label: Show payment type clearly
                  let displayLabel = '';
                  if (isAdmissionFee) {
                    displayLabel = className ? `Admission Fee (${className})` : 'Admission Fee';
                  } else {
                    displayLabel = className || p.description || 'Class Payment';
                  }
                  
                  return (
                    <div 
                      key={idx} 
                      className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700 truncate flex-1 mr-2">
                          {displayLabel}
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
                  );
                })}
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
  }, [student, loading, error, enrollments, payments, classSearchTerm, selectedClassFilter, handleSearchChange, handleClearSearch, handleFilterChange, admissionFeeStatus]);

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
    <div className="min-h-screen bg-slate-100 relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎓</span>
              <div>
                <h1 className="text-xl font-bold">TCMS</h1>
                <div className="text-sm text-slate-300">Cashier Dashboard - {user?.name || 'Cashier'}</div>
              </div>
            </div>
            {isLocked && (
              <div className="bg-orange-600 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2 animate-pulse">
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

      {/* Main Content Area with Blur Effect when Locked */}
      <div className={`transition-all duration-300 ${isLocked ? 'blur-sm pointer-events-none select-none' : ''}`}>
        {activeTab === 'register' ? (
          <div className="p-4">
            <PhysicalStudentRegisterTab 
              onAdmissionFeePaid={(amount) => {
                // Refresh KPIs from backend after admission fee is collected
                loadCashierKPIs();
              }}
            />
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
                        onClick={() => {
                          playBeep(); // Play beep sound when recent student is clicked
                          loadStudentData(recent.studentId);
                        }}
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
                  <button 
                    onClick={async () => {
                      // Open summary modal immediately (uses existing kpis)
                      setDayEndMode('summary');
                      setShowDayEndReport(true);
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaFileInvoice />
                    Summary Day End Report
                  </button>
                  <button 
                    onClick={async () => {
                      // Open full report - fetch transactions for today then open modal
                      try {
                        setDayEndMode('full');
                        setDayEndLoading(true);
                        const cashierId = user?.userid || 'unknown';
                        const res = await getCashierStats(cashierId, 'today');
                        const transactions = res?.data?.transactions || [];
                        const perClass = res?.data?.perClass || [];
                        setDayEndTransactions(transactions);
                        setDayEndPerClass(perClass);
                        setShowDayEndReport(true);
                      } catch (e) {
                        console.error('Failed to load day-end transactions:', e);
                        alert('Failed to load full day end report data');
                      } finally {
                        setDayEndLoading(false);
                      }
                    }}
                    disabled={dayEndLoading}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${dayEndLoading ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                  >
                    <FaFileInvoice />
                    {dayEndLoading ? 'Loading Full Report...' : 'Full Day End Report'}
                  </button>
                  <button 
                    onClick={() => setShowMonthEndReport(true)}
                    className="w-full bg-indigo-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaFileInvoice />
                    Month End Report
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
              
              {/* Attendance Calendar Panel (Below Payment History) */}
              {student && !loading && (
                <div className="mt-4" onClick={(e) => {
                  // When calendar panel is clicked, scroll it into view
                  e.currentTarget.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest',
                    inline: 'nearest'
                  });
                }}>
                  {attendanceLoading ? (
                    <div className="bg-white rounded-md shadow-sm border-2 border-slate-200 p-6">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                        <span className="text-slate-600">Loading attendance data...</span>
                      </div>
                    </div>
                  ) : (
                    <AttendanceCalendar attendanceData={attendanceData} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
      {/* End of Blur Wrapper */}

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
              // Add delay to ensure database transaction is fully committed
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Reload student to update enrollment balances and payments
              await loadStudentData(student.studentId || student.id);
              
              // Refresh KPIs from backend
              await loadCashierKPIs();
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
          studentPayments={payments}
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
              // Add delay to ensure database transaction is fully committed
              if (enrollmentData.paid && enrollmentData.amount > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              
              // Reload student to get updated enrollments AND payments
              await loadStudentData(student.studentId || student.id);
              
              // Refresh KPIs from backend
              await loadCashierKPIs();
              
              // Show success message with payment details
              const successMsg = enrollmentData.message || '✅ Student enrolled successfully!';
              alert(successMsg);
              
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

      {/* Admission Fee Warning Modal */}
      {showAdmissionFeeWarning && (
        <AdmissionFeeWarningModal
          onClose={() => {
            setShowAdmissionFeeWarning(false);
            // Scroll to Student Information + Cashier Tools area and keep it there
            setTimeout(() => {
              if (mainContentRef.current) {
                // Scroll to top of the main content area
                const elementPosition = mainContentRef.current.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - 80; // 80px offset for header
                
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
                
                // Brief highlight effect to show focus
                mainContentRef.current.style.transition = 'box-shadow 0.3s ease';
                mainContentRef.current.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.3)';
                setTimeout(() => {
                  if (mainContentRef.current) {
                    mainContentRef.current.style.boxShadow = '';
                  }
                }, 800);
              }
            }, 150);
            // Focus back to scan input but DON'T scroll
            setTimeout(() => {
              if (scanInputRef.current) {
                scanInputRef.current.focus({ preventScroll: true });
              }
            }, 200);
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

      {/* Day End Report Modal */}
      {showDayEndReport && (
        <DayEndReportModal
          kpis={kpis}
          recentStudents={recentStudents}
          openingTime={openingTime}
          mode={dayEndMode}
          transactions={dayEndTransactions}
          perClass={dayEndPerClass}
          onClose={() => {
            setShowDayEndReport(false);
            focusBackToScan();
          }}
        />
      )}

      {/* Month End Report Modal */}
      {showMonthEndReport && (
        <MonthEndReportModal
          kpis={kpis}
          onClose={() => {
            setShowMonthEndReport(false);
            focusBackToScan();
          }}
        />
      )}

      {/* Unlock Modal */}
      {showUnlockModal && isLocked && (
        <UnlockModal
          cashierName={user?.name}
          onClose={() => setShowUnlockModal(false)}
          onUnlock={handleUnlock}
        />
      )}
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[9999] animate-slide-in-top ${
          toast.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
          toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 
          'bg-gradient-to-r from-blue-500 to-blue-600'
        } text-white px-6 py-4 rounded-lg shadow-2xl min-w-[320px] max-w-md`}>
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-lg">{toast.type === 'success' ? 'Success!' : toast.type === 'error' ? 'Error!' : 'Info'}</div>
              <div className="text-sm opacity-95">{toast.message}</div>
            </div>
            <button 
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


