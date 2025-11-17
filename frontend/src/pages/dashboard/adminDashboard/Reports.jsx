import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import AdminDashboardSidebar from './AdminDashboardSidebar';
import { getUserPermissions } from '../../../api/rbac';
import { getUserData } from '../../../api/apiUtils';
import FinancialReport from './FinancialReport';
import StudentPaymentReport from './StudentPaymentReport';
import AttendanceReport from './AttendanceReport';

const tabList = [
  { key: 'financial', label: 'Full Financial Report' },
  { key: 'studentPayments', label: 'Student Payment Reports' },
  { key: 'attendance', label: 'Attendance Reports' },
  { key: 'performance', label: 'Performance Reports' },
  { key: 'cardFees', label: 'Card Fees Reports' },
];

const Placeholder = ({ label }) => (
  <div className="p-8 text-center text-gray-500 text-lg">{label} (Coming soon...)</div>
);

const Reports = () => {
  const [activeTab, setActiveTab] = useState('financial');
  const [filteredSidebarSections, setFilteredSidebarSections] = useState(() => AdminDashboardSidebar([]));

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        // Resolve user id from common storage locations
        const userData = sessionStorage.getItem('userData') || localStorage.getItem('userData');
        let userId = null;
        if (userData) {
          try { const parsed = JSON.parse(userData); userId = parsed.userid || parsed.id || userId; } catch (e) {}
        } else {
          const user = getUserData();
          if (user) userId = user.userid || user.id || userId;
        }

        const resp = await getUserPermissions(userId);
        const perms = Array.isArray(resp) ? resp : (resp?.permissions || resp?.data || []);
        setFilteredSidebarSections(AdminDashboardSidebar(perms));
      } catch (err) {
        console.error('Failed to load permissions for Reports sidebar', err);
        setFilteredSidebarSections(AdminDashboardSidebar([]));
      }
    };

    loadPermissions();
  }, []);

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={filteredSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Reporting System</h1>
        <div className="flex gap-4 border-b mb-6">
          {tabList.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 font-bold text-base focus:outline-none border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div>
          {activeTab === 'financial' && <FinancialReport />}
          {activeTab === 'studentPayments' && <StudentPaymentReport />}
          {activeTab === 'attendance' && <AttendanceReport/>}
          {activeTab === 'performance' && <Placeholder label="Performance Reports" />}
          {activeTab === 'cardFees' && <Placeholder label="Card Fees Reports" />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports; 