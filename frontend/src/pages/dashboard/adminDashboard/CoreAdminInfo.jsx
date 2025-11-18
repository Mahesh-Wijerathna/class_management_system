import React, { useState, useEffect } from 'react';
import { FaIdCard, FaTrash } from 'react-icons/fa';
import BasicTable from '../../../components/BasicTable';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import AdminDashboardSidebar from './AdminDashboardSidebar';
import { getUserPermissions } from '../../../api/rbac';
import { getUserData } from '../../../api/apiUtils';

const CoreAdminInfo = () => {
  // Sidebar permissions state
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [filteredSidebarSections, setFilteredSidebarSections] = useState([]);
  const [coreAdmins, setCoreAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserPermissions = async () => {
      try {
        setPermissionsLoading(true);
        const stored = sessionStorage.getItem('userData') || localStorage.getItem('userData');
        let userId;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            userId = parsed.userid || parsed.userId || parsed.id;
          } catch (e) {
            // ignore
          }
        }

        if (!userId) {
          const user = getUserData();
          userId = user?.userid || user?.userId || user?.id;
        }

        const perms = await getUserPermissions(userId);
        setUserPermissions(perms || []);
        setFilteredSidebarSections(AdminDashboardSidebar(perms || []));
      } catch (err) {
        console.error('Failed to load user permissions for sidebar', err);
        setFilteredSidebarSections(AdminDashboardSidebar([]));
      } finally {
        setPermissionsLoading(false);
      }
    };

    loadUserPermissions();
  }, []);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8081/routes.php/users', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch admin data');
        }

        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        // Check if data has users array
        const users = data.users;
        if (!Array.isArray(users)) {
          console.error('Users data is not an array:', users);
          throw new Error('Invalid response format from server - users not found');
        }
        
        // Filter for admin role
        const admins = users.filter(user => user.role === 'admin').map(admin => ({
          adminId: admin.userid,
          name: admin.name || 'N/A',
          email: admin.email || 'N/A',
          phone: admin.phone || 'N/A',
          password: '********', // Masked for security
          role: admin.role
        }));

        setCoreAdmins(admins);
      } catch (err) {
        console.error('Error fetching admins:', err);
        setError('Failed to load admin details. Please try again.');
        // Fallback to localStorage if API fails
        const stored = localStorage.getItem('coreAdmins');
        if (stored) {
          setCoreAdmins(JSON.parse(stored));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);



  const handleDelete = async (adminId) => {
    try {
      const response = await fetch(`http://localhost:8081/routes.php/user/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete admin');
      }

      const result = await response.json();
      console.log('Delete result:', result);

      // Remove from local state
      setCoreAdmins(coreAdmins.filter(a => a.adminId !== adminId));
    } catch (error) {
      console.error('Error deleting admin:', error);
      // Could show error alert here
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="Administrator" sidebarItems={filteredSidebarSections}>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading admin details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="Administrator" sidebarItems={filteredSidebarSections}>
        <div className="p-6 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Core Admin Information</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={filteredSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Core Admin Information</h1>
        <p className="mb-6 text-gray-700">View, edit and delete core admin details.</p>
        <BasicTable
          columns={[
            {
              key: 'adminId',
              label: 'ID',
              render: (row) => (
                <span className="flex items-center gap-1"><FaIdCard className="inline mr-1 text-gray-500" />{row.adminId}</span>
              ),
            },
          ]}
          data={coreAdmins}
          actions={(row) => (
            <div className="flex gap-2">
              <button className="text-red-600 hover:underline" onClick={() => handleDelete(row.adminId)} title="Delete"><FaTrash /></button>
            </div>
          )}
          className="mb-6"
        />
      </div>
    </DashboardLayout>
  );
};

export default CoreAdminInfo;
