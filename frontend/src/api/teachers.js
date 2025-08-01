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

// Teacher management functions
export const getAllTeachers = async () => {
  return await teacherApiGet('/routes.php/get_all_teachers');
};

export const getActiveTeachers = async () => {
  return await teacherApiGet('/routes.php/get_active_teachers');
};

export const getTeacherById = async (teacherId) => {
  return await teacherApiGet(`/routes.php/get_teacher_by_id?teacherId=${teacherId}`);
};

export const getTeacherForEdit = async (teacherId) => {
  return await teacherApiGet(`/routes.php/get_teacher_for_edit?teacherId=${teacherId}`);
};

export const getTeachersByStream = async (stream) => {
  return await teacherApiGet(`/routes.php/get_teachers_by_stream?stream=${stream}`);
};

export const getNextTeacherId = async () => {
  return await teacherApiGet('/routes.php/get_next_teacher_id');
};

export const createTeacher = async (teacherData) => {
  return await teacherApiPost('/routes.php/create_teacher', teacherData);
};

export const updateTeacher = async (teacherId, teacherData) => {
  return await teacherApiPut(`/routes.php/update_teacher/${teacherId}`, teacherData);
};

export const deleteTeacher = async (teacherId) => {
  return await teacherApiDelete(`/routes.php/delete_teacher/${teacherId}`);
};

export const teacherLogin = async (email, password) => {
  return await teacherApiPost('/routes.php/login', { email, password });
};

export const teacherLoginWithId = async (teacherId, password) => {
  return await teacherApiPost('/routes.php/login_with_teacher_id', { teacherId, password });
};

export const changeTeacherPassword = async (teacherId, currentPassword, newPassword) => {
  return await teacherApiPost('/routes.php/change_password', {
    teacherId,
    currentPassword,
    newPassword
  });
}; 