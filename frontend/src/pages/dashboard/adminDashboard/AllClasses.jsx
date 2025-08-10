import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import CustomButton from '../../../components/CustomButton';
import { getAllClasses } from '../../../api/classes';
import { getClassEnrollments } from '../../../api/enrollments';

const AllClasses = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getAllClasses();
        if (!res?.success || !Array.isArray(res.data)) {
          setRows([]);
          setError(res?.message || 'Failed to load classes');
          return;
        }
        const classes = res.data;
        // Enrich with total students from DB enrollments (fallback to current_students)
        const withCounts = await Promise.all(
          classes.map(async (c) => {
            try {
              const er = await getClassEnrollments(c.id);
              const total = er?.success && Array.isArray(er.data) ? er.data.length : (c.current_students || 0);
              return { ...c, totalStudents: total };
            } catch {
              return { ...c, totalStudents: c.current_students || 0 };
            }
          })
        );
        setRows(withCounts);
      } catch (e) {
        setError('Failed to load classes. Please try again.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3da58a]"></div>
            <span className="ml-2 text-gray-600">Loading classes...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

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
            { key: 'fee', label: 'Fee', render: row => `Rs. ${Number(row.fee || 0)}` },
            { key: 'courseType', label: 'Course Type' },
            { key: 'status', label: 'Status', render: row => (
                row.status === 'active' ? (
                  <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-semibold">Active</span>
                ) : (
                  <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-semibold">Inactive</span>
                )
              ) },
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
          data={rows}
        />
      </div>
    </DashboardLayout>
  );
};

export default AllClasses;


