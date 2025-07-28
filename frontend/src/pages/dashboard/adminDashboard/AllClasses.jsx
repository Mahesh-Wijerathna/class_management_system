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

const AllClasses = () => {
  const navigate = useNavigate();
  const classList = getClassList();
  const enrollments = getEnrollments();

  // Calculate total students for each class
  const classesWithStudentCount = classList.map(cls => {
    const totalStudents = enrollments.filter(e => e.classId === cls.id).length;
    return {
      ...cls,
      totalStudents,
    };
  });

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">All Classes</h1>
        <BasicTable
          columns={[
            { key: 'className', label: 'Class Name' },
            { key: 'subject', label: 'Subject' },
            { key: 'teacher', label: 'Teacher' },
            { key: 'stream', label: 'Stream' },
            { key: 'deliveryMethod', label: 'Delivery' },
            { key: 'fee', label: 'Fee', render: row => {
                let fee = Number(row.fee) || 0;
                if (row.courseType === 'revision' && row.revisionDiscountPrice) {
                  const discounted = Math.max(0, fee - Number(row.revisionDiscountPrice));
                  return `Rs. ${fee} (Theory student: Rs. ${discounted})`;
                }
                return `Rs. ${fee}`;
              }
            },
            { key: 'courseType', label: 'Course Type' },
            { key: 'status', label: 'Status', render: row => {
                if (row.status === 'active') return <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-semibold">Active</span>;
                if (row.status === 'inactive') return <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-semibold">Inactive</span>;
                if (row.status === 'archived') return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-semibold">Archived</span>;
                return row.status;
              } },
            { key: 'totalStudents', label: 'Total Students' },
            { key: 'actions', label: 'Actions', render: row => (
                <CustomButton
                  onClick={() => navigate(`/admin/classes/all/${row.id}`, { state: { className: row.className } })}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View Students
                </CustomButton>
              ) },
          ]}
          data={classesWithStudentCount}
        />
      </div>
    </DashboardLayout>
  );
};

export default AllClasses;
