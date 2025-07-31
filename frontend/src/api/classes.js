import { handleApiError } from './apiUtils';
import axios from 'axios';

const classApi = axios.create({
  baseURL: process.env.REACT_APP_CLASS_API_BASE_URL || 'http://localhost:8087',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

const classApiGet = async (endpoint) => {
  try {
    const response = await classApi.get(endpoint);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const classApiPost = async (endpoint, data) => {
  try {
    const response = await classApi.post(endpoint, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const classApiPut = async (endpoint, data) => {
  try {
    const response = await classApi.put(endpoint, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const classApiDelete = async (endpoint) => {
  try {
    const response = await classApi.delete(endpoint);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAllClasses = async () => {
  return await classApiGet('/routes.php/get_all_classes');
};

export const getActiveClasses = async () => {
  return await classApiGet('/routes.php/get_active_classes');
};

export const getClassById = async (id) => {
  return await classApiGet(`/routes.php/get_class_by_id?id=${id}`);
};

export const getClassesByType = async (courseType) => {
  return await classApiGet(`/routes.php/get_classes_by_type?courseType=${courseType}`);
};

export const getClassesByDeliveryMethod = async (deliveryMethod) => {
  return await classApiGet(`/routes.php/get_classes_by_delivery?deliveryMethod=${deliveryMethod}`);
};

export const createClass = async (classData) => {
  return await classApiPost('/routes.php/', classData);
};

export const updateClass = async (id, classData) => {
  return await classApiPut(`/routes.php/classes/${id}`, classData);
};

export const deleteClass = async (id) => {
  return await classApiDelete(`/routes.php/classes/${id}`);
}; 