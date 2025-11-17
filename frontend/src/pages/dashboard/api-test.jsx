import React, { useState } from 'react';
import * as rbacApi from '../../api/rbac';

const ApiTest = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');

  const addResult = (name, status, data) => {
    const result = {
      name,
      status,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setResults(prev => [...prev, result]);
    console.log(`[${result.timestamp}] ${name}:`, { status, data });
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      console.log('=== Starting API Tests ===');

      // 1. Login
      const loginData = await rbacApi.login('A002', 'Abc@1234');
      addResult('Login', 200, loginData);
      
      if (loginData.success && loginData.accessToken) {
        const authToken = loginData.accessToken;
        const currentUserId = loginData.user?.userid || 'A002';
        
        setToken(authToken);
        setUserId(currentUserId);
        
        // Store token in localStorage for axios interceptor
        localStorage.setItem('authToken', authToken);

        // 2. Validate Token
        const validateData = await rbacApi.validateToken(authToken);
        addResult('Validate Token', 200, validateData);

        // 3. Health Check
        const healthData = await rbacApi.getHealthCheck();
        addResult('Health Check', 200, healthData);

        // 4. Create Permission
        const createPermData = await rbacApi.createPermission({
          name: 'test_permission',
          target_user_role: 'admin',
          description: 'Test permission from API test'
        });
        addResult('Create Permission', 201, createPermData);
        const permissionId = createPermData.permission?.id || 1;

        // 5. Get All Permissions
        const getPermsData = await rbacApi.getAllPermissions();
        addResult('Get All Permissions', 200, getPermsData);

        // 6. Get Permission by ID
        const getPermData = await rbacApi.getPermissionById(permissionId);
        addResult('Get Permission by ID', 200, getPermData);

        // 7. Update Permission
        const updatePermData = await rbacApi.updatePermission(permissionId, {
          name: 'test_permission_updated',
          target_user_role: 'admin',
          description: 'Updated test permission'
        });
        addResult('Update Permission', 200, updatePermData);

        // 8. Create Role
        const createRoleData = await rbacApi.createRole({
          name: 'test_role',
          description: 'Test role from API test',
          permission_ids: [permissionId]
        });
        addResult('Create Role', 201, createRoleData);
        const roleId = createRoleData.role?.id || 1;

        // 9. Get All Roles
        const getRolesData = await rbacApi.getAllRoles();
        addResult('Get All Roles', 200, getRolesData);

        // 10. Get Role by ID
        const getRoleData = await rbacApi.getRoleById(roleId);
        addResult('Get Role by ID', 200, getRoleData);

        // 11. Get Role Permissions
        const getRolePermsData = await rbacApi.getRolePermissions(roleId);
        addResult('Get Role Permissions', 200, getRolePermsData);

        // 12. Assign Permission to Role
        const assignPermData = await rbacApi.assignPermissionToRole(roleId, permissionId);
        addResult('Assign Permission to Role', 200, assignPermData);

        // 13. Get All Users
        const getUsersData = await rbacApi.getAllUsers();
        addResult('Get All Users', 200, getUsersData);

        // 14. Get User by ID
        const getUserData = await rbacApi.getUserById(currentUserId);
        addResult('Get User by ID', 200, getUserData);

        // 15. Get User Roles
        const getUserRolesData = await rbacApi.getUserRoles(currentUserId);
        addResult('Get User Roles', 200, getUserRolesData);

        // 16. Get User Permissions
        const getUserPermsData = await rbacApi.getUserPermissions(currentUserId);
        addResult('Get User Permissions', 200, getUserPermsData);

        // 17. Assign Role to User
        const assignRoleData = await rbacApi.assignRoleToUser(currentUserId, roleId);
        addResult('Assign Role to User', 201, assignRoleData);

        // 18. Revoke Role from User
        const revokeRoleData = await rbacApi.revokeRoleFromUser(currentUserId, roleId);
        addResult('Revoke Role from User', 200, revokeRoleData);

        // 19. Update Role
        const updateRoleData = await rbacApi.updateRole(roleId, {
          name: 'test_role_updated',
          description: 'Updated test role',
          permission_ids: [permissionId]
        });
        addResult('Update Role', 200, updateRoleData);

        // 20. Revoke Permission from Role
        const revokePermData = await rbacApi.revokePermissionFromRole(roleId, permissionId);
        addResult('Revoke Permission from Role', 200, revokePermData);

        // 21. Delete Role
        const deleteRoleData = await rbacApi.deleteRole(roleId);
        addResult('Delete Role', 200, deleteRoleData);

        // 22. Delete Permission
        const deletePermData = await rbacApi.deletePermission(permissionId);
        addResult('Delete Permission', 200, deletePermData);

        console.log('=== API Tests Completed ===');
      } else {
        console.error('Login failed:', loginData);
        addResult('Login Failed', 'Error', loginData);
      }
    } catch (error) {
      console.error('Error running tests:', error);
      addResult('Error', 'Failed', { 
        error: error.message,
        response: error.response?.data
      });
    } finally {
      setLoading(false);
      localStorage.removeItem('authToken'); // Clean up
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>RBAC API Test Suite</h1>
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runAllTests} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Running Tests...' : 'Run All API Tests'}
        </button>
        {token && (
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            <strong>Token:</strong> {token.substring(0, 50)}...
            <br />
            <strong>User ID:</strong> {userId}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {results.map((result, index) => (
          <div
            key={index}
            style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: result.status >= 200 && result.status < 300 ? '#e8f5e9' : '#ffebee'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <strong>{result.name}</strong>
              <span style={{ 
                color: result.status >= 200 && result.status < 300 ? 'green' : 'red',
                fontWeight: 'bold'
              }}>
                {result.status}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {result.timestamp}
            </div>
            <pre style={{ 
              fontSize: '11px', 
              overflow: 'auto', 
              maxHeight: '150px',
              backgroundColor: '#f5f5f5',
              padding: '5px',
              borderRadius: '3px',
              marginTop: '5px'
            }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiTest;
