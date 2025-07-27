import React from 'react';
import { FaUsers, FaGraduationCap, FaBook, FaChartBar, FaCog, FaCalendar, FaUserPlus, FaFileAlt, FaUsersCog, FaUserShield, FaDatabase, FaBell, FaSync, FaPlusSquare, FaClipboardList } from 'react-icons/fa';

// Sidebar sections for the admin dashboard
const adminSidebarSections = [
  {
    section: 'Dashboard Overview',
    items: [
      { name: 'Dashboard Overview', path: '/admindashboard', icon: <FaChartBar className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Teacher Management',
    items: [
      { name: 'Create Teacher Login', path: '/admin/teachers/create', icon: <FaUserPlus className="h-5 w-5" /> },
      { name: 'Teacher Info', path: '/admin/teachers/info', icon: <FaUsers className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Student Management',
    items: [
      { name: 'Student Enrollment', path: '/admin/students/enrollment', icon: <FaGraduationCap className="h-5 w-5" /> },
      { name: 'Attendance', path: '/admin/attendance', icon: <FaClipboardList className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Class & Schedule',
    items: [
      { name: 'Create Class', path: '/admin/classes/create', icon: <FaPlusSquare className="h-5 w-5" /> },
      { name: 'Class Halls', path: '/admin/class-halls', icon: <FaBook className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Finance & Reports',
    items: [
      { name: 'Financial Records', path: '/admin/financial', icon: <FaChartBar className="h-5 w-5" /> },
      { name: 'Generate Reports', path: '/admin/reports', icon: <FaFileAlt className="h-5 w-5" /> },
      { name: 'Student All Payments', path: '/admin/students-payments', icon: <FaFileAlt className="h-5 w-5" /> },
    ]
  },
  {
    section: 'User Roles',
    items: [
      { name: 'View All Roles', path: '/admin/roles', icon: <FaUsersCog className="h-5 w-5" /> },
      { name: 'Roles with Permissions', path: '/admin/roles/create', icon: <FaUserShield className="h-5 w-5" /> },
    ]
  },
  {
    section: 'System Management',
    items: [
      { name: 'System Settings', path: '/admin/settings', icon: <FaCog className="h-5 w-5" /> },
      { name: 'Access All Data', path: '/admin/data', icon: <FaDatabase className="h-5 w-5" /> },
      { name: 'Notifications', path: '/admin/notifications', icon: <FaBell className="h-5 w-5" /> },
      { name: 'Backup and Restore', path: '/admin/backup', icon: <FaSync className="h-5 w-5" /> },
    ]
  }
];

export default adminSidebarSections; 