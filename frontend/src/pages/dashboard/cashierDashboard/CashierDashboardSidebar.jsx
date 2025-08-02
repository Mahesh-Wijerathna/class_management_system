import React from 'react';
import { 
  FaChartBar, 
  FaCreditCard, 
  FaUsers, 
  FaFileAlt, 
  FaReceipt, 
  FaSearch, 
  FaHistory, 
  FaPrint,
  FaCalendarAlt,
  FaCog,
  FaBell,
  FaUserCog
} from 'react-icons/fa';

// Sidebar sections for the cashier dashboard
const cashierSidebarSections = [
  {
    section: 'Dashboard Overview',
    items: [
      { name: 'Dashboard Overview', path: '/cashierdashboard', icon: <FaChartBar className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Payment Processing',
    items: [
      { name: 'Process Payment', path: '/cashier/process-payment', icon: <FaCreditCard className="h-5 w-5" /> },
      { name: 'Payment History', path: '/cashier/payment-history', icon: <FaReceipt className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Student Management',
    items: [
      { name: 'Student Records', path: '/cashier/students', icon: <FaUsers className="h-5 w-5" /> },
      { name: 'Student Payments', path: '/cashier/student-payments', icon: <FaReceipt className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Financial Records',
    items: [
      { name: 'Daily Transactions', path: '/cashier/daily-transactions', icon: <FaFileAlt className="h-5 w-5" /> },
      { name: 'Monthly Reports', path: '/cashier/monthly-reports', icon: <FaChartBar className="h-5 w-5" /> },
      { name: 'Revenue Summary', path: '/cashier/revenue-summary', icon: <FaReceipt className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Reports & Analytics',
    items: [
      { name: 'Financial Reports', path: '/cashier/reports', icon: <FaFileAlt className="h-5 w-5" /> },
      { name: 'Payment Analytics', path: '/cashier/analytics', icon: <FaChartBar className="h-5 w-5" /> },
      { name: 'Print Receipts', path: '/cashier/print-receipts', icon: <FaPrint className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Schedule & Calendar',
    items: [
      { name: 'Payment Schedule', path: '/cashier/payment-schedule', icon: <FaCalendarAlt className="h-5 w-5" /> },
      { name: 'Due Dates', path: '/cashier/due-dates', icon: <FaCalendarAlt className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Settings & Profile',
    items: [
      { name: 'My Profile', path: '/cashier/profile', icon: <FaUserCog className="h-5 w-5" /> },
      { name: 'Settings', path: '/cashier/settings', icon: <FaCog className="h-5 w-5" /> },
      { name: 'Notifications', path: '/cashier/notifications', icon: <FaBell className="h-5 w-5" /> },
    ]
  }
];

export default cashierSidebarSections; 