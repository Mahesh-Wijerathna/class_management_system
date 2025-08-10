import axios from 'axios';

const attendanceApi = axios.create({
  baseURL: process.env.REACT_APP_ATTENDANCE_API_BASE_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

const attendanceApiGet = async (endpoint) => {
  const response = await attendanceApi.get(endpoint);
  return response.data;
};

const attendanceApiPost = async (endpoint, data) => {
  const response = await attendanceApi.post(endpoint, data);
  return response.data;
};

const attendanceApiDelete = async (endpoint) => {
  const response = await attendanceApi.delete(endpoint);
  return response.data;
};

// Get all attendance records for a class
export const getAttendanceByClass = async (classId) => {
  if (!classId) return { records: [] };
  try {
    const data = await attendanceApiGet(`/?class_id=${encodeURIComponent(classId)}`);
    // Backend returns { records: [ { user_id, class_id, time_stamp } ] }
    return data;
  } catch (e) {
    // Normalize missing to empty
    return { records: [] };
  }
};

// Get attendance records for a user within a class
export const getAttendanceByUserInClass = async (userId, classId) => {
  if (!userId || !classId) return { records: [] };
  try {
    const data = await attendanceApiGet(`/?user_id=${encodeURIComponent(userId)}&class_id=${encodeURIComponent(classId)}`);
    return data;
  } catch (e) {
    return { records: [] };
  }
};

// Mark attendance (present) for a user in a class (timestamp set server-side)
export const markAttendance = async ({ userId, classId }) => {
  if (!userId || !classId) throw new Error('userId and classId are required');
  return await attendanceApiPost('/', { user_id: userId, class_id: classId });
};

// Delete old attendance records beyond a number of days
export const deleteOldAttendance = async (days = 30) => {
  return await attendanceApiDelete(`/?days=${encodeURIComponent(days)}`);
};


