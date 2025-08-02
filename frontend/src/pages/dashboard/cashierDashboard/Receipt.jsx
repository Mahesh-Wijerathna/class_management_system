import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import cashierSidebarSections from './CashierDashboardSidebar';
import BasicCard from '../../../components/BasicCard';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LuDownload, 
  LuPrinter,
  LuShare2,
  LuReceipt,
  LuUser,
  LuCalendar,
  LuDollarSign,
  LuCreditCard,
  LuCircleCheck,
  LuArrowLeft,
  LuFileText,
  LuCopy,
  LuMail
} from 'react-icons/lu';

const Receipt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get receipt data from location state or generate mock data
    if (location.state?.payment) {
      setReceiptData(generateReceiptFromPayment(location.state.payment));
    } else {
      // Generate mock receipt data
      setReceiptData(generateMockReceipt());
    }
    setLoading(false);
  }, [location.state]);

  const generateReceiptFromPayment = (payment) => {
    return {
      receiptNumber: payment.receiptNumber || `RCP${Date.now()}`,
      date: payment.date || new Date().toISOString().split('T')[0],
      time: payment.time || new Date().toLocaleTimeString(),
      studentName: payment.studentName,
      studentId: payment.studentId,
      amount: payment.amount,
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod,
      description: payment.description,
      cashierName: payment.cashierName || 'Current Cashier',
      status: payment.status || 'completed',
      transactionId: payment.id || Date.now()
    };
  };

  const generateMockReceipt = () => {
    return {
      receiptNumber: 'RCP1703123456789',
      date: '2024-01-15',
      time: '14:30:25',
      studentName: 'John Doe',
      studentId: 'STU001',
      amount: 500,
      paymentType: 'class_payment',
      paymentMethod: 'cash',
      description: 'Class 10A monthly fee for January 2024',
      cashierName: 'Sarah Wilson',
      status: 'completed',
      transactionId: 12345
    };
  };

  const getPaymentTypeLabel = (type) => {
    const types = {
      'class_payment': 'Class Payment',
      'study_pack': 'Study Pack',
      'registration_fee': 'Registration Fee',
      'late_fee': 'Late Fee',
      'exam_fee': 'Exam Fee',
      'material_fee': 'Material Fee',
      'other': 'Other'
    };
    return types[type] || type;
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      'cash': 'Cash',
      'card': 'Card',
      'bank_transfer': 'Bank Transfer',
      'check': 'Check',
      'online': 'Online Payment',
      'mobile_money': 'Mobile Money'
    };
    return methods[method] || method;
  };

  const printReceipt = () => {
    window.print();
  };

  const downloadReceipt = () => {
    // In a real implementation, this would generate and download a PDF
    alert('Receipt download functionality would be implemented here');
  };

  const shareReceipt = () => {
    // In a real implementation, this would share the receipt via email or other methods
    alert('Receipt sharing functionality would be implemented here');
  };

  const copyReceiptNumber = () => {
    navigator.clipboard.writeText(receiptData.receiptNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmailReceipt = () => {
    // In a real implementation, this would send the receipt via email
    alert('Email receipt functionality would be implemented here');
  };

  if (loading) {
    return (
      <DashboardLayout
        userRole="Cashier"
        sidebarItems={cashierSidebarSections}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading receipt...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!receiptData) {
    return (
      <DashboardLayout
        userRole="Cashier"
        sidebarItems={cashierSidebarSections}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-lg text-gray-600 mb-4">No receipt data found</div>
            <button
              onClick={() => navigate('/cashier/process-payment')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Process New Payment
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userRole="Cashier"
      sidebarItems={cashierSidebarSections}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/cashier/payment-history')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <LuArrowLeft className="h-4 w-4" />
              <span>Back to Payment History</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={printReceipt}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LuPrinter className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button
              onClick={downloadReceipt}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <LuDownload className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Receipt */}
        <div className="max-w-2xl mx-auto">
          <BasicCard className="print:shadow-none print:border-none">
            {/* Receipt Header */}
            <div className="text-center border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <LuReceipt className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">PAYMENT RECEIPT</h1>
              </div>
              <p className="text-gray-600">Class Management System</p>
              <p className="text-sm text-gray-500">Official Payment Confirmation</p>
            </div>

            {/* Receipt Number and Status */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-600">Receipt Number</p>
                <div className="flex items-center space-x-2">
                  <p className="font-mono text-lg font-bold text-blue-600">{receiptData.receiptNumber}</p>
                  <button
                    onClick={copyReceiptNumber}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy receipt number"
                  >
                    <LuCopy className="h-4 w-4" />
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <LuCircleCheck className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600 uppercase">
                    {receiptData.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Transaction ID: {receiptData.transactionId}</p>
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <LuUser className="h-5 w-5 text-blue-600" />
                  <span>Student Information</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Student Name</p>
                    <p className="font-medium text-gray-900">{receiptData.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Student ID</p>
                    <p className="font-mono text-gray-900">{receiptData.studentId}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <LuCalendar className="h-5 w-5 text-green-600" />
                  <span>Payment Details</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(receiptData.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium text-gray-900">{receiptData.time}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <LuDollarSign className="h-5 w-5 text-green-600" />
                <span>Payment Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Payment Type</p>
                    <p className="font-medium text-gray-900">{getPaymentTypeLabel(receiptData.paymentType)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium text-gray-900">{getPaymentMethodLabel(receiptData.paymentMethod)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-2xl font-bold text-green-600">Rs. {receiptData.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Processed By</p>
                    <p className="font-medium text-gray-900">{receiptData.cashierName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {receiptData.description && (
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <LuFileText className="h-5 w-5 text-purple-600" />
                  <span>Description</span>
                </h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {receiptData.description}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Thank you for your payment. This receipt serves as proof of payment.
                </p>
                <p className="text-xs text-gray-500">
                  Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <span>Keep this receipt for your records</span>
                  <span>•</span>
                  <span>Valid for accounting purposes</span>
                </div>
              </div>
            </div>
          </BasicCard>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4 mt-6 print:hidden">
            <button
              onClick={() => navigate('/cashier/process-payment')}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LuReceipt className="h-4 w-4" />
              <span>Process New Payment</span>
            </button>
            
            <button
              onClick={sendEmailReceipt}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <LuMail className="h-4 w-4" />
              <span>Email Receipt</span>
            </button>
            
            <button
              onClick={shareReceipt}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <LuShare2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Additional Information */}
          <div className="mt-8 print:hidden">
            <BasicCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Receipt Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Receipt Number:</p>
                  <p className="font-mono text-gray-900">{receiptData.receiptNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Transaction ID:</p>
                  <p className="font-mono text-gray-900">{receiptData.transactionId}</p>
                </div>
                <div>
                  <p className="text-gray-600">Date & Time:</p>
                  <p className="text-gray-900">
                    {new Date(receiptData.date).toLocaleDateString()} at {receiptData.time}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Status:</p>
                  <p className="text-gray-900 capitalize">{receiptData.status}</p>
                </div>
              </div>
            </BasicCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Receipt; 