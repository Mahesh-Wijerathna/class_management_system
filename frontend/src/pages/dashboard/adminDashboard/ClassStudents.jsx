import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import CustomButton from '../../../components/CustomButton';
import { getClassEnrollments } from '../../../api/enrollments';

// Get all enrollments from localStorage
const getEnrollments = () => {
  try {
    const stored = localStorage.getItem('enrollments');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

// Get all students from localStorage (simulate student data)
const getStudents = () => {
  try {
    const stored = localStorage.getItem('students');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

const ClassStudents = () => {
  const { classId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const className = location.state && location.state.className ? location.state.className : '';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getClassEnrollments(classId);
        if (res?.success && Array.isArray(res.data)) {
          const list = res.data.map(s => ({
            id: s.student_id || s.id,
            firstname: s.first_name || s.firstname || s.name || '',
            lastname: s.last_name || s.lastname || '',
            email: s.email || '-',
            phone: s.phone || '-',
            school: s.school || '-',
            dateJoined: s.date_joined || s.enrollment_date || '-'
          }));
          setRows(list);
        } else {
          // Fallback to local storage
          const enrollments = getEnrollments();
          const students = getStudents();
          const enrolledStudentIds = enrollments.filter(e => String(e.classId) === String(classId)).map(e => e.studentId);
          const enrolledStudents = students.filter(s => enrolledStudentIds.includes(s.id));
          setRows(enrolledStudents);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classId]);

  // Get class details from localStorage
  let classDetails = null;
  try {
    const stored = localStorage.getItem('classes');
    if (stored) {
      const classes = JSON.parse(stored);
      classDetails = classes.find(c => c.id === classId);
    }
  } catch {}

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left summary/details panel */}
        <div className="md:w-1/4 w-full bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-2">{className}</h2>
          <div className="mb-2 text-gray-700">Total Students: <span className="font-semibold">{rows.length}</span></div>
          <div className="mb-10">
            <div className="font-semibold mb-1">Details</div>
            <div className="text-sm mb-1">Subject: {classDetails?.subject || '-'}</div>
            <div className="text-sm mb-1">Teacher: {classDetails?.teacher || '-'}</div>
            <div className="text-sm mb-1">Stream: {classDetails?.stream || '-'}</div>
            <div className="text-sm mb-1">Delivery: {classDetails?.deliveryMethod || '-'}</div>
            <div className="text-sm">Fee: {classDetails?.fee ? `Rs. ${classDetails.fee}` : '-'}</div>
          </div>
          <div className="mt-6">
            <CustomButton onClick={() => navigate('/admin/classes/all')} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 w-full">Back</CustomButton>
          </div>
        </div>
        {/* Right students table */}
        <div className="md:w-3/4 w-full bg-white rounded-lg shadow p-4">
          <h1 className="text-2xl font-bold mb-4">Students</h1>
          <BasicTable
            columns={[
              { key: 'id', label: 'Student ID' },
              { key: 'firstname', label: 'First Name' },
              { key: 'lastname', label: 'Last Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'school', label: 'School' },
              { key: 'dateJoined', label: 'Date Joined' },
            ]}
            data={rows}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClassStudents;
