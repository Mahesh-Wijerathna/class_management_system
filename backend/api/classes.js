import { apiGet, apiPost, apiPut, apiDelete, handleApiError } from './apiUtils';

// =====================================================
// CLASS MANAGEMENT API FUNCTIONS
// =====================================================

// Get all classes with optional filters
export const getAllClasses = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        queryParams.append(key, filters[key]);
      }
    });
    
    const endpoint = `/routes.php/classes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiGet(endpoint);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch classes'));
  }
};

// Get active classes only
export const getActiveClasses = async () => {
  try {
    return await apiGet('/routes.php/classes?status=active');
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch active classes'));
  }
};

// Get class by ID with full details
export const getClassById = async (id) => {
  try {
    return await apiGet(`/routes.php/classes/${id}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch class details'));
  }
};

// Get classes by type (theory/revision)
export const getClassesByType = async (courseType) => {
  try {
    return await apiGet(`/routes.php/classes?courseType=${courseType}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch classes by type'));
  }
};

// Get classes by delivery method
export const getClassesByDeliveryMethod = async (deliveryMethod) => {
  try {
    return await apiGet(`/routes.php/classes?deliveryMethod=${deliveryMethod}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch classes by delivery method'));
  }
};

// Get classes by stream
export const getClassesByStream = async (stream) => {
  try {
    return await apiGet(`/routes.php/classes?stream=${stream}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch classes by stream'));
  }
};

// Get classes by teacher
export const getClassesByTeacher = async (teacherId) => {
  try {
    return await apiGet(`/routes.php/classes?teacherId=${teacherId}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch classes by teacher'));
  }
};

// Create new class
export const createClass = async (classData) => {
  try {
    return await apiPost('/routes.php/classes', classData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to create class'));
  }
};

// Update existing class
export const updateClass = async (id, classData) => {
  try {
    return await apiPut(`/routes.php/classes/${id}`, classData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to update class'));
  }
};

// Delete class
export const deleteClass = async (id) => {
  try {
    return await apiDelete(`/routes.php/classes/${id}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to delete class'));
  }
};

// Archive class (soft delete)
export const archiveClass = async (id) => {
  try {
    return await apiPut(`/routes.php/classes/${id}/archive`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to archive class'));
  }
};

// Activate class
export const activateClass = async (id) => {
  try {
    return await apiPut(`/routes.php/classes/${id}/activate`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to activate class'));
  }
};

// =====================================================
// ENROLLMENT MANAGEMENT API FUNCTIONS
// =====================================================

// Get enrollments for a class
export const getClassEnrollments = async (classId) => {
  try {
    return await apiGet(`/routes.php/classes/${classId}/enrollments`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch class enrollments'));
  }
};

// Get student enrollments
export const getStudentEnrollments = async (studentId) => {
  try {
    return await apiGet(`/routes.php/students/${studentId}/enrollments`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch student enrollments'));
  }
};

// Enroll student in class
export const enrollStudent = async (studentId, classId, enrollmentData = {}) => {
  try {
    return await apiPost('/routes.php/enrollments', {
      studentId,
      classId,
      ...enrollmentData
    });
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to enroll student'));
  }
};

// Update enrollment
export const updateEnrollment = async (enrollmentId, enrollmentData) => {
  try {
    return await apiPut(`/routes.php/enrollments/${enrollmentId}`, enrollmentData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to update enrollment'));
  }
};

// Drop enrollment
export const dropEnrollment = async (enrollmentId) => {
  try {
    return await apiPut(`/routes.php/enrollments/${enrollmentId}/drop`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to drop enrollment'));
  }
};

// =====================================================
// ATTENDANCE MANAGEMENT API FUNCTIONS
// =====================================================

// Get attendance for a class on a specific date
export const getClassAttendance = async (classId, date) => {
  try {
    return await apiGet(`/routes.php/classes/${classId}/attendance?date=${date}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch class attendance'));
  }
};

// Get student attendance
export const getStudentAttendance = async (studentId, classId = null, startDate = null, endDate = null) => {
  try {
    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return await apiGet(`/routes.php/students/${studentId}/attendance?${params.toString()}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch student attendance'));
  }
};

// Mark attendance
export const markAttendance = async (attendanceData) => {
  try {
    return await apiPost('/routes.php/attendance', attendanceData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to mark attendance'));
  }
};

// Update attendance
export const updateAttendance = async (attendanceId, attendanceData) => {
  try {
    return await apiPut(`/routes.php/attendance/${attendanceId}`, attendanceData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to update attendance'));
  }
};

// =====================================================
// PAYMENT MANAGEMENT API FUNCTIONS
// =====================================================

// Get payment history for enrollment
export const getPaymentHistory = async (enrollmentId) => {
  try {
    return await apiGet(`/routes.php/enrollments/${enrollmentId}/payments`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch payment history'));
  }
};

// Record payment
export const recordPayment = async (paymentData) => {
  try {
    return await apiPost('/routes.php/payments', paymentData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to record payment'));
  }
};

// Get payment tracking status
export const getPaymentTrackingStatus = async (enrollmentId) => {
  try {
    return await apiGet(`/routes.php/enrollments/${enrollmentId}/payment-tracking`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch payment tracking status'));
  }
};

// =====================================================
// STUDY MATERIALS API FUNCTIONS
// =====================================================

// Get study materials for a class
export const getClassMaterials = async (classId) => {
  try {
    return await apiGet(`/routes.php/classes/${classId}/materials`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch study materials'));
  }
};

// Upload study material
export const uploadMaterial = async (classId, materialData) => {
  try {
    return await apiPost(`/routes.php/classes/${classId}/materials`, materialData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to upload material'));
  }
};

// Delete study material
export const deleteMaterial = async (materialId) => {
  try {
    return await apiDelete(`/routes.php/materials/${materialId}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to delete material'));
  }
};

// =====================================================
// EXAM MANAGEMENT API FUNCTIONS
// =====================================================

// Get exams for a class
export const getClassExams = async (classId) => {
  try {
    return await apiGet(`/routes.php/classes/${classId}/exams`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch class exams'));
  }
};

// Create exam
export const createExam = async (classId, examData) => {
  try {
    return await apiPost(`/routes.php/classes/${classId}/exams`, examData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to create exam'));
  }
};

// Update exam
export const updateExam = async (examId, examData) => {
  try {
    return await apiPut(`/routes.php/exams/${examId}`, examData);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to update exam'));
  }
};

// Delete exam
export const deleteExam = async (examId) => {
  try {
    return await apiDelete(`/routes.php/exams/${examId}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to delete exam'));
  }
};

// =====================================================
// REPORTS AND ANALYTICS API FUNCTIONS
// =====================================================

// Get class statistics
export const getClassStatistics = async (classId) => {
  try {
    return await apiGet(`/routes.php/classes/${classId}/statistics`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch class statistics'));
  }
};

// Get attendance report
export const getAttendanceReport = async (classId, startDate, endDate) => {
  try {
    return await apiGet(`/routes.php/classes/${classId}/attendance-report?startDate=${startDate}&endDate=${endDate}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch attendance report'));
  }
};

// Get payment report
export const getPaymentReport = async (classId, startDate, endDate) => {
  try {
    return await apiGet(`/routes.php/classes/${classId}/payment-report?startDate=${startDate}&endDate=${endDate}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch payment report'));
  }
};

// Export class data
export const exportClassData = async (classId, format = 'csv') => {
  try {
    return await apiGet(`/routes.php/classes/${classId}/export?format=${format}`);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to export class data'));
  }
}; 