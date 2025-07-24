import React, { useState } from 'react';

import StudentEnrollment from './StudentEnrollment';
import PhysicalStudentRegisterTab from './PhysicalStudentRegisterTab';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from '../../dashboard/adminDashboard/AdminDashboardSidebar';

const StudentTabsPage = () => {
  const [activeTab, setActiveTab] = useState('enrollment');

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections} >
      <div className="w-full max-w-25xl bg-white rounded-lg shadow p-4 mx-auto">
        <div className="flex gap-4 mb-6 border-b">
          <button
            className={`px-4 py-2 font-bold text-base focus:outline-none border-b-2 transition-colors ${activeTab === 'enrollment' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'}`}
            onClick={() => setActiveTab('enrollment')}
          >
            Student Enrollment
          </button>
          <button
            className={`px-4 py-2 font-bold text-base focus:outline-none border-b-2 transition-colors ${activeTab === 'physical' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'}`}
            onClick={() => setActiveTab('physical')}
          >
            Physical Student Registration
          </button>
        </div>
        <div>
          {activeTab === 'enrollment' && <StudentEnrollment />}
          {activeTab === 'physical' && <PhysicalStudentRegisterTab />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentTabsPage;
