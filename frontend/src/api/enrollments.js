import axios from 'axios';

// Create axios instance for class service
const classApi = axios.create({
  baseURL: 'http://localhost:8087/routes.php',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get all enrollments for a student
export const getStudentEnrollments = async (studentId) => {
  try {
    const response = await classApi.get(`/get_student_enrollments?studentId=${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch enrollments',
      data: []
    };
  }
};

// Create a new enrollment
export const createEnrollment = async (enrollmentData) => {
  try {
    const response = await classApi.post('/create_enrollment', enrollmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create enrollment'
    };
  }
};

// Update enrollment
export const updateEnrollment = async (enrollmentId, updateData) => {
  try {
    const response = await classApi.post('/update_enrollment', {
      id: enrollmentId,
      ...updateData
    });
    return response.data;
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update enrollment'
    };
  }
};

// Delete enrollment
export const dropEnrollment = async (enrollmentId) => {
  try {
    const response = await classApi.post('/delete_enrollment', {
      id: enrollmentId
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete enrollment'
    };
  }
};

// Mark attendance for a class
export const markAttendance = async (classId, studentId, attendanceData) => {
  try {
    const response = await classApi.post('/mark_attendance', {
      classId,
      studentId,
      attendanceData
    });
    return response.data;
  } catch (error) {
    console.error('Error marking attendance:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to mark attendance'
    };
  }
};

// Request forget card
export const requestForgetCard = async (classId, studentId) => {
  try {
    const response = await classApi.post('/request_forget_card', {
      classId,
      studentId
    });
    return response.data;
  } catch (error) {
    console.error('Error requesting forget card:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to request forget card'
    };
  }
};

// Request late payment
export const requestLatePayment = async (classId, studentId) => {
  try {
    const response = await classApi.post('/request_late_payment', {
      classId,
      studentId
    });
    return response.data;
  } catch (error) {
    console.error('Error requesting late payment:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to request late payment'
    };
  }
};

// Utility function to convert enrollment data to MyClasses format
export const convertEnrollmentToMyClass = (enrollment) => {
  // Parse payment tracking data from database
  let paymentTracking = { enabled: false, freeDays: 7 };
  if (enrollment.payment_tracking) {
    try {
      const parsedTracking = JSON.parse(enrollment.payment_tracking);
      paymentTracking = {
        enabled: parsedTracking.enabled || false,
        freeDays: enrollment.payment_tracking_free_days || 7,
        active: parsedTracking.active || true
      };
    } catch (e) {
      // If parsing fails, use default values
      paymentTracking = {
        enabled: false,
        freeDays: enrollment.payment_tracking_free_days || 7,
        active: true
      };
    }
  }

  return {
    id: enrollment.class_id,
    className: enrollment.class_name,
    subject: enrollment.subject,
    teacher: enrollment.teacher,
    stream: enrollment.stream,
    deliveryMethod: enrollment.delivery_method,
    courseType: enrollment.course_type,
    fee: enrollment.fee,
    maxStudents: enrollment.max_students,
    status: enrollment.class_status,
    schedule: enrollment.schedule,
    zoomLink: enrollment.zoom_link,
    description: enrollment.description,
    image: enrollment.image,
    paymentStatus: enrollment.payment_status,
    paymentMethod: enrollment.payment_method,
    amountPaid: enrollment.amount_paid,
    nextPaymentDate: enrollment.next_payment_date,
    attendance: enrollment.attendance_data ? JSON.parse(enrollment.attendance_data) : [],
    paymentHistory: enrollment.payment_history_details ? 
      enrollment.payment_history_details.split('|').map(payment => {
        try {
          return JSON.parse(payment);
        } catch (e) {
          return null;
        }
      }).filter(payment => payment !== null) : 
      (enrollment.payment_history ? JSON.parse(enrollment.payment_history) : []),
    forgetCardRequested: enrollment.forget_card_requested === '1',
    latePaymentRequested: enrollment.late_payment_requested === '1',
    enrollmentDate: enrollment.enrollment_date,
    purchaseDate: enrollment.enrollment_date,
    currentStudents: 1, // Default for now
    hasExams: false, // Default for now
    hasTutes: false, // Default for now
    // Payment tracking configuration from class
    paymentTracking: paymentTracking,
    paymentTrackingFreeDays: enrollment.payment_tracking_free_days || 7,
    // Add student card information (will be populated by frontend)
    studentCard: null,
    cardInfo: null,
    cardStatus: null,
    cardValidity: null
  };
}; 