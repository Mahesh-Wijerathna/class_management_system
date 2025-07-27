import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import CustomButton from '../../../components/CustomButton';

// Get all classes from localStorage (as in CreateClass.jsx)
const getClassList = () => {
  try {
    const stored = localStorage.getItem('classes');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

// Dummy payment data (same as in StudentClassPayments.jsx)
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
    },
  ],
};

const StudentAllPayments = () => {
  const navigate = useNavigate();



  // Get classes from localStorage
  const classList = getClassList();

  // Calculate total received payment for each class (status: Paid)
  const classPaymentsWithTotal = classList.map(cls => {
    let payments = paymentData[cls.id] || [];
    const totalPayment = payments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    return {
      ...cls,
      totalPayment,
    };
  });

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Student All Payments</h1>
        <BasicTable
          columns={[
            { key: 'className', label: 'Class Name' },
            { key: 'subject', label: 'Subject' },
            { key: 'teacher', label: 'Teacher' },
            { key: 'totalStudents', label: 'Total Students' },
            { key: 'totalPayment', label: 'Total Payment (LKR)', render: row => (
                <span className="font-semibold text-green-700">{row.totalPayment.toLocaleString()}</span>
              ) },
            { key: 'actions', label: 'Actions', render: row => (
                <CustomButton
                  onClick={() => navigate(`/admin/students-payments/${row.id}`, { state: { className: row.className } })}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View Payments
                </CustomButton>
              ) },
          ]}
          data={classPaymentsWithTotal}
        />
      </div>
    </DashboardLayout>
  );
};

export default StudentAllPayments;
