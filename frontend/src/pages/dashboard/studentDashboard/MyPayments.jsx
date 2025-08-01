import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import BasicTable from '../../../components/BasicTable';

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'className', label: 'Class' },
  { key: 'amount', label: 'Amount' },
  { key: 'method', label: 'Method' },
  { key: 'status', label: 'Status' },
  { key: 'invoiceId', label: 'Invoice ID' },
];

const MyPayments = ({ onLogout }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('payments') || '[]');
    setPayments(data);
  }, []);

  return (
    <DashboardLayout
      userRole="Student"
      sidebarItems={studentSidebarSections}
      onLogout={onLogout}
    >
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">My Payments</h1>
        {payments.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No payment history found.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-0 sm:p-4 my-6">
            <BasicTable columns={columns} data={payments.map(p => ({
              date: p.date || '',
              className: p.className || '',
              amount: `LKR ${(p.amount || p.total || 0).toLocaleString()}`,
              method: p.method || 'Online',
              status: p.status || 'Paid',
              invoiceId: p.invoiceId || p.id || '',
            }))} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyPayments; 