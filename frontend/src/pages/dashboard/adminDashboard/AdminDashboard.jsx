import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from '././AdminDashboardSidebar';
import { getCurrentUserPermissions, filterSidebarByPermissions, clearPermissionsCache } from '../../../utils/permissionChecker';

const AdminDashboard = () => {
  const [filteredSidebarSections, setFilteredSidebarSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserPermissions = async () => {
      try {
        setError(null);

        // Get current user ID from stored user data
        const userData = sessionStorage.getItem('userData') || localStorage.getItem('userData');
        let userId = 'A002'; // Default admin user from database

        if (userData) {
          try {
            const user = JSON.parse(userData);
            userId = user.userid || userId;
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }

        console.log('Fetching permissions for user:', userId);

        // Get user permissions
        const userPermissions = await getCurrentUserPermissions(userId);

        console.log('User permissions:', userPermissions);

        // Filter sidebar sections based on permissions
        const filteredSections = filterSidebarByPermissions(adminSidebarSections, userPermissions);

        console.log('Filtered sidebar sections:', filteredSections);

        setFilteredSidebarSections(filteredSections);
      } catch (error) {
        console.error('Failed to load user permissions:', error);
        setError(error.message);

        // Fallback: show all sections if permission loading fails
        console.log('Using fallback: showing all sidebar sections');
        setFilteredSidebarSections(adminSidebarSections);
      } finally {
        setLoading(false);
      }
    };

    loadUserPermissions();
  }, []);

  // Clear cache on component unmount
  useEffect(() => {
    return () => {
      clearPermissionsCache();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Fetching user permissions</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      userRole="Administrator"
      sidebarItems={filteredSidebarSections}
    >
      {error && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <strong>Warning:</strong> Permission loading failed ({error}). Showing all menu items as fallback.
        </div>
      )}
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