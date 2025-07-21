import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  FaUsers, FaGraduationCap, FaBook, FaChartBar, FaCog, FaCalendar,
  FaUserPlus, FaFileAlt, FaUsersCog, FaUserShield, FaDatabase, FaBell, FaSync
} from 'react-icons/fa';

// Sidebar sections for the admin dashboard
const sidebarSections = [
  {
    section: 'Teacher Management',
    items: [
      { name: 'Create Teacher Login', path: '/admin/teachers/create', icon: <FaUserPlus className="h-5 w-5" /> },
      { name: 'Teacher Info', path: '/admin/teachers', icon: <FaUsers className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Student Management',
    items: [
      { name: 'Student Enrollment', path: '/admin/students', icon: <FaGraduationCap className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Class & Schedule',
    items: [
      { name: 'Class Scheduling', path: '/admin/schedule', icon: <FaCalendar className="h-5 w-5" /> },
      { name: 'Class Halls', path: '/admin/class-halls', icon: <FaBook className="h-5 w-5" /> },
    ]
  },
  {
    section: 'Finance & Reports',
    items: [
      { name: 'Financial Records', path: '/admin/finance', icon: <FaChartBar className="h-5 w-5" /> },
      { name: 'Generate Reports', path: '/admin/reports', icon: <FaFileAlt className="h-5 w-5" /> },
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

const AdminDashboard = ({ onLogout }) => {
  return (
    <DashboardLayout
      userRole="Administrator"
      sidebarItems={sidebarSections}
      onLogout={onLogout}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Teachers</h3>
            <p className="text-3xl font-bold text-blue-600">25</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-green-600">150</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Active Classes</h3>
            <p className="text-3xl font-bold text-purple-600">12</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-yellow-600">$15,000</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">New Student Registration</p>
                  <p className="text-sm text-gray-600">John Doe joined Class 10A</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">New Teacher Added</p>
                  <p className="text-sm text-gray-600">Sarah Smith joined as Mathematics teacher</p>
                </div>
                <span className="text-sm text-gray-500">5 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard; 