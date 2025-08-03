import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import { getStudentPayments } from '../../../api/payments';
import { getUserData } from '../../../api/apiUtils';

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'userId', label: 'User ID' },
  { key: 'className', label: 'Class' },
  { key: 'amount', label: 'Amount' },
  { key: 'method', label: 'Method' },
  { key: 'status', label: 'Status' },
  { key: 'invoiceId', label: 'Invoice ID' },
];

const MyPayments = ({ onLogout }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get logged-in student data from authentication system
      const userData = getUserData();
      if (!userData || !userData.userid) {
        setError('No logged-in user found. Please login again.');
        setPayments([]);
        return;
      }
      
      const studentId = userData.userid;
      
      const response = await getStudentPayments(studentId);
      
      if (response.success && response.data) {
        // Map the data to ensure all fields are present
        const mappedPayments = response.data.map((p, index) => ({
          date: p.date || '',
          userId: p.user_id || p.userId || p.student_id || studentId || '', // Use user_id from backend
          className: p.class_name || p.className || '',
          amount: `LKR ${parseFloat(p.amount || 0).toLocaleString()}`,
          method: (p.payment_method || p.method || 'Online').charAt(0).toUpperCase() + (p.payment_method || p.method || 'Online').slice(1),
          status: (p.status || 'Paid').charAt(0).toUpperCase() + (p.status || 'Paid').slice(1),
          invoiceId: p.transaction_id || p.invoiceId || p.id || '',
        }));
        
        setPayments(mappedPayments);
      } else {
        setError(response.message || 'Failed to load payments');
        setPayments([]);
      }
    } catch (error) {
      setError(error.message || 'Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Load payments on component mount
  useEffect(() => {
    loadPayments();
  }, []);

  const handleRefresh = () => {
    loadPayments();
  };

  return (
    <DashboardLayout
      userRole="Student"
      sidebarItems={studentSidebarSections}
      onLogout={onLogout}
    >
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">My Payments</h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh Data'}
          </button>
        </div>
        
        {loading ? (
          <div className="text-gray-500 text-center py-12">Loading payments from database...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-12">Error: {error}</div>
        ) : payments.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No payment history found in database.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-0 sm:p-4 my-6">
            <BasicTable columns={columns} data={payments} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyPayments; 