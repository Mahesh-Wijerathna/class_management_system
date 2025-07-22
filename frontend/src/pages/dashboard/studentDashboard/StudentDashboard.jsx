import React from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from '././StudentDashboardSidebar';

const StudentDashboard = ({ onLogout }) => {
  return (
    <DashboardLayout
      userRole="Student"
      sidebarItems={studentSidebarSections}
      onLogout={onLogout}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Enrolled Classes</h3>
            <p className="text-3xl font-bold text-blue-600">6</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Pending Assignments</h3>
            <p className="text-3xl font-bold text-yellow-600">3</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Average Grade</h3>
            <p className="text-3xl font-bold text-green-600">85%</p>
          </div>
        </div>

        {/* Today's Classes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Today's Classes</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Mathematics</p>
                  <p className="text-sm text-gray-600">9:00 AM - 10:30 AM</p>
                  <p className="text-sm text-gray-500">Room 101</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Upcoming
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Physics</p>
                  <p className="text-sm text-gray-600">11:00 AM - 12:30 PM</p>
                  <p className="text-sm text-gray-500">Room 203</p>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  Later Today
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Assignments */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Assignments</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Algebra Homework</p>
                  <p className="text-sm text-gray-600">Mathematics</p>
                  <p className="text-sm text-gray-500">Due: Tomorrow</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  Pending
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Physics Lab Report</p>
                  <p className="text-sm text-gray-600">Physics</p>
                  <p className="text-sm text-gray-500">Due: Next Week</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Submitted
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </DashboardLayout>
  );
};

export default StudentDashboard; 