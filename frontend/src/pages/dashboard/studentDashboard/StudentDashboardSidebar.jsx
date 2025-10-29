import React from 'react';
import { FaUsers, FaGraduationCap, FaFolder, FaBook, FaChartBar, FaCog, FaCalendar, FaUserPlus, FaFileAlt, FaUsersCog, FaUserShield, FaDatabase, FaBell, FaSync, FaMoneyBill, FaHeart, FaLanguage, FaIdCard, FaShoppingCart, FaShoppingBag, FaBookOpen, FaFolderOpen, FaCreditCard, FaTelegram, FaHome } from 'react-icons/fa';

const studentSidebarSections = [

  {
		section: 'Main Dashboard',
		items: [
			{ name: 'Student Dashboard', path: '/studentdashboard', icon: <FaHome className="h-5 w-5" /> },
    ],	
	},
	{
		section: 'Student',
		items: [
			{ name: 'My Profile', path: '/student/profile', icon: <FaUserShield className="h-5 w-5"/> },
			{ name: 'My Notifications', path: '/student/notifications', icon: <FaBell className="h-5 w-5" /> },
			{ name: 'My Student ID', path: '/student/id', icon: <FaIdCard className="h-5 w-5" /> },
		],
	},
	{
		section: 'Classes',
		items: [
			{ name: 'Live Classes', path: '/student/liveclasses', icon: <FaCalendar className="h-5 w-5" /> },
			{ name: 'My Payments', path: '/student/my-payments', icon: <FaCreditCard className="h-5 w-5" /> },
			{ name: 'My Classes', path: '/student/my-classes', icon: <FaBook className="h-5 w-5" /> },
			{ name: 'Past Lessons', path: '/student/pastlessons', icon: <FaFolder className="h-5 w-5" /> },
			{ name: 'Study Packs', path: '/student/studypacks', icon: <FaGraduationCap className="h-5 w-5" /> },
			{ name: 'Tute Tracking', path: '/student/tutetracking', icon: <FaSync className="h-5 w-5" /> },
		],
	},
	{
		section: 'Performance',
		items: [
			{ name: 'My Performance', path: '/student/performance', icon: <FaChartBar className="h-5 w-5" /> },
			{ name: 'Exam Results', path: '/student/exam/results', icon: <FaFileAlt className="h-5 w-5" /> },

		],
	},
	{
		section: 'Echem Store',
		items: [
			{ name: 'Store', path: '/student/store', icon: <FaShoppingCart className="h-5 w-5" /> },
			{ name: 'My Orders', path: '/student/orders', icon: <FaFileAlt className="h-5 w-5" /> },
		],
	},
	{
		section: 'Purchase',
		items: [
			{ name: 'Purchase Classes', path: '/student/purchase-classes', icon: <FaShoppingBag className="h-5 w-5" /> },
			{ name: 'Purchase Study Pack', path: '/student/purchasestudypack', icon: <FaBookOpen className="h-5 w-5" /> },
			{ name: 'Purchase Past Lessons', path: '/student/purchasepastlessons', icon: <FaFolderOpen className="h-5 w-5" /> },
		],
	},
	{
		section: 'Support',
		items: [
			{ name: 'Telegram Support', path: '/student/telegramsupport', icon: <FaTelegram className="h-5 w-5" /> },
		],
	},
];

export default studentSidebarSections;