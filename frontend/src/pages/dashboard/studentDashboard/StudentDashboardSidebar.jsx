import React from 'react';
import { FaUsers, FaGraduationCap, FaFolder, FaBook, FaChartBar, FaCog, FaCalendar, FaUserPlus, FaFileAlt, FaUsersCog, FaUserShield, FaDatabase, FaBell, FaSync } from 'react-icons/fa';

const studentSidebarSections = [
    {
        section: 'Dashboard Overview',
        items: [
          { name: 'Dashboard Overview', path: '/studentdashboard', icon: <FaChartBar className="h-5 w-5" /> },
        ]
      },
    {
        section: 'Class Info',
        items: [
          { name: 'My Classes', path: '/student/myclasses', icon: <FaCalendar className="h-5 w-5" /> },
          { name: 'Teachers', path: '/student/teachers', icon: <FaDatabase className="h-5 w-5" /> },
          { name: 'Exams', path: '/student/exams', icon: <FaSync className="h-5 w-5" /> },
          { name: 'Result & Grades', path: '/student/result', icon: <FaUserShield className="h-5 w-5" /> },
        ]
      }
  ];

  export default studentSidebarSections;