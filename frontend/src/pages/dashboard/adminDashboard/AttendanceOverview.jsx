import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import CustomButton from '../../../components/CustomButton';
import { FaQrcode, FaBarcode, FaVideo, FaMapMarkerAlt, FaUsers, FaCalendar, FaClock, FaEye, FaEdit, FaDownload } from 'react-icons/fa';
import RealBarcodeGenerator from '../../../components/RealBarcodeGenerator';
import BarcodeScanner from '../../../components/BarcodeScanner';

// Get all classes from localStorage
const getClassList = () => {
  try {
    const stored = localStorage.getItem('classes');
    if (!stored) {
      // Initialize with sample data if no classes exist
      const sampleClasses = [
        {
          id: '1',
          className: 'Advanced Mathematics',
          subject: 'Mathematics',
          teacher: 'Dr. Smith',
          stream: 'Science',
          deliveryMethod: 'physical',
          hall: 'Room 101',
          schedule: { startTime: '09:00', endTime: '10:30' },
          status: 'active'
        },
        {
          id: '2',
          className: 'Physics Fundamentals',
          subject: 'Physics',
          teacher: 'Prof. Johnson',
          stream: 'Science',
          deliveryMethod: 'online',
          hall: 'Zoom Meeting',
          schedule: { startTime: '14:00', endTime: '15:30' },
          status: 'active'
        },
        {
          id: '3',
          className: 'Chemistry Lab',
          subject: 'Chemistry',
          teacher: 'Dr. Wilson',
          stream: 'Science',
          deliveryMethod: 'hybrid',
          hall: 'Lab 205',
          schedule: { startTime: '11:00', endTime: '12:30' },
          status: 'active'
        }
      ];
      localStorage.setItem('classes', JSON.stringify(sampleClasses));
      return sampleClasses;
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

// Get enrollments from localStorage (simulate student enrollments)
const getEnrollments = () => {
  try {
    const stored = localStorage.getItem('enrollments');
    if (!stored) {
      // Initialize with sample data if no enrollments exist
      const sampleEnrollments = [
        { classId: '1', studentId: 'STUDENT_001', studentName: 'John Doe' },
        { classId: '1', studentId: 'STUDENT_002', studentName: 'Jane Smith' },
        { classId: '1', studentId: 'STUDENT_003', studentName: 'Mike Johnson' },
        { classId: '2', studentId: 'STUDENT_001', studentName: 'John Doe' },
        { classId: '2', studentId: 'STUDENT_004', studentName: 'Sarah Wilson' },
        { classId: '2', studentId: 'STUDENT_005', studentName: 'David Brown' },
      ];
      localStorage.setItem('enrollments', JSON.stringify(sampleEnrollments));
      return sampleEnrollments;
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

// Get attendance records from localStorage
const getAttendanceRecords = () => {
  try {
    const stored = localStorage.getItem('attendanceRecords');
    if (!stored) return [];
    return JSON.parse(stored);
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
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanningStatus, setScanningStatus] = useState('');

  const classList = getClassList();
  const enrollments = getEnrollments();
  const attendanceRecords = getAttendanceRecords();
  const myClassesData = getMyClassesData();

  // Calculate studentsPresent and totalStudents for each class
  const classesWithAttendance = classList.map(cls => {
    // Get students enrolled in this class
    const enrolledStudents = enrollments.filter(e => e.classId === cls.id);
    
    // Get today's attendance for this class
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceRecords.filter(record => 
      record.classId === cls.id && record.date === today
    );
    
    // Count present students
    const presentStudents = todayAttendance.filter(record => record.status === 'present').length;
    
    // Get delivery method info
    const deliveryMethod = cls.deliveryMethod || 'physical';
    
    return {
      ...cls,
      studentsPresent: presentStudents,
      totalStudents: enrolledStudents.length,
      date: cls.startDate || today,
      from: cls.schedule?.startTime || '',
      to: cls.schedule?.endTime || '',
      location: cls.hall || '',
      status: cls.status || 'Not Started',
      deliveryMethod: deliveryMethod,
      attendanceRate: enrolledStudents.length > 0 ? Math.round((presentStudents / enrolledStudents.length) * 100) : 0
    };
  });

  // Filter classes by selected date if selectedDate is set, else show all
  const filteredClasses = selectedDate
    ? classesWithAttendance.filter(cls => cls.date === selectedDate)
    : classesWithAttendance;

  // Handle barcode scanning
  const handleBarcodeScan = (classId) => {
    setSelectedClass(classList.find(cls => cls.id === classId));
    setShowBarcodeModal(true);
    setBarcodeInput('');
    setScanningStatus('');
  };

  // Process barcode input
  const processBarcode = (barcodeData) => {
    if (!barcodeData || !barcodeData.trim()) {
      setScanningStatus('Please enter a barcode');
      return;
    }

    // Simulate barcode processing
    setScanningStatus('Processing barcode...');
    
    setTimeout(() => {
      // Extract student ID from barcode (format: classId_STUDENT_XXX_timestamp_random)
      const data = barcodeData.trim();
      console.log('Processing barcode:', data);
      
      let studentId;
      
      // Try to parse the barcode format
      if (data.includes('_')) {
        const parts = data.split('_');
        if (parts.length >= 2) {
          // Extract student ID from barcode (e.g., "STUDENT_001" from "classId_STUDENT_001_timestamp_random")
          studentId = parts[1] + '_' + parts[2]; // Combine STUDENT and XXX
        } else {
          studentId = data; // Fallback to original input
        }
      } else {
        studentId = data; // Fallback to original input
      }
      
      console.log('Extracted student ID:', studentId);
      
      // Find student in enrollments
      const student = enrollments.find(e => e.studentId === studentId && e.classId === selectedClass.id);
      
      if (!student) {
        console.log('Available enrollments:', enrollments.filter(e => e.classId === selectedClass.id));
        setScanningStatus(`Student not found or not enrolled in this class. Student ID: ${studentId}`);
        return;
      }

      // Check if attendance already marked for today
      const today = new Date().toISOString().split('T')[0];
      const existingRecord = attendanceRecords.find(record => 
        record.classId === selectedClass.id && 
        record.studentId === studentId && 
        record.date === today
      );

      if (existingRecord) {
        setScanningStatus('Attendance already marked for this student today');
        return;
      }

      // Mark attendance
      const newAttendanceRecord = {
        id: Date.now(),
        classId: selectedClass.id,
        studentId: studentId,
        studentName: student.studentName || 'Unknown Student',
        date: today,
        time: new Date().toISOString(),
        status: 'present',
        method: 'barcode',
        deliveryMethod: selectedClass.deliveryMethod || 'physical'
      };

      // Save to localStorage
      const updatedRecords = [...attendanceRecords, newAttendanceRecord];
      localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords));

      setScanningStatus(`Attendance marked successfully for ${student.studentName || studentId}`);
      setBarcodeInput('');
      
      // Refresh the page data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }, 1000);
  };

  // Handle online attendance marking
  const handleOnlineAttendance = (classId) => {
    const today = new Date().toISOString().split('T')[0];
    const classStudents = enrollments.filter(e => e.classId === classId);
    
    // For online classes, mark all enrolled students as present (simplified)
    const newRecords = classStudents.map(student => ({
      id: Date.now() + Math.random(),
      classId: classId,
      studentId: student.studentId,
      studentName: student.studentName || 'Unknown Student',
      date: today,
      time: new Date().toISOString(),
      status: 'present',
      method: 'online',
      deliveryMethod: 'online'
    }));

    // Save to localStorage
    const updatedRecords = [...attendanceRecords, ...newRecords];
    localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords));

    alert('Online attendance marked for all enrolled students');
    window.location.reload();
  };

  // Generate barcode for a class
  const generateClassBarcode = (classId) => {
    // Simple barcode generation (in real app, use a proper barcode library)
    const barcodeData = `CLASS_${classId}_${Date.now()}`;
    return barcodeData;
  };

  // Download attendance report
  const downloadAttendanceReport = (classId) => {
    const classData = classList.find(cls => cls.id === classId);
    const classAttendance = attendanceRecords.filter(record => record.classId === classId);
    
    if (classAttendance.length === 0) {
      alert('No attendance records found for this class');
      return;
    }

    // Create CSV content
    const csvContent = [
      ['Date', 'Student ID', 'Student Name', 'Status', 'Method', 'Time'],
      ...classAttendance.map(record => [
        record.date,
        record.studentId,
        record.studentName,
        record.status,
        record.method,
        new Date(record.time).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    // Download file
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
            { key: 'location', label: 'Location' },
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
                  
                  {row.deliveryMethod === 'physical' && (
                    <>
                      <CustomButton
                        onClick={() => handleBarcodeScan(row.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        title="Scan Barcode"
                      >
                        <FaBarcode />
                      </CustomButton>
                      <CustomButton
                        onClick={() => {
                          setSelectedClass(row);
                          setShowBarcodeGenerator(true);
                        }}
                        className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                        title="Generate Barcodes"
                      >
                        <FaQrcode />
                      </CustomButton>
                    </>
                  )}
                  
                  {(row.deliveryMethod === 'online' || row.deliveryMethod === 'hybrid') && (
                    <CustomButton
                      onClick={() => handleOnlineAttendance(row.id)}
                      className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                      title="Mark Online Attendance"
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
          data={filteredClasses}
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

        {/* Barcode Generator Modal */}
        {showBarcodeGenerator && selectedClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Barcode Generator</h3>
                <button
                  onClick={() => setShowBarcodeGenerator(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <RealBarcodeGenerator 
                classId={selectedClass.id} 
                className={selectedClass.className} 
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendanceOverview; 
