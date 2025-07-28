import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import CustomButton from '../../../components/CustomButton';

// Dummy payment data for demonstration (with time and category)
const dummyClassList = [
  {
    id: 'class1',
    className: 'Advanced Mathematics',
  },
  {
    id: 'class2',
    className: 'Physics Fundamentals',
  },
  {
    id: 'class3',
    className: '2025 Theory [I]',
  },
];

const paymentData = {
  class1: [
    {
      id: 'inv001',
      student: 'Vishwa Senadhi',
      method: 'Online',
      status: 'Paid',
      amount: 4000,
      date: '2025-07-01',
      time: '09:10',
      invoiceId: 'INV-001',
      category: 'Tuition Fee',
    },
    {
      id: 'inv002',
      student: 'Shashini Devindi',
      method: 'Bank Transfer',
      status: 'Pending',
      amount: 4000,
      date: '2025-07-01',
      time: '10:15',
      invoiceId: 'INV-002',
      category: 'Revision Fee',
    },
    {
      id: 'inv003',
      student: 'Tharushika Hansamali',
      method: 'Physical',
      status: 'Paid',
      amount: 4000,
      date: '2025-07-01',
      time: '11:00',
      invoiceId: 'INV-003',
      category: 'Exam Fee',
    },
  ],
  class2: [
    {
      id: 'inv004',
      student: 'Nimesha Nimandi',
      method: 'Online',
      status: 'Paid',
      amount: 3500,
      date: '2025-07-01',
      time: '09:30',
      invoiceId: 'INV-004',
      category: 'Tuition Fee',
    },
  ],
  class3: [
    {
      id: 'inv005',
      student: 'Ashidhi Nethma',
      method: 'Physical',
      status: 'Paid',
      amount: 3500,
      date: '2025-07-01',
      time: '08:45',
      invoiceId: 'INV-005',
      category: 'Tuition Fee',
    },
  ],
};

const paymentStatusColor = {
  Paid: 'text-green-700 font-bold',
  Pending: 'text-yellow-700 font-bold',
  Failed: 'text-red-700 font-bold',
};

const StudentClassPayments = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const payments = paymentData[classId] || [];

  // Prefer className from route state, fallback to localStorage/dummy
  let className = location.state && location.state.className;
  if (!className) {
    try {
      const stored = localStorage.getItem('classes');
      if (stored) {
        const classes = JSON.parse(stored);
        const found = classes.find(c => c.id === classId);
        if (found && found.className) className = found.className;
      }
    } catch {}
    if (!className) {
      const dummy = dummyClassList.find(c => c.id === classId);
      if (dummy && dummy.className) className = dummy.className;
    }
  }

  // Payment summary
  const paidCount = payments.filter(p => p.status === 'Paid').length;
  const pendingCount = payments.filter(p => p.status === 'Pending').length;
  const failedCount = payments.filter(p => p.status === 'Failed').length;
  const total = payments.length;
  const paidPercent = total ? ((paidCount / total) * 100).toFixed(1) : 0;
  const pendingPercent = total ? ((pendingCount / total) * 100).toFixed(1) : 0;
  const failedPercent = total ? ((failedCount / total) * 100).toFixed(1) : 0;
  const totalReceived = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.amount || 0), 0);

  // Payment status filter
  const [statusFilter, setStatusFilter] = useState('');
  const filteredPayments = statusFilter ? payments.filter(p => p.status === statusFilter) : payments;

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left summary/details panel */}
        <div className="md:w-1/4 w-full bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-2">{className}</h2>
          <div className="mb-2 text-gray-700">Total Received: <span className="font-semibold text-green-700">LKR {totalReceived.toLocaleString()} </span></div>
          <div className="mb-4">
            <div className="font-semibold mb-1">Summary</div>
            <div className="text-sm mb-1">Paid: <span className="text-green-700 font-bold">{paidCount}</span> ({paidPercent}%)</div>
            <div className="text-sm mb-1">Pending: <span className="text-yellow-700 font-bold">{pendingCount}</span> ({pendingPercent}%)</div>
            <div className="text-sm mb-1">Failed: <span className="text-red-700 font-bold">{failedCount}</span> ({failedPercent}%)</div>
            <div className="text-sm mt-2">Total: <span className="font-bold">{total}</span></div>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="font-semibold">Filter by Status</div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border rounded px-2 py-1 mt-1 w-full"
            >
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          <div className="mt-6">
            <CustomButton onClick={() => navigate('/admin/students-payments')} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 w-full">Back</CustomButton>
          </div>
        </div>
        {/* Right payments table */}
        <div className="md:w-3/4 w-full bg-white rounded-lg shadow p-4">
          <h1 className="text-2xl font-bold mb-4">Payments</h1>
          <BasicTable
            columns={[
              { key: 'invoiceId', label: 'Invoice ID' },
              { key: 'student', label: 'Student' },
              { key: 'method', label: 'Payment Method' },
              { key: 'category', label: 'Category' },
              { key: 'date', label: 'Date' },
              { key: 'time', label: 'Time' },
              { key: 'status', label: 'Status', render: row => (
                  <span className={paymentStatusColor[row.status] || ''}>{row.status}</span>
                ) },
              { key: 'amount', label: 'Amount (LKR)', render: row => (
                  <span className="font-semibold text-green-700">{row.amount.toLocaleString()}</span>
                ) },
            ]}
            data={filteredPayments}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentClassPayments;
