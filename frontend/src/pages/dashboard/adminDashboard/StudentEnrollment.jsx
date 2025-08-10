import React, { useState, useEffect } from 'react';
import BasicAlertBox from '../../../components/BasicAlertBox';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import CustomButton from '../../../components/CustomButton';
import CustomButton2 from '../../../components/CustomButton2';
import BasicTable from '../../../components/BasicTable';
import BasicForm from '../../../components/BasicForm';
import { FieldArray } from 'formik';
import CustomTextField from '../../../components/CustomTextField';
import { FaEdit, FaTrash, FaUser, FaEnvelope, FaPhone, FaIdCard, FaUserGraduate, FaBook, FaCalendar, FaBarcode, FaDownload, FaPrint, FaEye, FaQrcode, FaSync } from 'react-icons/fa';
import * as Yup from 'yup';
import CustomSelectField from '../../../components/CustomSelectField';
import JsBarcode from 'jsbarcode';
import { getAllBarcodes, getBarcode } from '../../../api/auth';
import { getAllStudents, deleteStudent } from '../../../api/students';

// Helper to parse NIC (Sri Lankan)
function parseNIC(nic) {
  let year, month, day, gender;
  let nicStr = nic.toString().toUpperCase();
  if (/^\d{9}[VX]$/.test(nicStr)) {
    year = '19' + nicStr.substring(0, 2);
    let days = parseInt(nicStr.substring(2, 5), 10);
    gender = days > 500 ? 'Female' : 'Male';
    if (days > 500) days -= 500;
    const months = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let m = 0;
    while (days > months[m]) {
      days -= months[m];
      m++;
    }
    month = (m + 1).toString().padStart(2, '0');
    day = days.toString().padStart(2, '0');
  } else if (/^\d{12}$/.test(nicStr)) {
    year = nicStr.substring(0, 4);
    let days = parseInt(nicStr.substring(4, 7), 10);
    gender = days > 500 ? 'Female' : 'Male';
    if (days > 500) days -= 500;
    const months = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let m = 0;
    while (days > months[m]) {
      days -= months[m];
      m++;
    }
    month = (m + 1).toString().padStart(2, '0');
    day = days.toString().padStart(2, '0');
  } else {
    return null;
  }
  
  const dob = `${year}-${month}-${day}`;

  // Calculate age
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const mm = today.getMonth() - birthDate.getMonth();
  if (mm < 0 || (mm === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return { dob, gender, age };
}


const initialStudents = [
  {
    studentId: '99985570',
    nic: '200805202345',
    firstName: 'Januli',
    lastName: 'Liyanage',
    gender: 'Female',
    age: 17,
    email: 'januli.liyanage@email.com',
    phone: '0771234567',
    parentName: 'Nimal Liyanage',
    parentPhone: '0778888888',
    stream: 'A/L-Science',
    dateOfBirth: '2008-05-02',
    school: 'Sujatha Vidyalaya',
    address: '123 Main St, Apt 4B, Matara',
    district: 'Matara',
    dateJoined: '2023-09-15',
    enrolledClasses: [
      { subject: 'Mathematics', teacher: 'Mr. Perera', schedule: 'Mon 8:00-10:00 AM', hall: 'Hall 1' },
      { subject: 'Science', teacher: 'Ms. Silva', schedule: 'Wed 10:00-12:00 PM', hall: 'Hall 2' },
    ],
  },
  {
    studentId: '99965474',
    nic: '200711223456',
    firstName: 'Sithum',
    lastName: 'Prabhashana',
    gender: 'Male',
    age: 18,
    email: 'sithum.prabhashana@email.com',
    phone: '0772345678',
    parentName: 'Sunil Prabhashana',
    parentPhone: '0779999999',
    stream: 'A/L-Art',
    dateOfBirth: '2007-11-22',
    school: 'Rahula College',
    address: '456 Lake Rd, Floor 2, Matara',
    district: 'Matara',
    dateJoined: '2022-11-22',
    enrolledClasses: [
      { subject: 'English', teacher: 'Ms. Wickramasinghe', schedule: 'Tue 9:00-11:00 AM', hall: 'Hall 4' },
      { subject: 'ICT', teacher: 'Ms. Jayasinghe', schedule: 'Sat 9:00-11:00 AM', hall: 'Lab 1' },
    ],
  },
  {
    studentId: '99935041',
    nic: '200902123789',
    firstName: 'Sithnula',
    lastName: 'Geesan',
    gender: 'Male',
    age: 16,
    email: 'sithnula.geesan@email.com',
    phone: '0773456789',
    parentName: 'Ruwan Geesan',
    parentPhone: '0777777777',
    stream: 'O/L',
    dateOfBirth: '2009-02-12',
    school: 'St. Thomas College',
    address: '789 River Ave, Block C, Matara',
    district: 'Matara',
    dateJoined: '2024-02-12',
    enrolledClasses: [
      { subject: 'History', teacher: 'Mr. Bandara', schedule: 'Thu 1:00-3:00 PM', hall: 'Hall 5' },
      { subject: 'Mathematics', teacher: 'Mr. Perera', schedule: 'Mon 8:00-10:00 AM', hall: 'Hall 1' },
    ],
  },
  {
    studentId: '99892421',
    nic: '201007063456',
    firstName: 'Pasindi',
    lastName: 'Vidana Pathirana',
    gender: 'Female',
    age: 15,
    email: 'pasindi.vidana@email.com',
    phone: '0774567890',
    parentName: 'Kumari Pathirana',
    parentPhone: '0776666666',
    stream: 'A/L-Maths',
    dateOfBirth: '2010-07-06',
    school: 'Sujatha Vidyalaya',
    address: '321 Hill Rd, Suite 10, Matara',
    district: 'Matara',
    dateJoined: '2023-07-06',
    enrolledClasses: [
      { subject: 'Buddhism', teacher: 'Ven. Rathana', schedule: 'Thu 10:00-12:00 PM', hall: 'Hall 7' },
      { subject: 'Science', teacher: 'Ms. Silva', schedule: 'Wed 10:00-12:00 PM', hall: 'Hall 2' },
    ],
  },
  {
    studentId: '99820651',
    nic: '200611033123',
    firstName: 'Thisuli',
    lastName: 'Thumalja',
    gender: 'Female',
    age: 19,
    email: 'thisuli.thumalja@email.com',
    phone: '0775678901',
    parentName: 'Saman Thumalja',
    parentPhone: '0775555555',
    stream: 'A/L-Science',
    dateOfBirth: '2006-11-03',
    school: 'Visakha Vidyalaya',
    address: '654 Ocean View, Colombo 7, Colombo',
    district: 'Colombo',
    dateJoined: '2022-03-07',
    enrolledClasses: [
      { subject: 'English', teacher: 'Ms. Wickramasinghe', schedule: 'Tue 9:00-11:00 AM', hall: 'Hall 4' },
      { subject: 'Mathematics', teacher: 'Mr. Perera', schedule: 'Mon 8:00-10:00 AM', hall: 'Hall 1' },
      { subject: 'Science', teacher: 'Ms. Silva', schedule: 'Wed 10:00-12:00 PM', hall: '' },
    ],
  },
];

const streamOptions = [
  'O/L',
  'A/L-Art',
  'A/L-Maths',
  'A/L-Science',
  'A/L-Commerce',
  'A/L-Technology',
  'Primary',
];

const genderOptions = [
    'Male',
    'Female',
];

const validationSchema = Yup.object().shape({
  studentId: Yup.string().required('Student ID is required'),
  firstName: Yup.string().min(2, 'First name must be at least 2 characters').required('First name is required'),
  lastName: Yup.string().min(2, 'Last name must be at least 2 characters').required('Last name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  stream: Yup.string().oneOf(streamOptions, 'Invalid stream').required('Stream is required'),
  dateOfBirth: Yup.string().required('Date of Birth is required'),
  gender: Yup.string().oneOf(genderOptions, 'Invalid gender').required('Gender is required'),
  school: Yup.string().required('School is required'),
  address: Yup.string().required('Address is required'),
  district: Yup.string().required('District is required'),
  phone: Yup.string().required('Mobile is required'),
  parentName: Yup.string().required('Parent name is required'),
  parentPhone: Yup.string().required('Parent mobile number is required'),
  enrolledClasses: Yup.array().of(
    Yup.object().shape({
      subject: Yup.string().required('Subject is required'),
      teacher: Yup.string().required('Teacher is required'),
      schedule: Yup.string(),
      hall: Yup.string(),
    })
  ),
});



const StudentEnrollment = () => {
  // Load students from backend database
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editValues, setEditValues] = useState({});
  
  // Barcode modal state
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [barcodeGenerated, setBarcodeGenerated] = useState(false);

  // Fetch students from backend
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await getAllStudents();
      if (response.success) {
        // Transform student data to match the expected format
        const studentData = response.students.map(student => ({
          studentId: student.userid,
          firstName: student.firstName || '',
          lastName: student.lastName || '',
          email: student.email || '',
          phone: student.mobile || '', // Using mobile as phone
          nic: student.nic || '',
          gender: student.gender || '',
          age: student.age || '',
          parentName: student.parentName || '',
          parentPhone: student.parentMobile || '',
          stream: student.stream || '',
          dateOfBirth: student.dateOfBirth || '',
          school: student.school || '',
          address: student.address || '',
          district: student.district || '',
          dateJoined: student.dateJoined || student.barcodeCreatedAt?.split(' ')[0] || '',
          barcodeData: student.barcodeData || '',
          created_at: student.barcodeCreatedAt || '',
          enrolledClasses: []
        }));
        setStudents(studentData);
        console.log('Students loaded from backend:', studentData);
      } else {
        console.error('Failed to fetch students:', response.message);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Load students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Refresh students data from backend
  const refreshStudents = () => {
    fetchStudents();
  };

  // Generate barcode on canvas
  const generateBarcodeOnCanvas = (barcodeData, canvasId) => {
    try {
      const canvas = document.getElementById(canvasId);
        if (canvas) {
        JsBarcode(`#${canvasId}`, barcodeData, {
              format: 'CODE128',
              width: 2,
          height: 100,
              displayValue: true,
          fontSize: 16,
          margin: 10
            });
      }
          } catch (error) {
      console.error('Error generating barcode on canvas:', error);
          }
  };

  // Download barcode as PNG
  const downloadBarcode = (student) => {
    console.log('downloadBarcode called with student:', student);
    const canvas = document.getElementById('student-barcode-display');
    console.log('Canvas element found:', canvas);
    if (canvas) {
      const link = document.createElement('a');
      link.download = `barcode_${student.firstName}_${student.lastName}.png`;
      link.href = canvas.toDataURL();
      console.log('Download link created:', link.href);
      link.click();
    } else {
      console.error('Canvas element not found for barcode download');
    }
  };

  // Show barcode modal for a student
  const showBarcode = (student) => {
    console.log('showBarcode called with student:', student);
    setSelectedStudent(student);
    setShowBarcodeModal(true);
    setBarcodeGenerated(false);
    
    // Generate barcode after modal is shown
    setTimeout(() => {
      const barcodeData = student.studentId || student.barcodeData;
      console.log('Generating barcode with data:', barcodeData);
      generateBarcodeOnCanvas(barcodeData, 'student-barcode-display');
      setBarcodeGenerated(true);
    }, 100);
  };

  // Generate barcode for student
  const handleGenerateBarcode = () => {
    if (!selectedStudent) return;
    
    // Generate barcode data
    const barcodeData = selectedStudent.studentId || selectedStudent.barcodeData;
    const barcode = {
      id: barcodeData,
      barcodeData: barcodeData,
      studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
      generatedAt: new Date().toISOString()
    };
    
    // Update student with barcode info
    const updatedStudent = {
      ...selectedStudent,
      studentId: barcode.id,
      barcodeData: barcode.barcodeData,
      barcodeGeneratedAt: barcode.generatedAt
    };
    
    // Update students list
    setStudents(students.map(s => 
      s.studentId === selectedStudent.studentId ? updatedStudent : s
    ));
    
    setSelectedStudent(updatedStudent);
    setBarcodeGenerated(true);
    
    // Generate barcode on canvas
    setTimeout(() => {
      const canvas = document.getElementById('student-barcode-display');
      if (canvas) {
        try {
          JsBarcode('#student-barcode-display', barcode.barcodeData, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 5,
            background: '#ffffff',
            lineColor: '#000000'
          });
        } catch (error) {
          console.error('Error generating barcode:', error);
        }
      }
    }, 200);
  };

  // Generate ID Card
  const generateIDCard = () => {
    if (!selectedStudent?.barcodeData) {
      alert('Please generate a barcode for this student first!');
      return;
    }
  
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>ID Card - ${selectedStudent.firstName} ${selectedStudent.lastName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .id-card-container {
              width: 336px; /* 3.375 in */
              height: 212px; /* 2.125 in */
              background: linear-gradient(135deg, #1a365d 0%, #3da58a 100%);
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              padding: 12px 15px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              color: white;
              position: relative;
            }
            .id-header {
              text-align: center;
              border-bottom: 1px solid rgba(255, 255, 255, 0.3);
              padding-bottom: 4px;
            }
                          .id-header h1 {
                font-size: 13px;
                color: #ffffff;
                margin: 0;
                font-weight: bold;
                letter-spacing: 0.5px;
                text-transform: uppercase;
              }
              .id-header p {
                font-size: 8px;
                margin: 3px 0 0 0;
                color: #e0e0e0;
              }
                          .id-content {
                margin-top: 10px;
                font-size: 11px;
                line-height: 1.6;
              }
              .id-content p {
                margin: 6px 0;
                font-weight: 500;
              }
            .barcode-section {
              background: #ffffff;
              padding: 5px;
              border-radius: 6px;
              display: flex;
              flex-direction: column;
              align-items: center;
              border-top: 1px solid #ddd;
              color: #000;
            }
            .barcode-container svg {
              width: 100%;
              max-height: 40px;
            }
                          .barcode-text {
                font-size: 8px;
                font-family: monospace;
                margin-top: 3px;
                text-align: center;
                color: #333;
                font-weight: bold;
                word-break: break-all;
                line-height: 1.1;
              }
            .id-footer {
              font-size: 9px;
              text-align: right;
              color: #f0f0f0;
              opacity: 0.8;
              margin-top: 5px;
            }
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #3da58a;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
              z-index: 1000;
            }
            .print-button:hover {
              background: #2d8a6f;
            }
            @media print {
              .print-button {
                display: none;
              }
              body {
                background: white;
                padding: 0;
              }
              .id-card-container {
                box-shadow: none;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">Print ID Card</button>
          <div class="id-card-container">
            <div class="id-header">
              <h1>TCMS STUDENT ID</h1>
              <p>Tuition Class Management System</p>
            </div>
                          <div class="id-content">
                <p><strong>Name:</strong> ${selectedStudent.firstName} ${selectedStudent.lastName}</p>
                <p><strong>ID No:</strong> ${selectedStudent.studentId}</p>
                <p><strong>Registered On:</strong> ${selectedStudent.barcodeGeneratedAt ? new Date(selectedStudent.barcodeGeneratedAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
              </div>
            <div class="barcode-section">
              <div class="barcode-container">
                <svg id="id-card-barcode"></svg>
              </div>
              
            </div>
            <div class="id-footer">
              <p>Powered by TCMS | Valid for attendance</p>
            </div>
          </div>
  
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            setTimeout(() => {
              try {
                JsBarcode("#id-card-barcode", "${selectedStudent.barcodeData}", {
                  format: "CODE128",
                  width: 1.2,
                  height: 30,
                  displayValue: false,
                  margin: 0,
                  background: "#ffffff",
                  lineColor: "#000000"
                });
              } catch (error) {
                console.error('Error generating barcode:', error);
              }
            }, 200);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  
  

  // Print barcode
  const printBarcode = () => {
    if (!selectedStudent?.barcodeData) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Barcode - ${selectedStudent.firstName} ${selectedStudent.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; text-align: center; }
            .barcode-container { 
              border: 2px solid #333; 
              padding: 20px; 
              max-width: 400px; 
              margin: 0 auto;
              page-break-inside: avoid;
            }
            .student-info { margin-bottom: 15px; }
            .barcode-image { margin: 15px 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="student-info">
              <h2>${selectedStudent.firstName} ${selectedStudent.lastName}</h2>
              <p><strong>Student ID:</strong> ${selectedStudent.studentId}</p>
              <p><strong>Generated:</strong> ${new Date(selectedStudent.barcodeGeneratedAt).toLocaleDateString()}</p>
            </div>
            <div class="barcode-image">
              <canvas id="print-barcode"></canvas>
            </div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            JsBarcode("#print-barcode", "${selectedStudent.barcodeData}", {
              format: "CODE128",
              width: 2,
              height: 50,
              displayValue: true,
              fontSize: 12,
              margin: 5,
              background: "#ffffff",
              lineColor: "#000000"
            });
            window.print();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Stylish alert state
  const [alertBox, setAlertBox] = useState({ open: false, message: '', onConfirm: null, onCancel: null, confirmText: 'OK', cancelText: 'Cancel', type: 'info' });
  const [saveAlert, setSaveAlert] = useState({ open: false, message: '', onConfirm: null, confirmText: 'OK', type: 'success' });

  const openAlert = (message, onConfirm, options = {}) => {
    setAlertBox({
      open: true,
      message,
      onConfirm: onConfirm || (() => setAlertBox(a => ({ ...a, open: false }))),
      onCancel: options.onCancel || (() => setAlertBox(a => ({ ...a, open: false }))),
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Cancel',
      type: options.type || 'info',
    });
  };

  const handleEdit = (student) => {
    setEditingStudent(student.studentId);
    setEditValues({
      ...student,
      enrolledClasses: Array.isArray(student.enrolledClasses)
        ? student.enrolledClasses.map(c => ({ ...c }))
        : [],
    });
    setShowEditModal(true);
  };

  // --- ALERT HANDLERS ---
  const showDeleteAlert = (studentId) => {
    openAlert(
      'Are you sure you want to delete this student?',
      async () => {
        try {
          setAlertBox(a => ({ ...a, open: false }));
          
          // Call the backend API to delete the student
          const response = await deleteStudent(studentId);
          
          if (response.success) {
            // Remove from local state only after successful API call
            setStudents(students.filter(s => s.userid !== studentId));
            
            // Show success message
            setSaveAlert({
              open: true,
              message: 'Student deleted successfully!',
              onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
              confirmText: 'OK',
              type: 'success',
            });
          } else {
            // Show error message
            setSaveAlert({
              open: true,
              message: response.message || 'Failed to delete student',
              onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
              confirmText: 'OK',
              type: 'error',
            });
          }
        } catch (error) {
          console.error('Error deleting student:', error);
          setSaveAlert({
            open: true,
            message: 'Error deleting student. Please try again.',
            onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
            confirmText: 'OK',
            type: 'error',
          });
        }
      },
      { confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
    );
  };

  const showRemoveClassAlert = (remove, idx) => {
    openAlert(
      'Are you sure you want to remove this class from the student?',
      () => {
        setAlertBox(a => ({ ...a, open: false }));
        remove(idx);
      },
      { confirmText: 'Remove', cancelText: 'Cancel', type: 'danger' }
    );
  };

  const handleEditSubmit = (values) => {
    setStudents(students.map(s => s.studentId === values.studentId ? values : s));
    setEditingStudent(null);
    setShowEditModal(false);
    setSaveAlert({
      open: true,
      message: 'Student details saved successfully!',
      onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
      confirmText: 'OK',
      type: 'success',
    });
  };

  const handleCancel = () => {
    setShowEditModal(false);
    setEditValues({});
  };

  return (
    // <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Student Enrollment</h1>
            <p className="text-gray-700">
              {loading ? 'Loading students from database...' : `View, edit and remove registered students. (${students.length} students)`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshStudents}
              disabled={loading}
              className={`px-4 py-2 text-white rounded transition-colors flex items-center gap-2 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
            <button
              onClick={() => {
                console.log('Current students from backend:', students);
                alert(`Current students from database: ${students.length}`);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              Debug Data
            </button>
          </div>
        </div>
        <BasicTable
          columns={[
            { key: 'studentId', label: 'Student ID' },
            { key: 'firstName', label: 'First Name', render: row => row.firstName },
            { key: 'lastName', label: 'Last Name', render: row => row.lastName },
            { key: 'dateOfBirth', label: 'Date of Birth' },
            { key: 'school', label: 'School' },
            { key: 'district', label: 'District' },
            { key: 'dateJoined', label: 'Date Joined' },
            { key: 'stream', label: 'Stream' },
            { 
              key: 'barcode', 
              label: 'Barcode Status', 
              render: row => (
                <div className="flex items-center gap-2">
                  {row.barcodeData ? (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                      Pending
                    </span>
                  )}
                </div>
              )
            },
          ]}
          data={loading ? [] : students}
          actions={row => (
            <div className="flex gap-2">
              <button 
                className="text-purple-600 hover:text-purple-800 hover:underline" 
                onClick={() => showBarcode(row)} 
                title="Barcode"
              >
                <FaBarcode />
              </button>
              <button className="text-blue-600 hover:underline" onClick={() => handleEdit(row)} title="Edit"><FaEdit /></button>
              <button className="text-red-600 hover:underline" onClick={() => showDeleteAlert(row.studentId)} title="Delete"><FaTrash /></button>
            </div>
          )}
          className="mb-6"
          loading={loading}
          emptyMessage={loading ? "Loading students from database..." : "No students found. Register some students first."}
        />

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-5xl max-h-[96vh] flex flex-col pointer-events-auto ml-64">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-xl font-bold">Edit Student</h2>
                <button
                  className="text-gray-500 hover:text-gray-800 text-2xl focus:outline-none"
                  onClick={handleCancel}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-4 flex-1">
                <BasicForm
                  initialValues={editValues}
                  validationSchema={validationSchema}
                  onSubmit={handleEditSubmit}
                >
                  {(formikProps) => {
                    const { values, handleChange, errors, touched, setFieldValue } = formikProps;
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <CustomTextField
                            id="dateJoined"
                            name="dateJoined"
                            type="date"
                            label="Joined Date *"
                            value={values.dateJoined || ''}
                            onChange={handleChange}
                            error={errors.dateJoined}
                            touched={touched.dateJoined}
                            icon={FaCalendar}
                          />
                          <CustomTextField
                            id="studentId"
                            name="studentId"
                            type="text"
                            label="Student ID *"
                            value={values.studentId}
                            onChange={handleChange}
                            error={errors.studentId}
                            touched={touched.studentId}
                            disabled
                            icon={FaIdCard}
                          />
                          <CustomTextField
                            id="nic"
                            name="nic"
                            type="text"
                            label="NIC (optional)"
                            value={values.nic || ''}
                            onChange={e => {
                              const { setFieldValue, handleChange } = formikProps;
                              handleChange(e);
                              const val = e.target.value;
                              const parsed = parseNIC(val);
                              if (parsed && typeof setFieldValue === 'function') {
                                setFieldValue('dateOfBirth', parsed.dob);
                                setFieldValue('age', parsed.age);
                                setFieldValue('gender', parsed.gender);
                              }
                            }}
                            error={errors.nic}
                            touched={touched.nic}
                            icon={FaIdCard}
                          />
                          <CustomTextField
                            id="firstName"
                            name="firstName"
                            type="text"
                            label="First Name *"
                            value={values.firstName || ''}
                            onChange={handleChange}
                            error={errors.firstName}
                            touched={touched.firstName}
                            icon={FaUser}
                          />
                          <CustomTextField
                            id="lastName"
                            name="lastName"
                            type="text"
                            label="Last Name *"
                            value={values.lastName || ''}
                            onChange={handleChange}
                            error={errors.lastName}
                            touched={touched.lastName}
                            icon={FaUser}
                          />
                          <CustomTextField
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            label="Date of Birth *"
                            value={values.dateOfBirth}
                            onChange={handleChange}
                            error={errors.dateOfBirth}
                            touched={touched.dateOfBirth}
                            icon={FaCalendar}
                          />
                          <CustomTextField
                            id="age"
                            name="age"
                            type="number"
                            label="Age"
                            value={values.age || ''}
                            onChange={handleChange}
                            error={errors.age}
                            touched={touched.age}
                            icon={FaCalendar}
                            disabled
                          />
                          <CustomSelectField
                            id="gender"
                            name="gender"
                            label="Gender"
                            value={values.gender}
                            onChange={handleChange}
                            options={[
                              { value: '', label: 'Select Gender' },
                              ...genderOptions.map(s => ({ value: s, label: s }))
                            ]}
                            error={errors.gender}
                            touched={touched.gender}
                            required
                            icon={FaBook}
                          />
                          <CustomTextField
                            id="email"
                            name="email"
                            type="email"
                            label="Email *"
                            value={values.email}
                            onChange={handleChange}
                            error={errors.email}
                            touched={touched.email}
                            icon={FaEnvelope}
                          />
                          <CustomTextField
                            id="school"
                            name="school"
                            type="text"
                            label="School"
                            value={values.school}
                            onChange={handleChange}
                            error={errors.school}
                            touched={touched.school}
                            icon={FaBook}
                          />
                          <CustomTextField
                            id="address"
                            name="address"
                            type="text"
                            label="Address"
                            value={values.address || ''}
                            onChange={handleChange}
                            error={errors.address}
                            touched={touched.address}
                            icon={FaBook}
                          />
                          <CustomTextField
                            id="district"
                            name="district"
                            type="text"
                            label="District *"
                            value={values.district}
                            onChange={handleChange}
                            error={errors.district}
                            touched={touched.district}
                            icon={FaBook}
                          />
                          
                          <CustomTextField
                            id="phone"
                            name="phone"
                            type="text"
                            label="Mobile"
                            value={values.phone}
                            onChange={handleChange}
                            error={errors.phone}
                            touched={touched.phone}
                            icon={FaPhone}
                          />
                          <CustomSelectField
                            id="stream"
                            name="stream"
                            label="Stream"
                            value={values.stream}
                            onChange={handleChange}
                            options={[
                              { value: '', label: 'Select Stream' },
                              ...streamOptions.map(s => ({ value: s, label: s }))
                            ]}
                            error={errors.stream}
                            touched={touched.stream}
                            required
                            icon={FaBook}
                          />
                          <CustomTextField
                            id="parentName"
                            name="parentName"
                            type="text"
                            label="Parent Name"
                            value={values.parentName || ''}
                            onChange={handleChange}
                            error={errors.parentName}
                            touched={touched.parentName}
                            icon={FaUser}
                          />
                          <CustomTextField
                            id="parentPhone"
                            name="parentPhone"
                            type="text"
                            label="Parent Mobile Number"
                            value={values.parentPhone || ''}
                            onChange={handleChange}
                            error={errors.parentPhone}
                            touched={touched.parentPhone}
                            icon={FaPhone}
                          />

                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Enrolled Classes</label>
                          <FieldArray name="enrolledClasses">
                            {({ push, remove }) => (
                              <>
                                <BasicTable
                                  columns={[
                                    { key: 'subject', label: 'Subject', render: (row, idx) => (
                                      <CustomTextField
                                        id={`enrolledClasses[${idx}].subject`}
                                        name={`enrolledClasses[${idx}].subject`}
                                        type="text"
                                        label=""
                                        value={row.subject}
                                        onChange={handleChange}
                                        icon={FaBook}
                                        className="w-full focus:ring-2 focus:ring-blue-400"
                                      />
                                    ) },
                                    { key: 'teacher', label: 'Teacher', render: (row, idx) => (
                                      <CustomTextField
                                        id={`enrolledClasses[${idx}].teacher`}
                                        name={`enrolledClasses[${idx}].teacher`}
                                        type="text"
                                        label=""
                                        value={row.teacher}
                                        onChange={handleChange}
                                        icon={FaUser}
                                        className="w-full focus:ring-2 focus:ring-blue-400"
                                      />
                                    ) },
                                    { key: 'schedule', label: 'Schedule', render: (row, idx) => (
                                      <CustomTextField
                                        id={`enrolledClasses[${idx}].schedule`}
                                        name={`enrolledClasses[${idx}].schedule`}
                                        type="text"
                                        label=""
                                        value={row.schedule}
                                        onChange={handleChange}
                                        icon={FaCalendar}
                                        className="w-full focus:ring-2 focus:ring-blue-400"
                                      />
                                    ) },
                                    { key: 'hall', label: 'Hall', render: (row, idx) => (
                                      <CustomTextField
                                        id={`enrolledClasses[${idx}].hall`}
                                        name={`enrolledClasses[${idx}].hall`}
                                        type="text"
                                        label=""
                                        value={row.hall}
                                        onChange={handleChange}
                                        icon={FaBook}
                                        className="w-full focus:ring-2 focus:ring-blue-400"
                                      />
                                    ) },
                                  ]}
                                  data={values.enrolledClasses?.map((row, idx) => ({ ...row, _idx: idx })) || []}
                                  actions={row => (
                                    <button
                                      type="button"
                                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-semibold shadow focus:outline-none focus:ring-2 focus:ring-red-400"
                                      onClick={() => showRemoveClassAlert(remove, row._idx)}
                                    >
                                      Remove
                                    </button>
                                  )}
                                  className="min-w-[900px]"
                                  rowsPerPage={1000}
                                  page={1}
                                  totalCount={values.enrolledClasses?.length || 0}
                                  onPageChange={() => {}}
                                  onRowsPerPageChange={() => {}}
                                />
                                <button
                                  type="button"
                                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-bold shadow focus:outline-none focus:ring-2 focus:ring-green-400"
                                  onClick={() => push({ subject: '', teacher: '', schedule: '', hall: '' })}
                                >
                                  + Add Class
                                </button>
                              </>
                            )}
                          </FieldArray>
                        </div>

                        <div className="flex flex-row gap-4 mt-8 mb-2">
                          <CustomButton
                            type="button"
                            onClick={handleCancel}
                            className="w-1/2 py-3 px-4 bg-gray-200 text-gray-700 text-base font-bold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 shadow-md hover:shadow-xl"
                          >
                            Cancel
                          </CustomButton>
                          <CustomButton
                            type="submit"
                            className="w-1/2 py-3 px-4 bg-[#1a365d] text-white text-base font-bold rounded-lg hover:bg-[#13294b] active:bg-[#0f2038] focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:ring-opacity-50 shadow-md hover:shadow-xl"
                          >
                            Save
                          </CustomButton>
                        </div>
                      </>
                    );
                  }}
                </BasicForm>
              </div>
            </div>
          </div>
        )}

        <BasicAlertBox
          open={alertBox.open}
          message={alertBox.message}
          onConfirm={alertBox.onConfirm}
          onCancel={alertBox.onCancel}
          confirmText={alertBox.confirmText}
          cancelText={alertBox.cancelText}
          type={alertBox.type}
        />
        <BasicAlertBox
          open={saveAlert.open}
          message={saveAlert.message}
          onConfirm={saveAlert.onConfirm}
          confirmText={saveAlert.confirmText}
          type={saveAlert.type}
        />

        {/* Modern Barcode Modal */}
        {showBarcodeModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[#1a365d] flex items-center gap-3">
                  <FaBarcode className="text-[#3da58a] text-2xl" />
                  Student Barcode Management
                </h3>
                <button
                  onClick={() => setShowBarcodeModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Student Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-lg text-[#1a365d] mb-3 flex items-center gap-2">
                    <FaUser className="text-[#3da58a]" />
                    Student Information
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Name:</span>
                      <span className="text-[#1a365d]">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Student ID:</span>
                      <span className="text-[#1a365d]">{selectedStudent.studentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">School:</span>
                      <span className="text-[#1a365d]">{selectedStudent.school}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Stream:</span>
                      <span className="text-[#1a365d]">{selectedStudent.stream}</span>
                    </div>
                    {selectedStudent.barcodeGeneratedAt && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Barcode Generated:</span>
                        <span className="text-[#1a365d]">{new Date(selectedStudent.barcodeGeneratedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Barcode Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-lg text-[#1a365d] mb-3 flex items-center gap-2">
                    <FaBarcode className="text-[#3da58a]" />
                    Barcode Status
                  </h4>
                  <div className="space-y-3">
                    {selectedStudent.barcodeData ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                          <div className="flex items-center gap-3 text-emerald-800">
                    <span className="font-semibold text-xs">Barcode Active</span>
                  </div>
                        <p className="text-xs text-emerald-700 mt-2">
                          This student has an active barcode for attendance tracking.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 text-amber-800">
                          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                          <span className="font-semibold text-lg">Barcode Pending</span>
                        </div>
                        <p className="text-sm text-amber-700 mt-2">
                          Generate a barcode for this student to enable attendance tracking.
                        </p>
                      </div>
                    )}
                    
                    {!selectedStudent.barcodeData && (
                      <CustomButton2
                        onClick={handleGenerateBarcode}
                        className="flex items-center justify-center gap-2"
                      >
                        <FaBarcode />
                        Generate Barcode
                      </CustomButton2>
                    )}
                  </div>
                </div>
              </div>

              {/* Barcode Display */}
              {selectedStudent.barcodeData && (
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
                  <h4 className="font-semibold text-lg text-[#1a365d] mb-4 flex items-center justify-center gap-2">
                    <FaBarcode className="text-[#3da58a]" />
                    Attendance Barcode
                  </h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 min-h-[80px] flex items-center justify-center">
                    <canvas 
                      id="student-barcode-display" 
                      className="mx-auto"
                      style={{ minHeight: '60px' }}
                    ></canvas>
                  </div>
                  

                  
                  <div className="flex gap-3 justify-center">
                    <CustomButton2
                      onClick={() => downloadBarcode(selectedStudent)}
                      className="flex items-center justify-center gap-2 text-center"
                    >
                      <FaDownload />
                      Download PNG
                    </CustomButton2>
                    <CustomButton2
                      onClick={printBarcode}
                      className="flex items-center justify-center gap-2 text-center"
                    >
                      <FaPrint />
                      Print Barcode
                    </CustomButton2>
                    <CustomButton2
                      onClick={generateIDCard}
                      className="flex items-center justify-center gap-2 text-center"
                    >
                      <FaIdCard />
                      Generate ID Card
                    </CustomButton2>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FaEye className="text-blue-600" />
                  How to Use
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Download or print the barcode for physical attendance tracking</li>
                  <li>• Use the barcode scanner in the Attendance Overview to mark attendance</li>
                  <li>• Each barcode is unique to the student and cannot be duplicated</li>
                  <li>• Barcode contains the student's unique ID for secure tracking</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    /* </DashboardLayout> */
  );
};

export default StudentEnrollment;
