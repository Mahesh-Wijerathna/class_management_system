// import React, { useEffect, useState } from 'react';
// import { getUserPermissions } from '../../../api/rbac';
// import { getUserData } from '../../../api/apiUtils';
// import { 
//   FaChartBar, 
//   FaMoneyBill, 
//   FaFileInvoice, 
//   FaHistory, 
//   FaGraduationCap,
//   FaBook,
//   FaClipboardList,
//   FaExclamationTriangle,
//   FaIdCard,
//   FaPlusSquare,
//   FaUsers,
//   FaTruck,
//   FaSdCard
// } from 'react-icons/fa';

// // All possible sidebar sections with permission requirements
// const allCashierSidebarSections = [
//   {
//     section: 'Dashboard Overview',
//     items: [
//       { 
//         name: 'Cashier Dashboard', 
//         path: '/cashierdashboard', 
//         icon: <FaChartBar className="h-5 w-5" />,
//         permission: 'dashboard_overview.cashier_dashboard'
//       },
//     ]
//   },
//   {
//     section: 'Student Tracking',
//     items: [
//       { name: 'Late Payments', path: '/cashier/late-payments', icon: <FaExclamationTriangle className="h-5 w-5" /> },
//       { name: 'Forget ID Card Students', path: '/cashier/forget-id-card', icon: <FaIdCard className="h-5 w-5" /> },
//       { name: 'Free and Half Cards' , path: '/cashier/free-and-half-cards', icon: <FaSdCard className="h-5 w-5" /> },
//     ]
//   },
//   {
//     section: 'Reports & History',
//     items: [
//       { name: 'Session End Report History', path: '/cashier/session-report-history', icon: <FaHistory className="h-5 w-5" /> },
//       { name: 'Day End Report History', path: '/cashier/day-end-report-history', icon: <FaFileInvoice className="h-5 w-5" /> },
//     ]
//   },
//   {
//     section: 'High Level Admin  Tasks',
//     items: [  
//       { name: 'Student Enrollment', path: '/cashier/students/enrollment', icon: <FaGraduationCap className="h-5 w-5" />, requiredPermissions: ['student_management.student_enrollment'] },
//       { name: 'Purchased Classes', path: '/cashier/students/purchased-classes', icon: <FaBook className="h-5 w-5" />, requiredPermissions: ['student_management.purchased_classes'] },
//       { name: 'Create Class', path: '/cashier/classes/create', icon: <FaPlusSquare className="h-5 w-5" />, requiredPermissions: ['class_and_schedule.create_class'] },
//       { name: 'All Classes', path: '/cashier/classes/all', icon: <FaClipboardList className="h-5 w-5" />, requiredPermissions: ['class_and_schedule.all_classes'] },
//       { name: 'Class Enrollments', path: '/cashier/classes/enrollments', icon: <FaUsers className="h-5 w-5" />, requiredPermissions: ['class_and_schedule.class_enrollments'] },
//       { name: 'Class Halls', path: '/cashier/class-halls', icon: <FaBook className="h-5 w-5" />, requiredPermissions: ['class_and_schedule.class_halls'] },
//       { name: 'Class Payments', path: '/cashier/classes/payments', icon: <FaMoneyBill className="h-5 w-5" />, requiredPermissions: ['class_and_schedule.class_payments'] },
//       { name: 'Attendance ', path: '/cashier/attendance-management', icon: <FaClipboardList className="h-5 w-5" />, requiredPermissions: ['student_management.attendance_management'] },
//       { name: 'Speed Post Delivery', path: '/cashier/speed-post-deliveries', icon: <FaTruck className="h-5 w-5" />, requiredPermissions: ['delivery_management.speed_post_deliveries'] },
//  ]
//   },

// ];


// export default CashierDashboardSidebar;




import React from 'react';
import { 
  FaChartBar, 
  FaMoneyBill, 
  FaFileInvoice, 
  FaClock, 
  FaHistory, 
  FaPrint, 
  FaUser,
  FaCog,
  FaBell,
  FaExclamationTriangle,
  FaIdCard,
  FaCalendar
} from 'react-icons/fa';
import { filterSidebarByPermissions } from '../../../utils/permissionChecker';

const CashierDashboardSidebar = (permissions = []) => {
  // Define all possible sidebar sections with permission requirements
  const allSidebarSections = [
    {
      section: 'Dashboard Overview',
      items: [
        { 
          name: 'Cashier Dashboard', 
          path: '/cashierdashboard', 
          icon: <FaChartBar className="h-5 w-5" />,
          requiredPermissions: ['dashboard_overview.dashboard_overview']
        },
      ]
    },
    {
      section: 'Student Tracking',
      items: [
        { 
          name: 'Late Payments', 
          path: '/cashier/late-payments', 
          icon: <FaExclamationTriangle className="h-5 w-5" />,
          requiredPermissions: ['schedule_and_calendar.due_dates']
        },
        { 
          name: 'Forget ID Card Students', 
          path: '/cashier/forget-id-card', 
          icon: <FaIdCard className="h-5 w-5" />,
          requiredPermissions: ['schedule_and_calendar.due_dates']
        },
      ]
    },
//   {
//     section: 'Reports & History',
//     items: [
//       { name: 'Session End Report History', path: '/cashier/session-report-history', icon: <FaHistory className="h-5 w-5" /> },
//       { name: 'Day End Report History', path: '/cashier/day-end-report-history', icon: <FaFileInvoice className="h-5 w-5" /> },
//     ]
//   },
//   {
//     section: 'High Level Admin  Tasks',
//     items: [  
//       { name: 'Student Enrollment', path: '/cashier/students/enrollment', icon: <FaGraduationCap className="h-5 w-5" />, requiredPermissions: ['student_management.student_enrollment'] },
//       { name: 'Purchased Classes', path: '/cashier/students/purchased-classes', icon: <FaBook className="h-5 w-5" />, requiredPermissions: ['student_management.purchased_classes'] },
//       { name: 'Create Class', path: '/cashier/classes/create', icon: <FaPlusSquare className="h-5 w-5" />, requiredPermissions: ['class_and_schedule.create_class'] },
//       { name: 'All Classes', path: '/cashier/classes/all', icon: <FaClipboardList className="h-5 w-5" />, requiredPermissions: ['class_and_schedule.all_classes'] },
//       { name: 'Class Enrollments', path: '/cashier/classes/enrollments', icon: <FaUsers className="h-5 w-5" />, requiredPermissions: ['class_and_schedule.class_enrollments'] },
//       { name: 'Class Halls', path: '/cashier/class-halls', icon: <FaBook className="h-5 w-5" />, requiredPermissions: ['class_and_schedule.class_halls'] },
//       { name: 'Class Payments', path: '/cashier/classes/payments', icon: <FaMoneyBill className="h-5 w-5" />, requiredPermissions: ['class_and_schedule.class_payments'] },
//       { name: 'Attendance ', path: '/cashier/attendance-management', icon: <FaClipboardList className="h-5 w-5" />, requiredPermissions: ['student_management.attendance_management'] },
//       { name: 'Speed Post Delivery', path: '/cashier/speed-post-deliveries', icon: <FaTruck className="h-5 w-5" />, requiredPermissions: ['delivery_management.speed_post_deliveries'] },
//  ]
//   },

  ];

  // Filter sidebar sections based on user permissions
  const filteredSections = filterSidebarByPermissions(allSidebarSections, permissions);

  return filteredSections;
};

export default CashierDashboardSidebar;
