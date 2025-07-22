import React from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import teacherSidebarSections from '././TeacherDashboardSidebar';

const TeacherDashboard = ({ onLogout }) => {
  return (
    <DashboardLayout
      userRole="Teacher"
      sidebarItems={teacherSidebarSections}
      onLogout={onLogout}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Active Classes</h3>
            <p className="text-3xl font-bold text-blue-600">4</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-green-600">45</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Pending Assignments</h3>
            <p className="text-3xl font-bold text-yellow-600">8</p>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Mathematics - Class 10A</p>
                  <p className="text-sm text-gray-600">9:00 AM - 10:30 AM</p>
                  <p className="text-sm text-gray-500">Room 101</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  In Progress
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Physics - Class 11B</p>
                  <p className="text-sm text-gray-600">11:00 AM - 12:30 PM</p>
                  <p className="text-sm text-gray-500">Room 203</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Upcoming
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
                  <p className="text-sm text-gray-600">Class 10A</p>
                  <p className="text-sm text-gray-500">Due: Tomorrow</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  Pending Review
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
};

export default TeacherDashboard; 