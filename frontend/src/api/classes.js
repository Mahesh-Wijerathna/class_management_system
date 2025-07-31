import { apiGet, apiPost, apiPut, apiDelete, handleApiError } from './apiUtils';

// Create a separate axios instance for class API calls
import axios from 'axios';

const classApi = axios.create({
  baseURL: 'http://localhost:8087',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

// Wrapper functions for class API calls
const classApiGet = async (endpoint) => {
  try {
    const response = await classApi.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Request failed');
  }
};

const classApiPost = async (endpoint, data) => {
  try {
    const response = await classApi.post(endpoint, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Request failed');
  }
};

const classApiPut = async (endpoint, data) => {
  try {
    const response = await classApi.put(endpoint, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Request failed');
  }
};

const classApiDelete = async (endpoint) => {
  try {
    const response = await classApi.delete(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Request failed');
  }
};

// Get all classes
export const getAllClasses = async () => {
  try {
    const response = await classApiGet('/routes.php/get_all_classes');
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get active classes only
export const getActiveClasses = async () => {
  try {
    const response = await classApiGet('/routes.php/get_active_classes');
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get class by ID
export const getClassById = async (id) => {
  try {
    const response = await classApiGet(`/routes.php/get_class_by_id?id=${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get classes by course type
export const getClassesByType = async (courseType) => {
  try {
    const response = await classApiGet(`/routes.php/get_classes_by_type?type=${courseType}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get classes by delivery method
export const getClassesByDeliveryMethod = async (deliveryMethod) => {
  try {
    const response = await classApiGet(`/routes.php/get_classes_by_delivery?method=${deliveryMethod}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Create new class
export const createClass = async (classData) => {
  try {
    const response = await classApiPost('/routes.php/', classData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Update class
export const updateClass = async (id, classData) => {
  try {
    const response = await classApiPut(`/routes.php/classes/${id}`, classData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Delete class
export const deleteClass = async (id) => {
  try {
    const response = await classApiDelete(`/routes.php/classes/${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
}; 