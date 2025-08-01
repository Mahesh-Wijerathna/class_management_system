import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import CustomButton from '../../../components/CustomButton';

// Get all classes from localStorage
const getClassList = () => {
  try {
    const stored = localStorage.getItem('classes');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

// Get all enrollments from localStorage (simulate student enrollments)
const getEnrollments = () => {
  try {
    const stored = localStorage.getItem('enrollments');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
};



const StudentAllPayments = () => {
  const navigate = useNavigate();
  const classList = getClassList();
  const enrollments = getEnrollments();

  const payments = (() => {
    try {
      const stored = localStorage.getItem('payments');
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  })();

  const classPaymentsWithTotal = classList.map(cls => {
    const totalStudents = enrollments.filter(e => e.classId === cls.id).length;
    // Find all payments for this class
    const classPayments = payments.filter(p => p.classId === cls.id);
    const totalPayment = classPayments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    return {
      ...cls,
      totalStudents,
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
            { key: 'courseType', label: 'Course Type' },
            { key: 'totalStudents', label: 'Total Students' },
            { key: 'totalPayment', label: 'Total Payment (LKR)', render: row => (
                <span className="font-semibold text-green-700">{(row.totalPayment ? row.totalPayment : 0).toLocaleString()}</span>
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
          data={classPaymentsWithTotal.map(cls => ({
            id: cls.id,
            className: cls.className || '',
            subject: cls.subject || '',
            teacher: cls.teacher || '',
            courseType: cls.courseType || '',
            totalStudents: cls.totalStudents || 0,
            totalPayment: cls.totalPayment || 0,
          }))}
        />
      </div>
    </DashboardLayout>
  );
};

export default StudentAllPayments;
