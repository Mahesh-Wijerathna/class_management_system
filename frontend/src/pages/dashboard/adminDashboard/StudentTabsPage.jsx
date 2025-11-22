import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import AdminDashboardSidebar from './AdminDashboardSidebar';
import { getUserPermissions } from '../../../api/rbac';
import { getUserData } from '../../../api/apiUtils';

const StudentTabsPage = () => {
  const [filteredSidebarSections, setFilteredSidebarSections] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const userData = sessionStorage.getItem('userData') || localStorage.getItem('userData');
        let userId = null;
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            userId = parsed.userid || parsed.id || userId;
          } catch (err) {
            console.error('Error parsing stored userData:', err);
          }
        } else {
          const user = getUserData();
          if (user) userId = user.userid || user.id || userId;
        }

        const userPermsResp = await getUserPermissions(userId);
        const perms = Array.isArray(userPermsResp) ? userPermsResp : (userPermsResp?.permissions || userPermsResp?.data || []);
        const filteredSections = AdminDashboardSidebar(perms);
        setFilteredSidebarSections(filteredSections);
      } catch (error) {
        console.error('Failed to fetch user permissions:', error);
        setFilteredSidebarSections(AdminDashboardSidebar([]));
      } finally {
        setPermissionsLoading(false);
      }
    };

    fetchUserPermissions();
  }, []);

  return (
    <>
      {permissionsLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading permissions...</span>
        </div>
      ) : (
        <DashboardLayout userRole="Administrator" sidebarItems={filteredSidebarSections}>
      <div className="w-full max-w-25xl bg-white rounded-lg shadow p-4 mx-auto">
        <div className="flex gap-4 mb-6 border-b">
          <NavLink
            to="/admin/students/enrollment"
            className={({ isActive }) => 
              `px-4 py-2 font-bold text-base focus:outline-none border-b-2 transition-colors ${
                isActive ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'
              }`
            }
          >
            Student Enrollment
          </NavLink>
          <NavLink
            to="/admin/students/physical"
            className={({ isActive }) => 
              `px-4 py-2 font-bold text-base focus:outline-none border-b-2 transition-colors ${
                isActive ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'
              }`
            }
          >
            Physical Student Registration
          </NavLink>
          <NavLink
            to="/admin/students/purchased-classes"
            className={({ isActive }) => 
              `px-4 py-2 font-bold text-base focus:outline-none border-b-2 transition-colors ${
                isActive ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'
              }`
            }
          >
            Purchased Classes
          </NavLink>
        </div>
        <div>
          <Outlet />
        </div>
        </div>
      </DashboardLayout>
      )}
    </>
  );
};

export default StudentTabsPage;
