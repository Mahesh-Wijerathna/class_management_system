import React from 'react';
import { FaUsers, FaGraduationCap, FaFolder, FaBook, FaChartBar, FaCog, FaCalendar, FaUserPlus, FaFileAlt, FaUsersCog, FaUserShield, FaDatabase, FaBell, FaSync, FaMoneyBill } from 'react-icons/fa';

// Sidebar sections for the teacher dashboard

const teacherSidebarSections = [
  {
    section: 'Dashboard Overview',
    items: [
      { name: 'Dashboard Overview', path: '/teacherdashboard', icon: <FaChartBar className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Class Schedules',
    items: [
      { name: 'My Classes', path: '/teacher/my-classes', icon: <FaBook className="h-5 w-5" /> },
      { name: 'Class Session Schedules', path: '/teacher/schedules', icon: <FaCalendar className="h-5 w-5" /> },
      { name: 'Hall Availability', path: '/teacher/halls', icon: <FaDatabase className="h-5 w-5" /> },
      { name: 'Class Enrollments', path: '/teacher/enrollments', icon: <FaUsers className="h-5 w-5" /> },
      { name: 'Class Payments', path: '/teacher/payments', icon: <FaMoneyBill className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Attendance',
    items: [
      { name: 'Attendance Management', path: '/teacher/attendance-management', icon: <FaChartBar className="h-5 w-5" /> },
      { name: 'Student Attendance Overview', path: '/teacher/attendance', icon: <FaUsersCog className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Student Performance',
    items: [
      { name: 'View Performance', path: '/teacher/students/performance', icon: <FaGraduationCap className="h-5 w-5" /> },
      { name: 'Relevant Student Data', path: '/teacher/students/data', icon: <FaUserShield className="h-5 w-5" /> },
      { name: 'Fees Report', path: '/teacher/students/fees-report', icon: <FaChartBar className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Financial Records',
    items: [
      { name: 'Payment Days', path: '/teacher/finance/payment-days', icon: <FaBell className="h-5 w-5" /> },
      { name: 'Monthly/Daily Records', path: '/teacher/finance/records', icon: <FaChartBar className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Class Materials',
    items: [
      { name: 'Create Folders & Links', path: '/teacher/materials/folders', icon: <FaFolder className="h-5 w-5" /> },
      { name: 'Manage Materials', path: '/teacher/materials/manage', icon: <FaFileAlt className="h-5 w-5" /> },
      { name: 'Upload Assignments', path: '/teacher/assignments/upload', icon: <FaFileAlt className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Exams',
    items: [
      {name: 'Exam Dashboard', path: '/teacher/exams/dashboard', icon: <FaCog className="h-5 w-5" /> },
      // { name: 'Create Exam', path: '/teacher/exams/create', icon: <FaFolder className="h-5 w-5" /> },
      // { name: 'Manage Exams', path: '/teacher/exams/manage', icon: <FaFileAlt className="h-5 w-5" /> },
      // { name: 'View Exam Results', path: '/exam/${exam.exam_id}/results', icon: <FaFileAlt className="h-5 w-5" /> },
      // { name: 'View Exam Results', path: '/exam/:id/results', icon: <FaFileAlt className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Communication',
    items: [
      { name: 'Announcements', path: '/teacher/announcements', icon: <FaBell className="h-5 w-5" /> },
      { name: 'Message Students', path: '/teacher/messages', icon: <FaUsers className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Reports',
    items: [
      { name: 'Generate Reports', path: '/teacher/reports', icon: <FaChartBar className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Teacher Staff',
    items: [
      { name: 'Create & Manage Staff', path: '/teacher/staff', icon: <FaUserPlus className="h-5 w-5" /> },
    ]
  },
];


export default teacherSidebarSections;