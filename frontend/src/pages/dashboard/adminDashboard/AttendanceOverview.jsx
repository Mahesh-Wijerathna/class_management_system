import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import CustomButton from '../../../components/CustomButton';

// Dummy class data (replace with API data in production)
const allClasses = [
  {
    id: 'class1',
    className: 'Advanced Mathematics',
    subject: 'Mathematics',
    teacher: 'Mr. Silva',
    stream: 'A/L',
    date: '2025-07-26',
    from: '08:00',
    to: '11:00',
    location: 'Main',
    status: 'Started',
    studentsPresent: 25,
    totalStudents: 30,
  },
  {
    id: 'class2',
    className: 'Physics Fundamentals',
    subject: 'Physics',
    teacher: 'Ms. Perera',
    stream: 'O/L',
    date: '2025-07-26',
    from: '12:00',
    to: '14:00',
    location: 'Main',
    status: 'Not Started',
    studentsPresent: 0,
    totalStudents: 28,
  },
  {
    id: 'class3',
    className: '2025 Theory [I]',
    subject: 'Geography',
    teacher: 'Mr. Ranasinghe',
    stream: 'RR',
    date: '2025-07-26',
    from: '08:00',
    to: '10:00',
    location: 'Main',
    status: 'Started',
    studentsPresent: 18,
    totalStudents: 20,
  },
];

const AttendanceOverview = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('2025-07-26');

  // Filter classes by selected date
  const filteredClasses = allClasses.filter(cls => cls.date === selectedDate);

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
          />
        </div>
        <BasicTable
          columns={[
            { key: 'className', label: 'Class', render: row => (
                <span>
                  <span className="font-semibold">{row.subject}</span>{' '}
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded ml-1">{row.stream}</span>{' '}
                  <span className="text-gray-700">{row.className}</span>
                </span>
              ) },
            { key: 'date', label: 'Date' },
            { key: 'from', label: 'From' },
            { key: 'to', label: 'To' },
            { key: 'location', label: 'Location' },
            { key: 'status', label: 'Status', render: row => (
                <span className={`px-2 py-1 rounded text-xs font-bold ${row.status === 'Started' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{row.status}</span>
              ) },
            { key: 'studentsPresent', label: 'Attendance', render: row => (
                <span className="font-semibold text-blue-700">{row.studentsPresent} / {row.totalStudents}</span>
              ) },
            { key: 'actions', label: 'Actions', render: (row) => (
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