import axios from 'axios';

const RBAC_BASE_URL = process.env.REACT_APP_RBAC_BASE_URL || 'http://localhost:8094';
const AUTH_BASE_URL = process.env.REACT_APP_AUTH_BASE_URL || 'http://localhost:8081';

const api = axios.create({
    baseURL: RBAC_BASE_URL,
});

// Add request interceptor to include auth token in headers
api.interceptors.request.use(
    (config) => {
        // Try to get token from localStorage first, then sessionStorage
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        console.log('🔐 RBAC API Request:', config.url);
        console.log('🔑 Token found:', token ? 'YES' : 'NO');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('✅ Authorization header set');
        } else {
            console.warn('⚠️ No auth token found in storage');
        }
        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// ==================== AUTHENTICATION ====================

export const login = async (userid, password) => {
    const response = await axios.post(`${AUTH_BASE_URL}/routes.php/login`, {
        userid,
        password
    });
    return response.data;
};

export const validateToken = async (token) => {
    const response = await axios.post(`${AUTH_BASE_URL}/routes.php/validate_token`, {
        token
    });
    return response.data;
};

// ==================== HEALTH CHECK ====================

export const getHealthCheck = async () => {
    const response = await axios.get(`${RBAC_BASE_URL}/`);
    return response.data;
};

// ==================== PERMISSIONS ====================

export const createPermission = async (permissionData) => {
    const response = await api.post('/permissions', permissionData);
    return response.data;
};

export const getAllPermissions = async () => {
    const response = await api.get('/permissions');
    return response.data;
};

export const getPermissionById = async (permissionId) => {
    const response = await api.get(`/permissions/${permissionId}`);
    return response.data;
};

export const updatePermission = async (permissionId, permissionData) => {
    const response = await api.put(`/permissions/${permissionId}`, permissionData);
    return response.data;
};

export const deletePermission = async (permissionId) => {
    const response = await api.delete(`/permissions/${permissionId}`);
    return response.data;
};

// ==================== ROLES ====================

export const createRole = async (roleData) => {
    const response = await api.post('/roles', roleData);
    return response.data;
};

export const getAllRoles = async () => {
    const response = await api.get('/roles');
    return response.data;
};

export const getRoleById = async (roleId) => {
    const response = await api.get(`/roles/${roleId}`);
    return response.data;
};

export const updateRole = async (roleId, roleData) => {
    const response = await api.put(`/roles/${roleId}`, roleData);
    return response.data;
};

export const deleteRole = async (roleId) => {
    const response = await api.delete(`/roles/${roleId}`);
    return response.data;
};

export const getRolePermissions = async (roleId) => {
    const response = await api.get(`/roles/${roleId}/permissions`);
    return response.data;
};

export const assignPermissionToRole = async (roleId, permissionId) => {
    const response = await api.post(`/roles/${roleId}/permissions/${permissionId}`);
    return response.data;
};

export const revokePermissionFromRole = async (roleId, permissionId) => {
    const response = await api.delete(`/roles/${roleId}/permissions/${permissionId}`);
    return response.data;
};

export const getRolePermissionsByName = async (roleName) => {
    const response = await api.get(`/roles/name/${encodeURIComponent(roleName)}/permissions`);
    return response.data;
};

export const getUsersByRole = async (roleId) => {
    const response = await api.get(`/roles/${roleId}/users`);
    return response.data;
};

// ==================== USERS ====================

export const getAllUsers = async () => {
    const response = await api.get('/users');
    return response.data;
};

export const getUserById = async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
};

export const getUserRoles = async (userId) => {
    const response = await api.get(`/users/${userId}/roles`);
    return response.data;
};

export const getUserPermissions = async (userId) => {
    const response = await api.get(`/users/${userId}/permissions`);
    return response.data;
};

export const assignRoleToUser = async (userId, roleId) => {
    const response = await api.post(`/users/${userId}/roles/${roleId}`);
    return response.data;
};

export const revokeRoleFromUser = async (userId, roleId) => {
    const response = await api.delete(`/users/${userId}/roles/${roleId}`);
    return response.data;
};

export const getUserRoleHistory = async (userId) => {
    const response = await api.get(`/users/${userId}/roles/history`);
    return response.data;
};

export default api;
