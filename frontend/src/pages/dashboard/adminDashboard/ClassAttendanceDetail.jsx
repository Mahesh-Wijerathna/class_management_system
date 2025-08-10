import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import CustomButton from '../../../components/CustomButton';
import { FaQrcode, FaBarcode, FaVideo, FaMapMarkerAlt, FaUsers, FaCalendar, FaClock, FaEye, FaEdit, FaDownload, FaCheckCircle, FaTimesCircle, FaUser, FaArrowLeft, FaChartBar } from 'react-icons/fa';
import { getClassById } from '../../../api/classes';
import { getAttendanceByClass, markAttendance as markAttendanceApi } from '../../../api/attendance';
import BarcodeScanner from '../../../components/BarcodeScanner';

// Attendance is sourced from the backend; no localStorage extractor needed

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

// Get class details from localStorage
const getClassDetails = (classId) => {
  try {
    const stored = localStorage.getItem('classes');
    if (!stored) return null;
    const classes = JSON.parse(stored);
    // Fix: Compare both as strings to avoid type mismatch
    return classes.find(cls => String(cls.id) === String(classId));
  } catch {
    return null;
  }
};

const ClassAttendanceDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanningStatus, setScanningStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState([]); // {classId, userId, createdAt}
  const [isSyncing, setIsSyncing] = useState(false);

  const OFFLINE_QUEUE_KEY = 'attendance_offline_queue';

  useEffect(() => {
    loadClassData();
  }, [classId, selectedDate]);

  // Load offline queue once on mount and schedule periodic sync
  useEffect(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) setOfflineQueue(JSON.parse(stored));
    } catch {}

    const id = setInterval(() => {
      syncOfflineQueue();
    }, 10000); // every 10s
    return () => clearInterval(id);
  }, []);

  const persistOfflineQueue = (queue) => {
    setOfflineQueue(queue);
    try { localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue)); } catch {}
  };

  const syncOfflineQueue = async () => {
    if (isSyncing || offlineQueue.length === 0) return;
    setIsSyncing(true);
    try {
      const remaining = [];
      for (const item of offlineQueue) {
        try {
          await markAttendanceApi({ userId: item.userId, classId: item.classId });
        } catch {
          remaining.push(item); // keep if still failing
        }
      }
      persistOfflineQueue(remaining);
      if (String(classId)) await loadClassData();
    } finally {
      setIsSyncing(false);
    }
  };

  // Gentle beep for feedback
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.05, ctx.currentTime);
      o.start();
      o.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  const loadClassData = async () => {
    setLoading(true);
    try {
      // Load class details (backend first)
      try {
        const resp = await getClassById(classId);
        if (resp?.success && resp.data) {
          setClassDetails(resp.data);
        } else {
          setClassDetails(getClassDetails(classId));
        }
      } catch {
        setClassDetails(getClassDetails(classId));
      }

      // Load enrollments for this class (from localStorage)
      const allEnrollments = getEnrollments();
      const classEnrollments = allEnrollments.filter(e => String(e.classId) === String(classId));
      setEnrolledStudents(classEnrollments);

      // Fetch attendance from backend and map to rows for selected date
      const data = await getAttendanceByClass(classId);
      const records = Array.isArray(data?.records) ? data.records : [];
      const filtered = records.filter(r => (r.time_stamp || '').slice(0, 10) === selectedDate);
      const mapped = filtered.map((r, idx) => {
        const student = classEnrollments.find(e => e.studentId === r.user_id);
        return {
          id: `${classId}_${idx}`,
          classId: classId,
          studentId: r.user_id,
          studentName: student?.studentName || 'Unknown Student',
          date: selectedDate,
          time: r.time_stamp,
          status: 'present',
          method: 'server',
        };
      });
      setAttendanceRecords(mapped);
    } finally {
      setLoading(false);
    }
  };

  // Process barcode input (manual entry)
  const processBarcode = async () => {
    if (!barcodeInput.trim()) { setScanningStatus('Please enter a barcode'); return; }
    await handleScannedCode(barcodeInput.trim());
    setBarcodeInput('');
  };

  // Unified handler for camera/HID scans
  const handleScannedCode = async (decodedText) => {
    try {
      setScanningStatus('Processing barcode...');
      // Extract student id from common patterns
      const match = String(decodedText).toUpperCase().match(/STUDENT_\d+/);
      const studentId = match ? match[0] : String(decodedText).toUpperCase();
      const student = enrolledStudents.find(e => String(e.studentId).toUpperCase() === studentId);
      if (!student) {
        setScanningStatus(`Student not found or not enrolled in this class. Student ID: ${studentId}`);
        return;
      }
      try {
        await markAttendanceApi({ userId: studentId, classId });
        setScanningStatus(`Attendance marked successfully for ${student.studentName || studentId}`);
        beep();
        await loadClassData();
      } catch (err) {
        const queued = [...offlineQueue, { userId: studentId, classId, createdAt: new Date().toISOString() }];
        persistOfflineQueue(queued);
        setScanningStatus('Network issue. Queued and will auto-sync.');
      }
    } catch {
      setScanningStatus('Failed to mark attendance');
    }
  };

  // Mark attendance manually (present only)
  const markPresent = async (studentId) => {
    const student = enrolledStudents.find(e => e.studentId === studentId);
    if (!student) return;
    try {
      await markAttendanceApi({ userId: studentId, classId });
      beep();
      await loadClassData();
    } catch {
      const queued = [...offlineQueue, { userId: studentId, classId, createdAt: new Date().toISOString() }];
      persistOfflineQueue(queued);
      setScanningStatus('Network issue. Queued and will auto-sync.');
    }
  };

  // Mark all students present via backend
  const markAllPresent = async () => {
    try {
      await Promise.all(
        enrolledStudents.map(s => markAttendanceApi({ userId: s.studentId, classId }))
      );
      beep();
      await loadClassData();
    } catch {
      // Fallback: queue remaining
      const queued = [
        ...offlineQueue,
        ...enrolledStudents.map(s => ({ userId: s.studentId, classId, createdAt: new Date().toISOString() }))
      ];
      persistOfflineQueue(queued);
      setScanningStatus('Some marks failed. Queued for auto-sync.');
    }
  };

  // Download attendance report
  const downloadReport = () => {
    const storedClasses = localStorage.getItem('myClasses');
    if (!storedClasses) {
      alert('No class data found');
      return;
    }
    
    const classes = JSON.parse(storedClasses);
    const classData = classes.find(cls => cls.id === classId);
    const classAttendance = classData?.attendance || [];
    
    if (classAttendance.length === 0) {
      alert('No attendance records found for this class');
      return;
    }

    // Create CSV content
    const csvContent = [
      ['Date', 'Student ID', 'Student Name', 'Status', 'Method', 'Time'],
      ...classAttendance.map(record => [
        record.date,
        record.studentId || 'Unknown',
        record.studentName || 'Unknown Student',
        record.status,
        record.method || 'manual',
        new Date(record.timestamp || record.time || new Date()).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${classDetails?.className || 'class'}_${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="text-center">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!classDetails) {
    return (
      <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="text-center text-red-600">Class not found</div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate attendance statistics
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const totalEnrolled = enrolledStudents.length > 0 ? enrolledStudents.length : attendanceRecords.length;
  const attendanceRate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

  // Create student attendance data for table
  let studentAttendanceData = [];
  
  console.log('Enrolled students:', enrolledStudents);
  console.log('Attendance records:', attendanceRecords);
  
  if (enrolledStudents.length > 0) {
    // If we have enrolled students, show them with their attendance
    studentAttendanceData = enrolledStudents.map(student => {
      const attendanceRecord = attendanceRecords.find(r => r.studentId === student.studentId);
      return {
        ...student,
        attendanceStatus: attendanceRecord?.status || 'not_marked',
        attendanceTime: attendanceRecord?.time || null,
        attendanceMethod: attendanceRecord?.method || null
      };
    });
  } else {
    // If no enrolled students, show attendance records directly
    studentAttendanceData = attendanceRecords.map(record => ({
      studentId: record.studentId,
      studentName: record.studentName,
      attendanceStatus: record.status,
      attendanceTime: record.time,
      attendanceMethod: record.method
    }));
  }
  
  console.log('Final student attendance data:', studentAttendanceData);

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <CustomButton
              onClick={() => navigate('/admin/attendance')}
              className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <FaArrowLeft />
            </CustomButton>
            <div>
              <h1 className="text-2xl font-bold">{classDetails.className}</h1>
              <p className="text-gray-600">{classDetails.subject} • {classDetails.teacher}</p>
          </div>
          </div>
          
          <div className="flex gap-2">
            <CustomButton
              onClick={downloadReport}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <FaDownload className="mr-2" />
              Download Report
            </CustomButton>
          </div>
        </div>

        {/* Class Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <FaUsers className="text-blue-600" />
              <span className="font-semibold">Total Students</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalEnrolled}</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-600" />
              <span className="font-semibold">Present</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <FaTimesCircle className="text-red-600" />
              <span className="font-semibold">Absent</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <FaChartBar className="text-purple-600" />
              <span className="font-semibold">Attendance Rate</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{attendanceRate}%</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="font-semibold">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          
          {classDetails.deliveryMethod === 'physical' && (
            <CustomButton
              onClick={() => setShowBarcodeModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <FaBarcode className="mr-2" />
              Scan Barcode
            </CustomButton>
          )}
          
          {(classDetails.deliveryMethod === 'online' || classDetails.deliveryMethod === 'hybrid') && (
            <CustomButton
              onClick={markAllPresent}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <FaVideo className="mr-2" />
              Mark All Present (Online)
            </CustomButton>
          )}
        </div>

        {/* Student Attendance Table */}
        <BasicTable
          columns={[
            { key: 'studentName', label: 'Student Name' },
            { key: 'studentId', label: 'Student ID' },
            { key: 'attendanceStatus', label: 'Status', render: row => {
                const status = row.attendanceStatus;
                if (status === 'present') return <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-semibold">Present</span>;
                if (status === 'absent') return <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-semibold">Absent</span>;
                return <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 font-semibold">Not Marked</span>;
              } },
            { key: 'attendanceTime', label: 'Time', render: row => 
                row.attendanceTime ? new Date(row.attendanceTime).toLocaleTimeString() : '-'
              },
            { key: 'attendanceMethod', label: 'Method', render: row => {
                const method = row.attendanceMethod;
                if (method === 'barcode') return <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm">Barcode</span>;
                if (method === 'manual') return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-sm">Manual</span>;
                if (method === 'bulk') return <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 text-sm">Bulk</span>;
                return '-';
              } },
            { key: 'actions', label: 'Actions', render: row => (
                <div className="flex gap-2">
                  <CustomButton
                    onClick={() => markPresent(row.studentId)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    disabled={row.attendanceStatus === 'present'}
                  >
                    Present
                  </CustomButton>
                </div>
              ) },
            ]}
          data={studentAttendanceData}
        />

        {/* Barcode Scanner Modal */}
        {showBarcodeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <BarcodeScanner
              onScan={handleScannedCode}
              onClose={() => setShowBarcodeModal(false)}
              className={classDetails.className}
              classId={classId}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClassAttendanceDetail; 