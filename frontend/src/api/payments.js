import { handleApiError } from './apiUtils';
import axios from 'axios';

const classApi = axios.create({
  baseURL: process.env.REACT_APP_CLASS_API_BASE_URL || 'http://localhost:8087',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

// Payment API functions
export const createPayment = async (paymentData) => {
  try {
    const response = await classApi.post('/routes.php/create_payment', paymentData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const processPayment = async (transactionId, paymentData = {}) => {
  try {
    const response = await classApi.post('/routes.php/process_payment', {
      transactionId,
      ...paymentData
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getPaymentByTransactionId = async (transactionId) => {
  try {
    const response = await classApi.get(`/routes.php/get_payment_by_transaction?transactionId=${transactionId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getStudentPayments = async (studentId) => {
  try {
    // Add cache-busting parameter to prevent browser caching
    const timestamp = Date.now();
    const response = await classApi.get(`/routes.php/get_student_payments?studentId=${studentId}&_t=${timestamp}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const generateInvoice = async (transactionId) => {
  try {
    const response = await classApi.get(`/routes.php/generate_invoice?transactionId=${transactionId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getPaymentStats = async (studentId) => {
  try {
    const response = await classApi.get(`/routes.php/get_payment_stats?studentId=${studentId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Payment utility functions
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(amount);
};

export const generateTransactionId = () => {
  return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9);
};

export const validatePaymentData = (paymentData) => {
  const errors = [];
  
  if (!paymentData.studentId) {
    errors.push('Student ID is required');
  }
  
  if (!paymentData.classId) {
    errors.push('Class ID is required');
  }
  
  if (!paymentData.amount || paymentData.amount <= 0) {
    errors.push('Valid amount is required');
  }
  
  if (!paymentData.paymentMethod) {
    errors.push('Payment method is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 