import React from 'react';
import { 
  FaChartBar, 
  FaMoneyBill, 
  FaFileInvoice, 
  FaClock, 
  FaTicketAlt, 
  FaUserPlus, 
  FaSearch, 
  FaHistory, 
  FaPrint, 
  FaLock, 
  FaSignOutAlt,
  FaBarcode,
  FaUser,
  FaGraduationCap,
  FaBook,
  FaClipboardList,
  FaCog,
  FaBell,
  FaQrcode,
  FaCamera,
  FaStickyNote,
  FaExclamationTriangle,
  FaIdCard
} from 'react-icons/fa';

// Sidebar sections for the cashier dashboard
const cashierSidebarSections = [
  {
    section: 'Dashboard Overview',
    items: [
      { name: 'Cashier Dashboard', path: '/cashierdashboard', icon: <FaChartBar className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Student Tracking',
    items: [
      { name: 'Late Payments', path: '/cashier/late-payments', icon: <FaExclamationTriangle className="h-5 w-5" /> },
      { name: 'Forget ID Card Students', path: '/cashier/forget-id-card', icon: <FaIdCard className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Reports & History',
    items: [
      { name: 'Session End Report History', path: '/cashier/session-report-history', icon: <FaHistory className="h-5 w-5" /> },
    ]
  // },
  // {
  //   section: 'Payment Management',
  //   items: [
  //     { name: 'Quick Payment', path: '/cashier/quick-payment', icon: <FaMoneyBill className="h-5 w-5" /> },
  //     { name: 'Payment History', path: '/cashier/payment-history', icon: <FaHistory className="h-5 w-5" /> },
  //     { name: 'Pending Payments', path: '/cashier/pending-payments', icon: <FaClock className="h-5 w-5" /> },
  //     { name: 'Receipt Management', path: '/cashier/receipts', icon: <FaFileInvoice className="h-5 w-5" /> },
  //   ]
  // },
  // {
  //   section: 'Student Services',
  //   items: [
  //     { name: 'Student Search', path: '/cashier/student-search', icon: <FaSearch className="h-5 w-5" /> },
  //     { name: 'Quick Enrollment', path: '/cashier/quick-enrollment', icon: <FaUserPlus className="h-5 w-5" /> },
  //     { name: 'Student Cards', path: '/cashier/student-cards', icon: <FaTicketAlt className="h-5 w-5" /> },
  //     { name: 'Student Details', path: '/cashier/student-details', icon: <FaUser className="h-5 w-5" /> },
  //   ]
  // },
  // {
  //   section: 'Scanning & Tools',
  //   items: [
  //     { name: 'Barcode Scanner', path: '/cashier/barcode-scanner', icon: <FaBarcode className="h-5 w-5" /> },
  //     { name: 'QR Scanner', path: '/cashier/qr-scanner', icon: <FaQrcode className="h-5 w-5" /> },
  //     { name: 'Camera Scanner', path: '/cashier/camera-scanner', icon: <FaCamera className="h-5 w-5" /> },
  //   ]
  // },
  // {
  //   section: 'Reports & Analytics',
  //   items: [
  //     { name: 'Daily Reports', path: '/cashier/daily-reports', icon: <FaClipboardList className="h-5 w-5" /> },
  //     { name: 'Monthly Reports', path: '/cashier/monthly-reports', icon: <FaChartBar className="h-5 w-5" /> },
  //     { name: 'Print Reports', path: '/cashier/print-reports', icon: <FaPrint className="h-5 w-5" /> },
  //   ]
  // },
  // {
  //   section: 'Cash Management',
  //   items: [
  //     { name: 'Cash Drawer', path: '/cashier/cash-drawer', icon: <FaLock className="h-5 w-5" /> },
  //     { name: 'Drawer Lock', path: '/cashier/drawer-lock', icon: <FaLock className="h-5 w-5" /> },
  //     { name: 'Daily Collections', path: '/cashier/collections', icon: <FaMoneyBill className="h-5 w-5" /> },
  //   ]
  // },
  // {
  //   section: 'Class Management',
  //   items: [
  //     { name: 'Active Classes', path: '/cashier/active-classes', icon: <FaBook className="h-5 w-5" /> },
  //     { name: 'Class Payments', path: '/cashier/class-payments', icon: <FaMoneyBill className="h-5 w-5" /> },
  //     { name: 'Class Enrollments', path: '/cashier/class-enrollments', icon: <FaGraduationCap className="h-5 w-5" /> },
  //   ]
  // },
  // {
  //   section: 'Utilities',
  //   items: [
  //     { name: 'Notes & Messages', path: '/cashier/notes', icon: <FaStickyNote className="h-5 w-5" /> },
  //     { name: 'Notifications', path: '/cashier/notifications', icon: <FaBell className="h-5 w-5" /> },
  //     { name: 'Settings', path: '/cashier/settings', icon: <FaCog className="h-5 w-5" /> },
  //   ]
  }
];

export default cashierSidebarSections;
