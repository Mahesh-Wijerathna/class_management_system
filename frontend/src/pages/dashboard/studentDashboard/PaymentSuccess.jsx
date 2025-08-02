import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import Receipt from '../../../components/Receipt';
import { FaCheckCircle, FaPrint, FaDownload, FaHome, FaList } from 'react-icons/fa';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showReceipt, setShowReceipt] = useState(false);
  const paymentData = location.state;

  if (!paymentData) {
    return (
      <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
        <div className="p-8 text-center text-gray-500">
          No payment data found. Please complete a payment first.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <FaCheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">
            Your payment has been processed successfully. You can now access your class.
          </p>
        </div>

        {/* Payment Summary Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Transaction Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Transaction ID:</span> {paymentData.transactionId || paymentData.invoiceId}</div>
                <div><span className="font-medium">Date:</span> {paymentData.date}</div>
                <div><span className="font-medium">Payment Method:</span> {paymentData.paymentMethod || 'Online'}</div>
                <div><span className="font-medium">Status:</span> <span className="text-green-600 font-semibold">Paid</span></div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Class Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Class:</span> {paymentData.className}</div>
                <div><span className="font-medium">Subject:</span> {paymentData.subject}</div>
                <div><span className="font-medium">Teacher:</span> {paymentData.teacher}</div>
                <div><span className="font-medium">Amount:</span> LKR {paymentData.amount?.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setShowReceipt(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPrint />
            View Receipt
          </button>
          <button
            onClick={() => navigate('/student/my-classes')}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FaList />
            Go to My Classes
          </button>
          <button
            onClick={() => navigate('/studentdashboard')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FaHome />
            Back to Dashboard
          </button>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">What's Next?</h3>
          <div className="space-y-2 text-blue-800">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Your class has been added to "My Classes" section</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>You can now access class materials and attend sessions</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Check your email for class schedule and zoom links</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Download your receipt for your records</p>
            </div>
          </div>
        </div>

        {/* Receipt Modal */}
        {showReceipt && (
          <Receipt
            paymentData={paymentData}
            onClose={() => setShowReceipt(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentSuccess; 