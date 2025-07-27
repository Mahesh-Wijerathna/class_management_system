import React, { useState } from 'react';
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

const AttendanceOverview = () => {
  const navigate = useNavigate();


  // Date filter: empty string means show all
  const [selectedDate, setSelectedDate] = useState('');

  const classList = getClassList();
  const enrollments = getEnrollments();

  // Calculate studentsPresent and totalStudents for each class
  const classesWithAttendance = classList.map(cls => {
    const students = enrollments.filter(e => e.classId === cls.id);
    return {
      ...cls,
      studentsPresent: students.length, // For now, all enrolled are present (customize as needed)
      totalStudents: students.length,
      date: cls.startDate || '',
      from: cls.schedule?.startTime || '',
      to: cls.schedule?.endTime || '',
      location: cls.hall || '',
      status: cls.status || 'Not Started',
    };
  });

  // Filter classes by selected date if selectedDate is set, else show all
  const filteredClasses = selectedDate
    ? classesWithAttendance.filter(cls => cls.date === selectedDate)
    : classesWithAttendance;

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Attendance Tracking</h1>
        <div className="flex items-center gap-4 mb-4">
          <label className="font-semibold">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border rounded px-2 py-1"
            placeholder="Select date (optional)"
          />
          {selectedDate && (
            <button
              type="button"
              className="ml-2 text-sm text-gray-600 underline hover:text-blue-700"
              onClick={() => setSelectedDate('')}
            >
              Clear
            </button>
          )}
        </div>
        <BasicTable
          columns={[
            { key: 'className', label: 'Class Name' },
            { key: 'subject', label: 'Subject' },
            { key: 'teacher', label: 'Teacher' },
            { key: 'stream', label: 'Stream' },
            { key: 'date', label: 'Date' },
            { key: 'from', label: 'From' },
            { key: 'to', label: 'To' },
            { key: 'location', label: 'Location' },
            { key: 'status', label: 'Status', render: row => {
                if (row.status === 'active') return <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-semibold">Active</span>;
                if (row.status === 'inactive') return <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-semibold">Inactive</span>;
                if (row.status === 'archived') return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-semibold">Archived</span>;
                return row.status;
              } },
            { key: 'studentsPresent', label: 'Attendance', render: row => (
                <span className="font-semibold text-blue-700">{row.studentsPresent}</span>
              ) },
            { key: 'actions', label: 'Actions', render: row => (
                <CustomButton
                  onClick={() => navigate(`/admin/attendance/${row.id}`)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View Attendance
                </CustomButton>
              ) },
          ]}
          data={filteredClasses}
        />
      </div>
    </DashboardLayout>
  );
};

export default AttendanceOverview; 