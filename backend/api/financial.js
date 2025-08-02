import { apiGet, apiPost, apiPut, apiDelete, handleApiError } from './apiUtils';

// =====================================================
// FINANCIAL RECORDS MANAGEMENT API FUNCTIONS
// =====================================================

// Get all financial records with optional filters
export const getAllFinancialRecords = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        queryParams.append(key, filters[key]);
      }
    });
    
    const endpoint = `/routes.php/financial-records${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiGet(endpoint);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch financial records'));
  }
};

// Get financial records by type (income/expense)
export const getFinancialRecordsByType = async (type, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({ type, ...filters });
    return await apiGet(`/routes.php/financial-records?${queryParams.toString()}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch financial records by type'));
  }
};

// Get financial records by date range
export const getFinancialRecordsByDateRange = async (startDate, endDate, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      ...filters
    });
    return await apiGet(`/routes.php/financial-records?${queryParams.toString()}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch financial records by date range'));
  }
};

// Get financial record by ID
export const getFinancialRecordById = async (id) => {
  try {
    return await apiGet(`/routes.php/financial-records/${id}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch financial record'));
  }
};

// Create new financial record
export const createFinancialRecord = async (recordData) => {
  try {
    return await apiPost('/routes.php/financial-records', recordData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to create financial record'));
  }
};

// Update financial record
export const updateFinancialRecord = async (id, recordData) => {
  try {
    return await apiPut(`/routes.php/financial-records/${id}`, recordData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to update financial record'));
  }
};

// Delete financial record
export const deleteFinancialRecord = async (id) => {
  try {
    return await apiDelete(`/routes.php/financial-records/${id}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to delete financial record'));
  }
};

// =====================================================
// PAYMENT MANAGEMENT API FUNCTIONS
// =====================================================

// Get all payments with optional filters
export const getAllPayments = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        queryParams.append(key, filters[key]);
      }
    });
    
    const endpoint = `/routes.php/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiGet(endpoint);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch payments'));
  }
};

// Get payment by ID
export const getPaymentById = async (id) => {
  try {
    return await apiGet(`/routes.php/payments/${id}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch payment'));
  }
};

// Get payments by enrollment
export const getPaymentsByEnrollment = async (enrollmentId) => {
  try {
    return await apiGet(`/routes.php/enrollments/${enrollmentId}/payments`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch enrollment payments'));
  }
};

// Get payments by student
export const getPaymentsByStudent = async (studentId) => {
  try {
    return await apiGet(`/routes.php/students/${studentId}/payments`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch student payments'));
  }
};

// Get payments by class
export const getPaymentsByClass = async (classId) => {
  try {
    return await apiGet(`/routes.php/classes/${classId}/payments`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch class payments'));
  }
};

// Record new payment
export const recordPayment = async (paymentData) => {
  try {
    return await apiPost('/routes.php/payments', paymentData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to record payment'));
  }
};

// Update payment
export const updatePayment = async (id, paymentData) => {
  try {
    return await apiPut(`/routes.php/payments/${id}`, paymentData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to update payment'));
  }
};

// Delete payment
export const deletePayment = async (id) => {
  try {
    return await apiDelete(`/routes.php/payments/${id}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to delete payment'));
  }
};

// Process payment (mark as completed)
export const processPayment = async (id, paymentData = {}) => {
  try {
    return await apiPut(`/routes.php/payments/${id}/process`, paymentData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to process payment'));
  }
};

// Refund payment
export const refundPayment = async (id, refundData) => {
  try {
    return await apiPut(`/routes.php/payments/${id}/refund`, refundData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to refund payment'));
  }
};

// =====================================================
// ENROLLMENT PAYMENT TRACKING API FUNCTIONS
// =====================================================

// Get payment tracking status for enrollment
export const getPaymentTrackingStatus = async (enrollmentId) => {
  try {
    return await apiGet(`/routes.php/enrollments/${enrollmentId}/payment-tracking`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch payment tracking status'));
  }
};

// Update payment tracking settings
export const updatePaymentTracking = async (enrollmentId, trackingData) => {
  try {
    return await apiPut(`/routes.php/enrollments/${enrollmentId}/payment-tracking`, trackingData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to update payment tracking'));
  }
};

// Get overdue payments
export const getOverduePayments = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams({ status: 'overdue', ...filters });
    return await apiGet(`/routes.php/payments?${queryParams.toString()}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch overdue payments'));
  }
};

// Get pending payments
export const getPendingPayments = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams({ status: 'pending', ...filters });
    return await apiGet(`/routes.php/payments?${queryParams.toString()}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch pending payments'));
  }
};

// =====================================================
// FINANCIAL REPORTS API FUNCTIONS
// =====================================================

// Get financial summary
export const getFinancialSummary = async (startDate, endDate) => {
  try {
    return await apiGet(`/routes.php/financial-summary?startDate=${startDate}&endDate=${endDate}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch financial summary'));
  }
};

// Get income vs expense report
export const getIncomeExpenseReport = async (startDate, endDate, groupBy = 'month') => {
  try {
    return await apiGet(`/routes.php/financial-reports/income-expense?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch income vs expense report'));
  }
};

// Get payment collection report
export const getPaymentCollectionReport = async (startDate, endDate) => {
  try {
    return await apiGet(`/routes.php/financial-reports/payment-collection?startDate=${startDate}&endDate=${endDate}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch payment collection report'));
  }
};

// Get outstanding payments report
export const getOutstandingPaymentsReport = async () => {
  try {
    return await apiGet('/routes.php/financial-reports/outstanding-payments');
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch outstanding payments report'));
  }
};

// Get class-wise financial report
export const getClassWiseFinancialReport = async (startDate, endDate) => {
  try {
    return await apiGet(`/routes.php/financial-reports/class-wise?startDate=${startDate}&endDate=${endDate}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch class-wise financial report'));
  }
};

// Get teacher-wise financial report
export const getTeacherWiseFinancialReport = async (startDate, endDate) => {
  try {
    return await apiGet(`/routes.php/financial-reports/teacher-wise?startDate=${startDate}&endDate=${endDate}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch teacher-wise financial report'));
  }
};

// =====================================================
// FINANCIAL ANALYTICS API FUNCTIONS
// =====================================================

// Get revenue analytics
export const getRevenueAnalytics = async (period = 'monthly', startDate, endDate) => {
  try {
    return await apiGet(`/routes.php/financial-analytics/revenue?period=${period}&startDate=${startDate}&endDate=${endDate}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch revenue analytics'));
  }
};

// Get expense analytics
export const getExpenseAnalytics = async (period = 'monthly', startDate, endDate) => {
  try {
    return await apiGet(`/routes.php/financial-analytics/expenses?period=${period}&startDate=${startDate}&endDate=${endDate}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch expense analytics'));
  }
};

// Get profit/loss analytics
export const getProfitLossAnalytics = async (period = 'monthly', startDate, endDate) => {
  try {
    return await apiGet(`/routes.php/financial-analytics/profit-loss?period=${period}&startDate=${startDate}&endDate=${endDate}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch profit/loss analytics'));
  }
};

// Get payment trends
export const getPaymentTrends = async (period = 'monthly', startDate, endDate) => {
  try {
    return await apiGet(`/routes.php/financial-analytics/payment-trends?period=${period}&startDate=${startDate}&endDate=${endDate}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch payment trends'));
  }
};

// =====================================================
// EXPORT AND UTILITY API FUNCTIONS
// =====================================================

// Export financial data
export const exportFinancialData = async (format = 'csv', filters = {}) => {
  try {
    const queryParams = new URLSearchParams({ format, ...filters });
    return await apiGet(`/routes.php/financial-export?${queryParams.toString()}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to export financial data'));
  }
};

// Generate financial statement
export const generateFinancialStatement = async (type, startDate, endDate) => {
  try {
    return await apiGet(`/routes.php/financial-statements/${type}?startDate=${startDate}&endDate=${endDate}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to generate financial statement'));
  }
};

// Get financial dashboard data
export const getFinancialDashboardData = async () => {
  try {
    return await apiGet('/routes.php/financial-dashboard');
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch financial dashboard data'));
  }
};

// =====================================================
// NOTIFICATION AND ALERT API FUNCTIONS
// =====================================================

// Get payment alerts
export const getPaymentAlerts = async () => {
  try {
    return await apiGet('/routes.php/financial-alerts');
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch payment alerts'));
  }
};

// Mark alert as read
export const markAlertAsRead = async (alertId) => {
  try {
    return await apiPut(`/routes.php/financial-alerts/${alertId}/read`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to mark alert as read'));
  }
};

// Send payment reminder
export const sendPaymentReminder = async (enrollmentId, reminderData = {}) => {
  try {
    return await apiPost(`/routes.php/enrollments/${enrollmentId}/payment-reminder`, reminderData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to send payment reminder'));
  }
}; 