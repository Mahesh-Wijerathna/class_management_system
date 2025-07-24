import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import BasicTable from '../../../components/BasicTable';

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'classTitle', label: 'Class' },
  { key: 'total', label: 'Amount' },
  { key: 'method', label: 'Method' },
  { key: 'status', label: 'Status' },
  { key: 'invoiceId', label: 'Invoice ID' },
];

const MyPayments = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('payments') || '[]');
    setPayments(data);
  }, []);

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">My Payments</h1>
        {payments.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No payment history found.</div>
        ) : (
          <BasicTable columns={columns} data={payments.map(p => ({
            ...p,
            total: `LKR ${p.total?.toLocaleString()}`,
            method: p.method === 'online' ? 'Online' : 'Bank Transfer',
            status: p.status || (p.method === 'online' ? 'Paid' : 'Pending'),
          }))} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyPayments; 