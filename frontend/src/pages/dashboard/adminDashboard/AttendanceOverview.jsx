import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import CustomButton from '../../../components/CustomButton';
import { FaQrcode, FaBarcode, FaVideo, FaMapMarkerAlt, FaUsers, FaCalendar, FaClock, FaEye, FaEdit, FaDownload } from 'react-icons/fa';
import { getAttendanceByClass, markAttendance } from '../../../api/attendance';
import { getAllClasses } from '../../../api/classes';

import BarcodeScanner from '../../../components/BarcodeScanner';

// Get all classes from localStorage
const getClassList = () => {
  try {
    const stored = localStorage.getItem('classes');
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

// Get enrollments from localStorage
const getEnrollments = () => {
  try {
    const stored = localStorage.getItem('enrollments');
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

// Get attendance records from localStorage
const getAttendanceRecords = () => {
  try {
    const stored = localStorage.getItem('myClasses');
    if (!stored) return [];
    const classes = JSON.parse(stored);
    
    // Extract attendance records from myClasses
    const attendanceRecords = [];
    classes.forEach(cls => {
      if (cls.attendance && Array.isArray(cls.attendance)) {
        cls.attendance.forEach(record => {
          attendanceRecords.push({
            id: Date.now() + Math.random(),
            classId: cls.id,
            studentId: record.studentId || 'STUDENT_001', // Default student ID
            studentName: record.studentName || 'Unknown Student',
            date: record.date,
            time: record.timestamp || new Date().toISOString(),
            status: record.status,
            method: record.method || 'manual',
            deliveryMethod: cls.deliveryMethod || 'physical'
          });
        });
      }
    });
    
    return attendanceRecords;
  } catch {
    return [];
  }
};

// Get myClasses data for student attendance
const getMyClassesData = () => {
  try {
    const stored = localStorage.getItem('myClasses');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

const AttendanceOverview = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  
  const [selectedClass, setSelectedClass] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanningStatus, setScanningStatus] = useState('');
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);

  const [classListState, setClassListState] = useState([]);
  const enrollments = getEnrollments();
  // Load classes from backend to avoid reliance on localStorage
  useEffect(() => {
    (async () => {
      try {
        const resp = await getAllClasses();
        if (resp?.success && Array.isArray(resp.data)) {
          setClassListState(resp.data);
        } else {
          // Fallback to localStorage if backend returns nothing
          setClassListState(getClassList());
        }
      } catch {
        setClassListState(getClassList());
      }
    })();
  }, []);

  // Build table rows from backend attendance for the selected date (or today)
  useEffect(() => {
    const buildRows = async () => {
      try {
        setLoadingRows(true);
        const dateToUse = selectedDate || new Date().toISOString().split('T')[0];
        const results = await Promise.all(
          classListState.map(async (cls) => {
            try {
              const data = await getAttendanceByClass(cls.id);
              const records = Array.isArray(data?.records) ? data.records : [];
              const dayRecords = records.filter(r => (r.time_stamp || '').slice(0, 10) === dateToUse);
              const uniquePresent = new Set(dayRecords.map(r => r.user_id)).size;
              const enrolledStudents = enrollments.filter(e => e.classId === cls.id);
              const total = enrolledStudents.length;
              const rate = total > 0 ? Math.round((uniquePresent / total) * 100) : 0;
              return {
                ...cls,
                studentsPresent: uniquePresent,
                totalStudents: total,
                date: cls.startDate || dateToUse,
                from: cls.schedule?.startTime || '',
                to: cls.schedule?.endTime || '',
                status: cls.status || 'Not Started',
                deliveryMethod: cls.deliveryMethod || 'physical',
                attendanceRate: rate,
              };
            } catch {
              const enrolledStudents = enrollments.filter(e => e.classId === cls.id);
              return {
                ...cls,
                studentsPresent: 0,
                totalStudents: enrolledStudents.length,
                date: cls.startDate || dateToUse,
                from: cls.schedule?.startTime || '',
                to: cls.schedule?.endTime || '',
                status: cls.status || 'Not Started',
                deliveryMethod: cls.deliveryMethod || 'physical',
                attendanceRate: 0,
              };
            }
          })
        );
        setRows(results);
      } finally {
        setLoadingRows(false);
      }
    };
    buildRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, classListState]);

  // Backend-driven rows are used directly for the table

  // Handle barcode scanning
  const handleBarcodeScan = (classId) => {
    setSelectedClass(classListState.find(cls => cls.id === classId));
    setShowBarcodeModal(true);
    setBarcodeInput('');
    setScanningStatus('');
  };

  // Process barcode input
  const processBarcode = async (barcodeData) => {
    if (!barcodeData || !barcodeData.trim()) {
      setScanningStatus('Please enter a barcode');
      return;
    }

    try {
      setScanningStatus('Processing barcode...');
      const data = barcodeData.trim();
      let studentId;
      if (data.includes('_')) {
        const parts = data.split('_');
        studentId = parts.length >= 3 ? `${parts[1]}_${parts[2]}` : data;
      } else {
        studentId = data;
      }
      const student = enrollments.find(e => e.studentId === studentId && e.classId === selectedClass.id);
      if (!student) {
        setScanningStatus(`Student not found or not enrolled in this class. Student ID: ${studentId}`);
        return;
      }
      await markAttendance({ userId: studentId, classId: selectedClass.id });
      setScanningStatus(`Attendance marked successfully for ${student.studentName || studentId}`);
      setBarcodeInput('');
    } catch (e) {
      setScanningStatus('Failed to mark attendance');
    }
  };

  // Handle online attendance marking
  const handleOnlineAttendance = async (classId) => {
    try {
      const classStudents = enrollments.filter(e => e.classId === classId);
      await Promise.all(classStudents.map(s => markAttendance({ userId: s.studentId, classId })));
      alert('Online attendance marked for all enrolled students');
    } catch (e) {
      alert('Failed to mark online attendance');
    }
  };

  // Generate barcode for a class
  const generateClassBarcode = (classId) => {
    // Simple barcode generation (in real app, use a proper barcode library)
    const barcodeData = `CLASS_${classId}_${Date.now()}`;
    return barcodeData;
  };

  // Download attendance report
  const downloadAttendanceReport = async (classId) => {
    const classData = classListState.find(cls => cls.id === classId);
    const data = await getAttendanceByClass(classId);
    const records = Array.isArray(data?.records) ? data.records : [];
    if (records.length === 0) {
      alert('No attendance records found for this class');
      return;
    }
    const csvContent = [
      ['Date', 'Student ID', 'Student Name', 'Status', 'Method', 'Time'],
      ...records.map(r => {
        const student = enrollments.find(e => e.classId === classId && e.studentId === r.user_id);
        const date = (r.time_stamp || '').slice(0, 10);
        return [
          date,
          r.user_id || 'Unknown',
          student?.studentName || 'Unknown Student',
          'present',
          'server',
          new Date(r.time_stamp || new Date()).toLocaleString(),
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${classData.className}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Attendance Tracking</h1>
        
        {/* Date Filter */}
        <div className="flex items-center gap-4 mb-6">
          <label className="font-semibold">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-2"
            placeholder="Select date (optional)"
          />
          {selectedDate && (
            <button
              type="button"
              className="ml-2 text-sm text-gray-600 underline hover:text-blue-700"
              onClick={() => setSelectedDate('')}
            >
              Clear
            </button>
          )}
        </div>

        {/* Attendance Table */}
        <BasicTable
          columns={[
            { key: 'className', label: 'Class Name' },
            { key: 'subject', label: 'Subject' },
            { key: 'teacher', label: 'Teacher' },
            { key: 'stream', label: 'Stream' },
            { key: 'date', label: 'Date' },
            { key: 'from', label: 'From' },
            { key: 'to', label: 'To' },
            { key: 'deliveryMethod', label: 'Mode', render: row => {
                const method = row.deliveryMethod || 'physical';
                if (method === 'online') return <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 font-semibold flex items-center gap-1"><FaVideo /> Online</span>;
                if (method === 'hybrid') return <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 font-semibold flex items-center gap-1"><FaMapMarkerAlt /> Hybrid</span>;
                return <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-semibold flex items-center gap-1"><FaMapMarkerAlt /> Physical</span>;
              } },
            { key: 'status', label: 'Status', render: row => {
                if (row.status === 'active') return <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-semibold">Active</span>;
                if (row.status === 'inactive') return <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-semibold">Inactive</span>;
                if (row.status === 'archived') return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-semibold">Archived</span>;
                return row.status;
              } },
            { key: 'studentsPresent', label: 'Attendance', render: row => (
                <div className="text-center">
                  <div className="font-semibold text-blue-700">{row.studentsPresent}/{row.totalStudents}</div>
                  <div className="text-xs text-gray-500">{row.attendanceRate}%</div>
                </div>
              ) },
            { key: 'actions', label: 'Actions', render: row => (
                <div className="flex gap-2">
                  <CustomButton
                    onClick={() => navigate(`/admin/attendance/${row.id}`)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    title="View Details"
                  >
                    <FaEye />
                  </CustomButton>

                  {/* Barcode scanning for physical and hybrid classes */}
                  {(row.deliveryMethod === 'physical' || row.deliveryMethod === 'hybrid') && (
                    <>
                      <CustomButton
                        onClick={() => handleBarcodeScan(row.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        title="Scan Barcode (Physical/Hybrid)"
                      >
                        <FaBarcode />
                      </CustomButton>
                      
                    </>
                  )}

                  {/* Online attendance for online and hybrid classes */}
                  {(row.deliveryMethod === 'online' || row.deliveryMethod === 'hybrid') && (
                    <CustomButton
                      onClick={() => handleOnlineAttendance(row.id)}
                      className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                      title="Mark Online Attendance (Online/Hybrid)"
                    >
                      <FaVideo />
                    </CustomButton>
                  )}

                  <CustomButton
                    onClick={() => downloadAttendanceReport(row.id)}
                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                    title="Download Report"
                  >
                    <FaDownload />
                  </CustomButton>
                </div>
              ) },
          ]}
          data={selectedDate ? rows.filter(r => r.date === selectedDate) : rows}
        />

        {/* Barcode Scanner Modal */}
        {showBarcodeModal && selectedClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <BarcodeScanner
              onScan={processBarcode}
              onClose={() => setShowBarcodeModal(false)}
              className={selectedClass.className}
              classId={selectedClass.id}
            />
          </div>
        )}

        
      </div>
    </DashboardLayout>
  );
};

export default AttendanceOverview; 
