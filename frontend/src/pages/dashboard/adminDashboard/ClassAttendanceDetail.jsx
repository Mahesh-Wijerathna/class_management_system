import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import CustomButton from '../../../components/CustomButton';



const statusColor = {
  present: 'text-green-700 font-bold',
  absent: 'text-red-700 font-bold',
  late: 'text-yellow-700 font-bold',
};

const ClassAttendanceDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  // Fetch classes and enrollments from localStorage
  const getClassList = () => {
    try {
      const stored = localStorage.getItem('classes');
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  };

  const getEnrollments = () => {
    try {
      const stored = localStorage.getItem('enrollments');
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  };

  const classList = getClassList();
  const enrollments = getEnrollments();
  // Ensure classId is compared as string
  const classObj = classList.find(cls => String(cls.id) === String(classId));
  const students = enrollments.filter(e => String(e.classId) === String(classId));
  // Sessions: support both sessions array and sessionDetails object
  const sessions = classObj?.sessions && Array.isArray(classObj.sessions)
    ? classObj.sessions
    : (classObj?.sessionDetails ? Object.keys(classObj.sessionDetails) : []);
  const [selectedSession, setSelectedSession] = useState(sessions[0] || '');

  if (!classObj) {
    return (
      <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
        <div className="p-6 bg-white rounded-lg shadow text-red-600 font-bold">
          Class not found.<br />
          <button
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
            onClick={() => navigate('/admin/attendance')}
          >
            Back to Attendance Overview
          </button>
        </div>
      </DashboardLayout>
    );
  }


  // Get attendance for the selected session
  const sessionDetails = (classObj.sessionDetails && classObj.sessionDetails[selectedSession]) || {};
  // If attendance data exists, map students with attendance; else, just show enrolled students
  const studentsWithAttendance = students.map(stu => {
    // Support both studentId and id for mapping
    const sid = stu.studentId || stu.id;
    const att = sessionDetails.attendance?.[sid] || {};
    return {
      ...stu,
      status: att.status || 'absent',
      in: att.in || '',
      out: att.out || '',
    };
  });

  // Calculate summary
  const presentCount = studentsWithAttendance.filter(s => s.status === 'present').length;
  const absentCount = studentsWithAttendance.filter(s => s.status === 'absent').length;
  const lateCount = studentsWithAttendance.filter(s => s.status === 'late').length;
  const total = studentsWithAttendance.length;

  const presentPercent = total ? ((presentCount / total) * 100).toFixed(1) : 0;
  const absentPercent = total ? ((absentCount / total) * 100).toFixed(1) : 0;
  const latePercent = total ? ((lateCount / total) * 100).toFixed(1) : 0;

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left summary/details panel */}
        <div className="md:w-1/4 w-full bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-2">{selectedSession} <span className="text-sm text-gray-500">({sessionDetails.from} - {sessionDetails.to})</span></h2>
          <div className="mb-2 text-gray-700">Location: <span className="font-semibold">{classObj.hall}</span></div>
          <div className="mb-4">
            <div className="font-semibold mb-1">Summary</div>
            <div className="text-sm mb-1">Present: <span className="text-green-700 font-bold">{presentCount}</span> ({presentPercent}%)</div>
            <div className="text-sm mb-1">Absent: <span className="text-red-700 font-bold">{absentCount}</span> ({absentPercent}%)</div>
            <div className="text-sm mb-1">Late: <span className="text-yellow-700 font-bold">{lateCount}</span> ({latePercent}%)</div>
            <div className="text-sm mt-2">Total: <span className="font-bold">{total}</span></div>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="font-semibold">Details</div>
            <div className="text-sm">Class Name: {classObj.className}</div>
            <div className="text-sm">Subject: {classObj.subject}</div>
            <div className="text-sm">Total Students: {classObj.length}</div>
            <div className="text-sm">Location: {classObj.hall}</div>
          </div>
          <div className="mt-4">
            <label className="font-semibold mr-2">Session Date:</label>
            <select
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
              className="border rounded px-2 py-1"
            >
              {sessions.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
          <div className="mt-6">
            <CustomButton onClick={() => navigate('/admin/attendance')} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 w-full">Back</CustomButton>
          </div>
        </div>

        {/* Right attendance table */}
        <div className="md:w-3/4 w-full bg-white rounded-lg shadow p-4">
          <h1 className="text-2xl font-bold mb-4">Attendance</h1>
          <BasicTable
            columns={[
              { key: 'id', label: 'Student ID' },
              { key: 'indexNo', label: 'Index No.' },
              { key: 'name', label: 'Name' },
              { key: 'school', label: 'School' },
              { key: 'in', label: 'In' },
              { key: 'out', label: 'Out' },
              { key: 'status', label: 'Status', render: (row) => (
                <span className={statusColor[row.status] || ''}>
                  {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                </span>
              ) },
            ]}
            data={studentsWithAttendance}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClassAttendanceDetail; 