import React from 'react';
import { FaUsers, FaUserSlash, FaGraduationCap, FaBook, FaChartBar, FaCog, FaCalendar, FaUserPlus, FaFileAlt, FaUsersCog, FaUserShield, FaDatabase, FaBell, FaSync, FaPlusSquare, FaClipboardList, FaTicketAlt, FaShieldAlt, FaMoneyBill, FaVideo, FaQrcode, FaTruck } from 'react-icons/fa';

// Sidebar sections for the admin dashboard
const adminSidebarSections = [
  {
    section: 'Dashboard Overview',
    items: [
      { name: 'Dashboard Overview', path: '/admindashboard', icon: <FaChartBar className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Core Admin Management',
    items: [
      { name: 'Create Core Admin', path: '/admin/core-admins/create', icon: <FaUserPlus className="h-5 w-5" /> },
      { name: 'Core Admin Info', path: '/admin/core-admins/info', icon: <FaUsers className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Cashier Management',
    items: [
      { name: 'Create Cashier', path: '/admin/cashiers/create', icon: <FaUserPlus className="h-5 w-5" /> },
      { name: 'Cashier Info', path: '/admin/cashiers/info', icon: <FaUsers className="h-5 w-5" /> },
      { name: 'Cashier Dashboard', path: '/admin/cashiers/cashierdashboard', icon: <FaUserSlash className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Teacher Management',
    items: [
      { name: 'Create Teacher', path: '/admin/teachers/create', icon: <FaUserPlus className="h-5 w-5" /> },
      { name: 'Teacher Info', path: '/admin/teachers/info', icon: <FaUsers className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Student Management',
    items: [
      { name: 'Student Enrollment', path: '/admin/students/enrollment', icon: <FaGraduationCap className="h-5 w-5" /> },
      { name: 'Student Cards', path: '/admin/students/cards', icon: <FaTicketAlt className="h-5 w-5" /> },
      { name: 'Attendance Management', path: '/admin/attendance-management', icon: <FaClipboardList className="h-5 w-5" /> },
      { name: 'Purchased Classes', path: '/admin/students/purchased-classes', icon: <FaBook className="h-5 w-5" /> },
    ]
  },
          {
          section: 'Class & Schedule',
          items: [
            { name: 'Create Class', path: '/admin/classes/create', icon: <FaPlusSquare className="h-5 w-5" /> },
            { name: 'All Classes', path: '/admin/classes/all', icon: <FaClipboardList className="h-5 w-5" /> },
            { name: 'Class Payments', path: '/admin/classes/payments', icon: <FaMoneyBill className="h-5 w-5" /> },
            { name: 'Class Enrollments', path: '/admin/classes/enrollments', icon: <FaUsers className="h-5 w-5" /> },
            { name: 'Class Halls', path: '/admin/class-halls', icon: <FaBook className="h-5 w-5" /> },
          ]
        },
  {
    section: 'Finance & Reports',
    items: [
      { name: 'Financial Records', path: '/admin/financial', icon: <FaChartBar className="h-5 w-5" /> },
      { name: 'Generate Reports', path: '/admin/reports', icon: <FaFileAlt className="h-5 w-5" /> },
      { name: 'Student All Payments', path: '/admin/students-payments', icon: <FaUserShield className="h-5 w-5" /> },
    ]
  },
  {
    section: 'User Roles',
    items: [
      { name: 'All Roles', path: '/admin/roles', icon: <FaUsersCog className="h-5 w-5" /> }
    ]
  },
  {
    section: 'Communication',
    items: [
      { name: 'Announcements', path: '/admin/announcements', icon: <FaBell className="h-5 w-5" /> },
      { name: 'Messages', path: '/admin/messages', icon: <FaUsers className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Security & Monitoring',
    items: [
      { name: 'Student Monitoring', path: '/admin/monitoring', icon: <FaShieldAlt className="h-5 w-5" /> },
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