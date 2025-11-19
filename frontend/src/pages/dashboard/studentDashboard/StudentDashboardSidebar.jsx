import React from 'react';
import { FaUsers, FaGraduationCap, FaFolder, FaBook, FaChartBar, FaCog, FaCalendar, FaUserPlus, FaFileAlt, FaUsersCog, FaUserShield, FaDatabase, FaBell, FaSync, FaMoneyBill, FaHeart, FaLanguage, FaIdCard, FaShoppingCart, FaShoppingBag, FaBookOpen, FaFolderOpen, FaCreditCard, FaTelegram, FaHome } from 'react-icons/fa';

// Build sidebar sections with simple i18n (en / si) based on localStorage.appLang
const translations = {
	en: {
		'Dashboard Overview': 'Dashboard Overview',
		'Student Management': 'Student Management',
		'Class Management': 'Class Management',
		'Study Pack Management': 'Study Pack Management',
		'Performance Management': 'Performance Management',
		'Student Dashboard': 'Student Dashboard',
		'My Profile': 'My Profile',
		'My Classes': 'My Classes',
		'Purchase Classes': 'Purchase Classes',
		'Class Payments': 'Class Payments',
		'Study Packs': 'Study Packs',
		'Purchase Study Pack': 'Purchase Study Pack',
		'Exam Results': 'Exam Results',
	},
	si: {
		'Dashboard Overview': 'ශිෂ්‍ය පුවරු සාරාංශය',
		'Student Management': 'ශිෂ්‍ය කළමනාකරණය',
		'Class Management': 'පන්ති කළමනාකරණය',
		'Study Pack Management': 'ඉගෙනුම් පැකේජ කළමනාකරණය',
		'Performance Management': 'කාර්ය සාධන කළමනාකරණය',
		'Student Dashboard': 'ශිෂ්‍ය පුවරුව',
		'My Profile': 'මගේ පැතිකඩ',
		'My Classes': 'මගේ පන්ති',
		'Purchase Classes': 'පන්ති මිලදී ගන්න',
		'Class Payments': 'පන්ති ගෙවීම්',
		'Study Packs': 'ඉගෙනුම් පැකේජ',
		'Purchase Study Pack': 'ඉගෙනුම් පැකේජ මිලදී ගන්න',
		'Exam Results': 'විභාග ප්‍රතිඵල',
	}
};


const buildSidebarSections = (lang = 'en') => {
	const t = (key) => (translations[lang] && translations[lang][key]) || translations.en[key] || key;
	return [
		{
			section: t('Dashboard Overview'),
			items: [
				{ name: t('Student Dashboard'), path: '/studentdashboard', icon: <FaHome className="h-5 w-5" /> },
			],
		},
		{
			section: t('Student Management'),
			items: [
				{ name: t('My Profile'), path: '/student/profile', icon: <FaUserShield className="h-5 w-5"/> },
			],
		},
		{
			section: t('Class Management'),
			items: [
				{ name: t('My Classes'), path: '/student/my-classes', icon: <FaBook className="h-5 w-5" /> },
				{ name: t('Purchase Classes'), path: '/student/purchase-classes', icon: <FaShoppingBag className="h-5 w-5" /> },
				{ name: t('Class Payments'), path: '/student/my-payments', icon: <FaCreditCard className="h-5 w-5" /> },
			],
		},
		{
			section: t('Study Pack Management'),
			items: [
				{ name: t('Study Packs'), path: '/student/studypacks', icon: <FaGraduationCap className="h-5 w-5" /> },
				{ name: t('Purchase Study Pack'), path: '/student/purchasestudypack', icon: <FaBookOpen className="h-5 w-5" /> },
			],
		},
		{
			section: t('Performance Management'),
			items: [
				{ name: t('Exam Results'), path: '/student/exam/results', icon: <FaFileAlt className="h-5 w-5" /> },
			],
		},
	];
};

// Start with current language
const initialLang = (typeof window !== 'undefined' && localStorage.getItem('appLang')) || 'en';
let studentSidebarSections = buildSidebarSections(initialLang);

// Keep the exported array contents in sync when language changes; mutate in-place so consumers see updates
if (typeof window !== 'undefined') {
	const applyLang = (lang) => {
		const newSections = buildSidebarSections(lang);
		// mutate existing array in-place
		studentSidebarSections.splice(0, studentSidebarSections.length, ...newSections);
	};

	window.addEventListener('appLangChanged', (e) => {
		const newLang = e?.detail || localStorage.getItem('appLang') || initialLang;
		applyLang(newLang);
	});

	window.addEventListener('storage', (e) => {
		if (e.key === 'appLang' && e.newValue) applyLang(e.newValue);
	});
}

// Also export a getter in case a component wants to rebuild the menu dynamically
export const getStudentSidebarSections = () => {
	const lang = (typeof window !== 'undefined' && localStorage.getItem('appLang')) || 'en';
	return buildSidebarSections(lang);
};

export default studentSidebarSections;