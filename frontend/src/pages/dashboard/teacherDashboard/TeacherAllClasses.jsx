import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import teacherSidebarSections from './TeacherDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import { getClassesByTeacher } from '../../../api/classes';
import { getUserData } from '../../../api/apiUtils';

const TeacherAllClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch teacher's classes from API
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        // Get teacher data from storage
        const teacherData = getUserData();
        console.log('Teacher data:', teacherData); // Debug log
        
        // Check if we have teacher data with teacherId
        const teacherId = teacherData?.teacherId || teacherData?.id || null;
        
        if (teacherId) {
          const response = await getClassesByTeacher(teacherId);
          if (response.success) {
            setClasses(response.data || []);
          } else {
            setError(response.message || 'Failed to load classes');
          }
        } else {
          setError('Teacher information not found. Please log in again.');
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Failed to load classes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Calculate total students for each class (for now, using current_students from database)
  const classesWithStudentCount = classes.map(cls => ({
    ...cls,
    totalStudents: cls.current_students || 0,
  }));

  if (loading) {
    return (
      <DashboardLayout userRole="Teacher" sidebarItems={teacherSidebarSections}>
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3da58a]"></div>
            <span className="ml-2 text-gray-600">Loading your classes...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="Teacher" sidebarItems={teacherSidebarSections}>
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="Teacher" sidebarItems={teacherSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">My Classes</h1>
        <p className="mb-6 text-gray-700">View all classes assigned to you.</p>
        
        {classes.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <p>No classes found. You don't have any assigned classes yet.</p>
          </div>
        ) : (
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
                  return row.status;
                } },
              { key: 'totalStudents', label: 'Total Students' },
              { key: 'schedule', label: 'Schedule', render: row => {
                  if (row.schedule && row.schedule.day && row.schedule.startTime && row.schedule.endTime) {
                    return `${row.schedule.day} ${row.schedule.startTime} - ${row.schedule.endTime}`;
                  }
                  return 'Not scheduled';
                } },
            ]}
            data={classesWithStudentCount}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherAllClasses; 