import { handleApiError } from './apiUtils';
import axios from 'axios';

const teacherApi = axios.create({
  baseURL: process.env.REACT_APP_TEACHER_API_BASE_URL || 'http://localhost:8088',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

// Auth API for centralized authentication
const authApi = axios.create({
  baseURL: process.env.REACT_APP_AUTH_API_BASE_URL || 'http://localhost:8081',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

const teacherApiGet = async (endpoint) => {
  try {
    const response = await teacherApi.get(endpoint);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const teacherApiPost = async (endpoint, data) => {
  try {
    const response = await teacherApi.post(endpoint, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const teacherApiPut = async (endpoint, data) => {
  try {
    const response = await teacherApi.put(endpoint, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const teacherApiDelete = async (endpoint) => {
  try {
    const response = await teacherApi.delete(endpoint);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Auth API functions for centralized authentication
const authApiPost = async (endpoint, data) => {
  try {
    const response = await authApi.post(endpoint, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const authApiGet = async (endpoint) => {
  try {
    const response = await authApi.get(endpoint);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const authApiPut = async (endpoint, data) => {
  try {
    const response = await authApi.put(endpoint, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const authApiDelete = async (endpoint) => {
  try {
    const response = await authApi.delete(endpoint);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Teacher management functions
export const getAllTeachers = async () => {
  try {
    const response = await authApi.get('/routes.php/teachers');
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch teachers'));
  }
};

export const getActiveTeachers = async () => {
  return await teacherApiGet('/routes.php/get_active_teachers');
};

export const getTeacherById = async (teacherId) => {
  return await teacherApiGet(`/routes.php/get_teacher_by_id?teacherId=${teacherId}`);
};

export const getTeacherForEdit = async (teacherId) => {
  try {
    const response = await authApi.get(`/routes.php/teacher/${teacherId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch teacher details'));
  }
};

export const getTeachersByStream = async (stream) => {
  return await teacherApiGet(`/routes.php/get_teachers_by_stream?stream=${stream}`);
};

export const getNextTeacherId = async () => {
  return await teacherApiGet('/routes.php/get_next_teacher_id');
};

// Updated to use centralized auth backend
export const createTeacher = async (teacherData) => {
  try {
    const response = await authApi.post('/routes.php/teacher', teacherData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to create teacher'));
  }
};

export const updateTeacher = async (teacherId, teacherData) => {
  try {
    const response = await authApi.put(`/routes.php/teacher/${teacherId}`, teacherData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to update teacher'));
  }
};

export const updateTeacherDetails = async (teacherId, teacherData) => {
  try {
    const response = await teacherApi.put(`/routes.php/update_teacher/${teacherId}`, teacherData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to update teacher details'));
  }
};

export const deleteTeacher = async (teacherId) => {
  try {
    const response = await authApi.delete(`/routes.php/teacher/${teacherId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to delete teacher'));
  }
};

export const deleteTeacherFromTeacherBackend = async (teacherId) => {
  try {
    const response = await teacherApi.delete(`/routes.php/delete_teacher/${teacherId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to delete teacher from teacher backend'));
  }
};

// Updated to use centralized auth backend
export const teacherLogin = async (email, password) => {
  try {
    const response = await authApi.post('/routes.php/teacher/login-email', { email, password });
    const data = response.data;
    
    // If login is successful, map the teacher data to the expected user format
    if (data.success && data.teacher) {
      return {
        success: true,
        message: data.message,
        user: data.teacher, // Map teacher data to user field
        accessToken: data.accessToken || null,
        refreshToken: data.refreshToken || null
      };
    }
    
    return data;
  } catch (error) {
    throw new Error(handleApiError(error, 'Teacher login failed'));
  }
};

// Updated to use centralized auth backend
export const teacherLoginWithId = async (teacherId, password) => {
  try {
    const response = await authApi.post('/routes.php/teacher/login', { teacherId, password });
    const data = response.data;
    
    // If login is successful, map the teacher data to the expected user format
    if (data.success && data.teacher) {
      return {
        success: true,
        message: data.message,
        user: data.teacher, // Map teacher data to user field
        accessToken: data.accessToken || null,
        refreshToken: data.refreshToken || null
      };
    }
    
    return data;
  } catch (error) {
    throw new Error(handleApiError(error, 'Teacher login failed'));
  }
};

export const changeTeacherPassword = async (teacherId, currentPassword, newPassword) => {
  return await teacherApiPost('/routes.php/change_password', {
    teacherId,
    currentPassword,
    newPassword
  });
};

// New centralized auth functions
export const getAllTeachersFromAuth = async () => {
  return await authApiGet('/routes.php/teachers');
};

export const getTeacherFromAuth = async (teacherId) => {
  return await authApiGet(`/routes.php/teacher/${teacherId}`);
};

export const teacherForgotPasswordOtp = async (teacherId) => {
  return await authApiPost('/routes.php/teacher/forgot-password-otp', { userid: teacherId });
}; 