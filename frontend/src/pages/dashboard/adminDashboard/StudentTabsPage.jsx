import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import AdminDashboardSidebar, { adminSidebarSections } from './AdminDashboardSidebar';
import { cashierSidebarSections } from '../cashierDashboard/CashierDashboardSidebar';
import { getUserPermissions } from '../../../api/rbac';
import { getUserData, logout as authLogout } from '../../../api/apiUtils';

const StudentTabsPage = () => {
  const [user, setUser] = useState(null);
  const [filteredSidebarSections, setFilteredSidebarSections] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    try {
      setUser(getUserData());
    } catch (err) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const stored = sessionStorage.getItem('userData') || localStorage.getItem('userData');
        let userId;

        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            userId = parsed.userid || parsed.id;
          } catch (err) {
            console.error('Error parsing stored userData:', err);
          }
        } else {
          const fallbackUser = getUserData();
          userId = fallbackUser?.userid || fallbackUser?.id;
        }

        const userPermsResp = await getUserPermissions(userId);
        const perms = Array.isArray(userPermsResp)
          ? userPermsResp
          : userPermsResp?.permissions || userPermsResp?.data || [];
        setFilteredSidebarSections(AdminDashboardSidebar(perms));
      } catch (error) {
        console.error('Failed to fetch user permissions:', error);
        setFilteredSidebarSections(AdminDashboardSidebar([]));
      } finally {
        setPermissionsLoading(false);
      }
    };

    fetchUserPermissions();
  }, []);

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch (err) {
      // ignore
    }
    window.location.href = '/login';
  };

  const isCashier = user?.role === 'cashier';
  const base = isCashier ? '/cashier' : '/admin';

  if (!isCashier && permissionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading permissions...</span>
      </div>
    );
  }

  const layoutProps = isCashier
    ? {
        userRole: 'Cashier',
        sidebarItems: cashierSidebarSections,
        onLogout: handleLogout,
        customTitle: 'TCMS',
        customSubtitle: `Cashier Dashboard - ${user?.name || 'Cashier'}`
      }
    : {
        userRole: 'Administrator',
        sidebarItems: filteredSidebarSections.length ? filteredSidebarSections : adminSidebarSections,
        onLogout: handleLogout
      };

  return (
    <DashboardLayout {...layoutProps}>
      <div className="w-full max-w-25xl bg-white rounded-lg shadow p-4 mx-auto">
        <div className="flex gap-4 mb-6 border-b">
          <NavLink
            to={`${base}/students/enrollment`}
            className={({ isActive }) =>
              `px-4 py-2 font-bold text-base focus:outline-none border-b-2 transition-colors ${
                isActive ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'
              }`
            }
          >
            Student Enrollment
          </NavLink>
          <NavLink
            to={`${base}/students/purchased-classes`}
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
  );
};

export default StudentTabsPage;
