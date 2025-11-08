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
      { name: 'Dashboard Overview', path: '/cashierdashboard', icon: <FaChartBar className="h-5 w-5" />, requiredPermissions: ['dashboard_overview.dashboard_overview'] },
    ]
  },
  {
    section: 'Payment Processing',
    items: [
      { name: 'Process Payment', path: '/cashier/process-payment', icon: <FaCreditCard className="h-5 w-5" />, requiredPermissions: ['payment_processing.process_payment'] },
      { name: 'Payment History', path: '/cashier/payment-history', icon: <FaReceipt className="h-5 w-5" />, requiredPermissions: ['payment_processing.payment_history'] },
    ]
  },
  {
    section: 'Student Management',
    items: [
      { name: 'Student Records', path: '/cashier/students', icon: <FaUsers className="h-5 w-5" />, requiredPermissions: ['student_management.student_records'] },
      { name: 'Student Payments', path: '/cashier/student-payments', icon: <FaReceipt className="h-5 w-5" />, requiredPermissions: ['student_management.student_payments'] },
    ]
  },
  {
    section: 'Financial Records',
    items: [
      { name: 'Daily Transactions', path: '/cashier/daily-transactions', icon: <FaFileAlt className="h-5 w-5" />, requiredPermissions: ['financial_records.daily_transactions'] },
      { name: 'Monthly Reports', path: '/cashier/monthly-reports', icon: <FaChartBar className="h-5 w-5" />, requiredPermissions: ['financial_records.monthly_reports'] },
      { name: 'Revenue Summary', path: '/cashier/revenue-summary', icon: <FaReceipt className="h-5 w-5" />, requiredPermissions: ['financial_records.revenue_summary'] },
    ]
  },
  {
    section: 'Reports & Analytics',
    items: [
      { name: 'Financial Reports', path: '/cashier/reports', icon: <FaFileAlt className="h-5 w-5" />, requiredPermissions: ['reports_and_analytics.financial_reports'] },
      { name: 'Payment Analytics', path: '/cashier/analytics', icon: <FaChartBar className="h-5 w-5" />, requiredPermissions: ['reports_and_analytics.payment_analytics'] },
      { name: 'Print Receipts', path: '/cashier/print-receipts', icon: <FaPrint className="h-5 w-5" />, requiredPermissions: ['reports_and_analytics.print_receipts'] },
    ]
  },
  {
    section: 'Schedule & Calendar',
    items: [
      { name: 'Payment Schedule', path: '/cashier/payment-schedule', icon: <FaCalendarAlt className="h-5 w-5" />, requiredPermissions: ['schedule_and_calendar.payment_schedule'] },
      { name: 'Due Dates', path: '/cashier/due-dates', icon: <FaCalendarAlt className="h-5 w-5" />, requiredPermissions: ['schedule_and_calendar.due_dates'] },
    ]
  },
  {
    section: 'Settings & Profile',
    items: [
      { name: 'My Profile', path: '/cashier/profile', icon: <FaUserCog className="h-5 w-5" />, requiredPermissions: ['settings_and_profile.my_profile'] },
      { name: 'Settings', path: '/cashier/settings', icon: <FaCog className="h-5 w-5" />, requiredPermissions: ['settings_and_profile.settings'] },
      { name: 'Notifications', path: '/cashier/notifications', icon: <FaBell className="h-5 w-5" />, requiredPermissions: ['settings_and_profile.notifications'] },
    ]
  }
];

export default cashierSidebarSections; 