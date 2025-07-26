import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import CustomButton from '../../../components/CustomButton';

// Dummy data for demonstration
const classData = {
  class1: {
    className: 'Advanced Mathematics',
    subject: 'Mathematics',
    teacher: 'Mr. Silva',
    stream: 'A/L',
    students: [
      { id: '93279565', indexNo: 159, name: 'Vishwa Senadhi', school: '---' },
      { id: '89877693', indexNo: 93, name: 'Shashini Devindi', school: 'Mr/thelijjawila Central College' },
      { id: '89662773', indexNo: 252, name: 'Tharushika Hansamali', school: 'M. R/dematapitiya M. V' },
      { id: '88956858', indexNo: 228, name: 'Nimesha Nimandi', school: 'Mahinda Rajapaksha College' },
      { id: '88895608', indexNo: 250, name: 'Ashidhi Nethma', school: 'St. Thomas Girl\'s High School, Matara' },
      { id: '88817415', indexNo: 132, name: 'Dasun Maduka', school: 'St. Thomas\' College' },
      { id: '88806015', indexNo: 98, name: 'Himaya Oshadi', school: 'Kongala M. M. V., Hakmana' },
      { id: '88499049', indexNo: 231, name: 'Nirmani Dinihya', school: 'Narandeniya National School' },
      { id: '88433869', indexNo: 108, name: 'Chanuthmi Nimsara', school: 'Mr/ Sumangala Balika Vidyalaya' },
      { id: '88409818', indexNo: 326, name: 'Thihasna Nimsaree', school: 'St. Thomas Girls High School' },
    ],
    sessions: [
      '2025-07-26',
      '2025-07-19',
    ],
    sessionDetails: {
      '2025-07-26': {
        name: '2025-07-26',
        description: '',
        location: 'Main',
        from: '08:00',
        to: '10:00',
        attendance: {
          '93279565': { status: 'absent', in: '', out: '' },
          '89877693': { status: 'present', in: '07:56', out: '' },
          '89662773': { status: 'absent', in: '', out: '' },
          '88956858': { status: 'absent', in: '', out: '' },
          '88895608': { status: 'absent', in: '', out: '' },
          '88817415': { status: 'present', in: '', out: '' },
          '88806015': { status: 'absent', in: '', out: '' },
          '88499049': { status: 'present', in: '07:40', out: '' },
          '88433869': { status: 'present', in: '07:55', out: '' },
          '88409818': { status: 'absent', in: '', out: '' },
        },
      },
      '2025-07-19': {
        name: '2025-07-19',
        description: '',
        location: 'Main',
        from: '08:00',
        to: '10:00',
        attendance: {
          '93279565': { status: 'present', in: '07:50', out: '' },
          '89877693': { status: 'present', in: '07:55', out: '' },
          '89662773': { status: 'late', in: '08:10', out: '' },
          '88956858': { status: 'absent', in: '', out: '' },
          '88895608': { status: 'present', in: '', out: '' },
          '88817415': { status: 'present', in: '', out: '' },
          '88806015': { status: 'absent', in: '', out: '' },
          '88499049': { status: 'present', in: '07:45', out: '' },
          '88433869': { status: 'absent', in: '', out: '' },
          '88409818': { status: 'absent', in: '', out: '' },
        },
      },
    },
  },
};

const statusColor = {
  present: 'text-green-700 font-bold',
  absent: 'text-red-700 font-bold',
  late: 'text-yellow-700 font-bold',
};

const ClassAttendanceDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const classInfo = classData[classId];
  const [selectedSession, setSelectedSession] = useState(classInfo?.sessions?.[0] || '');

  if (!classInfo) {
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
  const sessionDetails = classInfo.sessionDetails[selectedSession];
  const studentsWithAttendance = classInfo.students.map(stu => ({
    ...stu,
    status: sessionDetails.attendance[stu.id]?.status || 'absent',
    in: sessionDetails.attendance[stu.id]?.in || '',
    out: sessionDetails.attendance[stu.id]?.out || '',
  }));

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
          <div className="mb-2 text-gray-700">Location: <span className="font-semibold">{sessionDetails.location}</span></div>
          <div className="mb-4">
            <div className="font-semibold mb-1">Summary</div>
            <div className="text-sm mb-1">Present: <span className="text-green-700 font-bold">{presentCount}</span> ({presentPercent}%)</div>
            <div className="text-sm mb-1">Absent: <span className="text-red-700 font-bold">{absentCount}</span> ({absentPercent}%)</div>
            <div className="text-sm mb-1">Late: <span className="text-yellow-700 font-bold">{lateCount}</span> ({latePercent}%)</div>
            <div className="text-sm mt-2">Total: <span className="font-bold">{total}</span></div>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="font-semibold">Details</div>
            <div className="text-sm">Name: {sessionDetails.name}</div>
            <div className="text-sm">Description: {sessionDetails.description || '-'}</div>
            <div className="text-sm">Location: {sessionDetails.location}</div>
          </div>
          <div className="mt-4">
            <label className="font-semibold mr-2">Session Date:</label>
            <select
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
              className="border rounded px-2 py-1"
            >
              {classInfo.sessions.map(date => (
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