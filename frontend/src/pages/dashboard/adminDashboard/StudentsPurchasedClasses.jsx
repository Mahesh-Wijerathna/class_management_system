import React, { useState, useEffect } from 'react';
import BasicTable from '../../../components/BasicTable';
import { getAllStudents } from '../../../api/students';
import { getStudentEnrollments, updateEnrollment, dropEnrollment } from '../../../api/enrollments';
import { getStudentPayments } from '../../../api/payments';
import { getAllClasses } from '../../../api/classes';
import { FaUser, FaGraduationCap, FaMoneyBill, FaCalendar, FaPhone, FaEnvelope, FaSchool, FaMapMarkerAlt, FaSync, FaSearch, FaFilter, FaTimes, FaEdit, FaTrash, FaDownload, FaPrint, FaSave, FaCheck, FaExclamationTriangle, FaPlus } from 'react-icons/fa';

const StudentsPurchasedClasses = ({ onLogout }) => {
    const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [studentDetails, setStudentDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [streamFilter, setStreamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Edit enrollment modal states
  const [showEditEnrollmentModal, setShowEditEnrollmentModal] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete confirmation states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEnrollment, setDeletingEnrollment] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState({ show: false, type: '', text: '' });

  // New Enrollment State
  const [showNewEnrollmentModal, setShowNewEnrollmentModal] = useState(false);
  const [newEnrollmentData, setNewEnrollmentData] = useState({
    classId: '',
    paymentMethod: 'cash',
    amount: '',
    notes: '',
    speedPostFee: 0,
    tuteCollectionType: 'physical'
  });
  const [newEnrollmentLoading, setNewEnrollmentLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Load all students and classes
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load students and classes in parallel
      const [studentsResponse, classesResponse] = await Promise.all([
        getAllStudents(),
        getAllClasses()
      ]);

      if (studentsResponse.success && classesResponse.success) {
        setStudents(studentsResponse.students || []);
        setClasses(classesResponse.data || []);
        
        // Load detailed data for each student
        await loadStudentDetails(studentsResponse.students || [], classesResponse.data || []);
    } else {
        setError('Failed to load data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Load detailed information for each student
  const loadStudentDetails = async (studentsList, classesList) => {
    const details = [];

    for (const student of studentsList) {
      try {
        // Load enrollments and payments for this student
        const [enrollmentsResponse, paymentsResponse] = await Promise.all([
          getStudentEnrollments(student.userid),
          getStudentPayments(student.userid)
        ]);

        const enrollments = enrollmentsResponse.success ? enrollmentsResponse.data || [] : [];
        const payments = paymentsResponse.success ? paymentsResponse.data || [] : [];

        // Create detailed student record
        const studentDetail = {
          // Student Information
          studentId: student.userid,
          studentName: `${student.firstName} ${student.lastName}`,
          email: student.email,
          mobile: student.mobile,
          stream: student.stream,
          school: student.school,
          district: student.district,
          dateJoined: student.dateJoined,
          gender: student.gender,
          age: student.age,
          parentName: student.parentName,
          parentMobile: student.parentMobile,
          nic: student.nic,
          dateOfBirth: student.dateOfBirth,
          address: student.address,
          
          // Enrollment Summary
          totalEnrollments: enrollments.length,
          activeEnrollments: enrollments.filter(e => e.status === 'active').length,
          
          // Payment Summary
          totalPayments: payments.length,
          totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
          lastPaymentDate: payments.length > 0 ? payments[0].date : null,
          
          // Detailed Data
          enrollments: enrollments,
          payments: payments,
          
          // Status
          status: 'active' // You can add logic to determine status
        };

        details.push(studentDetail);
      } catch (error) {
        console.error(`Error loading details for student ${student.userid}:`, error);
        // Add student with basic info even if details fail to load
        details.push({
          studentId: student.userid,
          studentName: `${student.firstName} ${student.lastName}`,
          email: student.email,
          mobile: student.mobile,
          stream: student.stream,
          school: student.school,
          district: student.district,
          dateJoined: student.dateJoined,
          gender: student.gender,
          age: student.age,
          parentName: student.parentName,
          parentMobile: student.parentMobile,
          nic: student.nic,
          dateOfBirth: student.dateOfBirth,
          address: student.address,
          totalEnrollments: 0,
          activeEnrollments: 0,
          totalPayments: 0,
          totalAmount: 0,
          lastPaymentDate: null,
          enrollments: [],
          payments: [],
          status: 'active'
        });
      }
    }

    setStudentDetails(details);
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter students based on search term and filters
  const filteredStudents = studentDetails.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.mobile.includes(searchTerm);
    
    const matchesStream = streamFilter === '' || student.stream === streamFilter;
    const matchesStatus = statusFilter === '' || student.status === statusFilter;
    
    return matchesSearch && matchesStream && matchesStatus;
  });

  // Get unique streams for filter dropdown
  const uniqueStreams = [...new Set(students.map(s => s.stream))].filter(Boolean);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-LK');
  };

  // Get class name from enrollment data (enrollment already contains class_name)
  const getClassName = (enrollment) => {
    // If enrollment has class_name directly, use it
    if (enrollment.class_name) {
      return enrollment.class_name;
    }
    
    // Fallback to mapping from classes array if needed
    if (enrollment.class_id) {
      const cls = classes.find(c => c.id === enrollment.class_id);
      return cls ? cls.className : 'Unknown Class';
    }
    
    return 'Unknown Class';
  };

  // Show message helper
  const showMessage = (type, text) => {
    setMessage({ show: true, type, text });
    setTimeout(() => setMessage({ show: false, type: '', text: '' }), 5000);
  };

  // Action button handlers
  const handleViewDetails = (student) => {
      setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const handleManageEnrollments = (student) => {
    setSelectedStudent(student);
    setShowEnrollmentModal(true);
  };

  const handlePaymentHistory = (student) => {
        setSelectedStudent(student);
    setShowPaymentModal(true);
  };

  // Close modal handlers
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedStudent(null);
  };

  const closeEnrollmentModal = () => {
    setShowEnrollmentModal(false);
    setSelectedStudent(null);
  };

  const closePaymentModal = () => {
    setSelectedStudent(null);
    setShowPaymentModal(false);
  };

  // New Enrollment Handlers
  const handleNewEnrollment = async (student) => {
    console.log('Opening new enrollment for student:', student);
    setSelectedStudent(student);
    setShowNewEnrollmentModal(true);
    
    // Load available classes for enrollment
    try {
      await loadAvailableClasses();
    } catch (error) {
      console.error('Error loading classes for new enrollment:', error);
      showMessage('error', 'Failed to load available classes');
    }
  };

  const closeNewEnrollmentModal = () => {
    setShowNewEnrollmentModal(false);
    setSelectedStudent(null);
    setNewEnrollmentData({
      classId: '',
      paymentMethod: 'cash',
      amount: '',
      notes: '',
      speedPostFee: 0,
      tuteCollectionType: 'physical'
    });
  };

  const loadAvailableClasses = async () => {
    try {
      setLoadingClasses(true);
      console.log('Loading available classes for student:', selectedStudent);
      const response = await getAllClasses();
      console.log('Classes response:', response);
      
      if (response.success && response.data) {
        // Filter only active classes that exactly match student's stream
        const activeClasses = response.data.filter(cls => {
          // Class must be active
          if (cls.status !== 'active') return false;
          
          // Only show classes that exactly match the student's stream
          const matches = cls.stream === selectedStudent.stream;
          console.log(`Class ${cls.className} (${cls.stream}) matches ${selectedStudent.stream}: ${matches}`);
          return matches;
        });
        
        console.log('Available classes for student:', activeClasses);
        console.log('First available class details:', activeClasses[0]);
        setAvailableClasses(activeClasses);
      } else {
        console.error('Failed to load classes:', response);
        setAvailableClasses([]);
      }
    } catch (error) {
      console.error('Error loading available classes:', error);
      showMessage('error', 'Failed to load available classes');
      setAvailableClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleNewEnrollmentChange = (field, value) => {
    setNewEnrollmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClassSelection = (classId) => {
    console.log('Class selection changed:', classId);
    console.log('Available classes:', availableClasses);
    
    const selectedClass = availableClasses.find(cls => {
      const match = cls.id === parseInt(classId) || cls.id === classId;
      console.log(`Comparing class ${cls.id} (${typeof cls.id}) with ${classId} (${typeof classId}): ${match}`);
      return match;
    });
    
    console.log('Selected class:', selectedClass);
    
    if (selectedClass) {
      setNewEnrollmentData(prev => ({
        ...prev,
        classId: classId,
        amount: selectedClass.fee || 0
      }));
    }
  };

  const calculateTotalAmount = () => {
    const baseAmount = parseFloat(newEnrollmentData.amount) || 0;
    const speedPostFee = parseFloat(newEnrollmentData.speedPostFee) || 0;
    return baseAmount + speedPostFee;
  };

  const handleCreateEnrollment = async () => {
    if (!newEnrollmentData.classId || !newEnrollmentData.amount) {
      showMessage('error', 'Please select a class and enter amount');
      return;
    }

    try {
      setNewEnrollmentLoading(true);
      
      console.log('Creating enrollment with data:', newEnrollmentData);
      console.log('Available classes:', availableClasses);
      
      const selectedClass = availableClasses.find(cls => {
        const match = cls.id === parseInt(newEnrollmentData.classId) || cls.id === newEnrollmentData.classId;
        console.log(`Looking for class ID ${newEnrollmentData.classId}, checking class ${cls.id}: ${match}`);
        return match;
      });
      
      console.log('Selected class for enrollment:', selectedClass);
      
      const totalAmount = calculateTotalAmount();
      
      // Create payment record
      const paymentData = {
        studentId: selectedStudent.studentId,
        classId: parseInt(newEnrollmentData.classId),
        amount: totalAmount,
        paymentMethod: newEnrollmentData.paymentMethod,
        notes: newEnrollmentData.notes || `Manual enrollment by admin. ${newEnrollmentData.tuteCollectionType === 'speedPost' ? 'Speed Post delivery.' : 'Physical class.'}`,
        status: 'paid'
      };

      // Call the payment creation API
      const response = await fetch('http://localhost:8087/routes.php/create_payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (result.success) {
        // Create enrollment directly
        const enrollmentData = {
          class_id: parseInt(newEnrollmentData.classId),
          student_id: selectedStudent.studentId,
          enrollment_date: new Date().toISOString().split('T')[0],
          status: 'active',
          payment_status: 'paid',
          total_fee: totalAmount,
          paid_amount: totalAmount,
          next_payment_date: null // Will be calculated by backend if needed
        };

        const enrollmentResponse = await fetch('http://localhost:8087/routes.php/create_enrollment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(enrollmentData)
        });

        const enrollmentResult = await enrollmentResponse.json();
        console.log('Enrollment creation result:', enrollmentResult);

        if (enrollmentResult.success) {
          showMessage('success', `Enrollment created successfully! Payment: Rs. ${totalAmount}`);
          
          // Generate receipt with proper class data
          console.log('Generating receipt with class data:', selectedClass);
          generateReceipt(selectedStudent, selectedClass, paymentData, result.data, totalAmount);
          
          await loadData(); // Reload data to show new enrollment
          closeNewEnrollmentModal();
        } else {
          showMessage('error', enrollmentResult.message || 'Payment created but enrollment failed');
        }
      } else {
        showMessage('error', result.message || 'Failed to create enrollment');
      }
    } catch (error) {
      console.error('Error creating enrollment:', error);
      showMessage('error', 'Failed to create enrollment');
    } finally {
      setNewEnrollmentLoading(false);
    }
  };

  const generateReceipt = (student, classData, paymentData, paymentResult, totalAmount) => {
    const receiptWindow = window.open('', '_blank');
    const receiptDate = new Date().toLocaleDateString();
    const receiptTime = new Date().toLocaleTimeString();
    
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Enrollment Receipt - ${student.studentName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: #f5f5f5;
              padding: 10px;
              font-size: 10px;
              line-height: 1.3;
            }
            .receipt {
              width: 80mm;
              max-width: 300px;
              background: white;
              margin: 0 auto;
              padding: 15px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              border-radius: 8px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .title {
              color: #2563eb;
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 2px;
            }
            .subtitle {
              color: #6b7280;
              font-size: 10px;
            }
            .receipt-id {
              background: #2563eb;
              color: white;
              padding: 5px;
              border-radius: 4px;
              text-align: center;
              font-size: 9px;
              margin-bottom: 10px;
            }
            .section {
              margin-bottom: 8px;
            }
            .section-title {
              font-weight: bold;
              color: #374151;
              font-size: 9px;
              margin-bottom: 3px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 2px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-size: 9px;
            }
            .label {
              color: #6b7280;
              font-weight: 500;
            }
            .value {
              color: #374151;
              text-align: right;
            }
            .amount-box {
              background: #f0f9ff;
              border: 2px solid #2563eb;
              border-radius: 6px;
              padding: 8px;
              margin: 8px 0;
            }
            .total-amount {
              font-size: 16px;
              font-weight: bold;
              color: #2563eb;
              text-align: center;
              margin: 5px 0;
            }
            .status {
              background: #dcfce7;
              color: #166534;
              text-align: center;
              padding: 5px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: bold;
              margin: 8px 0;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
              gap: 10px;
            }
            .signature {
              flex: 1;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 20px;
              margin-bottom: 3px;
            }
            .signature-text {
              font-size: 8px;
              color: #6b7280;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              padding-top: 8px;
              border-top: 1px solid #e5e7eb;
              font-size: 8px;
              color: #6b7280;
            }
            .divider {
              border-top: 1px dashed #d1d5db;
              margin: 5px 0;
            }
            @media print {
              body { background: white; padding: 0; }
              .receipt { 
                box-shadow: none; 
                border: 1px solid #d1d5db;
                width: 100%;
                max-width: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="title">🎓 Class Management System</div>
              <div class="subtitle">Enrollment Receipt</div>
            </div>
            
            <div class="receipt-id">
              Receipt #: ${paymentResult?.transaction_id || 'ENR-' + Date.now()}
            </div>
            
            <div class="section">
              <div class="section-title">👤 STUDENT INFO</div>
              <div class="row"><span class="label">Name:</span><span class="value">${student.studentName}</span></div>
              <div class="row"><span class="label">ID:</span><span class="value">${student.studentId}</span></div>
              <div class="row"><span class="label">Stream:</span><span class="value">${student.stream}</span></div>
              <div class="row"><span class="label">School:</span><span class="value">${student.school}</span></div>
            </div>
            
            <div class="section">
              <div class="section-title">📚 CLASS INFO</div>
              <div class="row"><span class="label">Class:</span><span class="value">${classData?.className || 'N/A'}</span></div>
              <div class="row"><span class="label">Subject:</span><span class="value">${classData?.subject || 'N/A'}</span></div>
              <div class="row"><span class="label">Teacher:</span><span class="value">${classData?.teacher || 'N/A'}</span></div>
              <div class="row"><span class="label">Method:</span><span class="value">${classData?.deliveryMethod || 'N/A'}</span></div>
            </div>
            
            <div class="amount-box">
              <div class="section-title">💰 PAYMENT DETAILS</div>
              <div class="row"><span class="label">Class Fee:</span><span class="value">Rs. ${formatCurrency(paymentData.amount - (newEnrollmentData.speedPostFee || 0))}</span></div>
              ${newEnrollmentData.speedPostFee > 0 ? `
              <div class="row"><span class="label">Speed Post:</span><span class="value">Rs. ${formatCurrency(newEnrollmentData.speedPostFee)}</span></div>
              ` : ''}
              <div class="row"><span class="label">Method:</span><span class="value">${paymentData.paymentMethod.toUpperCase()}</span></div>
              <div class="row"><span class="label">Collection:</span><span class="value">${newEnrollmentData.tuteCollectionType === 'speedPost' ? 'Speed Post' : 'Physical'}</span></div>
              <div class="total-amount">Total: Rs. ${formatCurrency(totalAmount)}</div>
            </div>
            
            <div class="status">✅ PAYMENT COMPLETED</div>
            
            <div class="section">
              <div class="section-title">📅 ENROLLMENT INFO</div>
              <div class="row"><span class="label">Date:</span><span class="value">${receiptDate}</span></div>
              <div class="row"><span class="label">Time:</span><span class="value">${receiptTime}</span></div>
              <div class="row"><span class="label">By:</span><span class="value">Administrator</span></div>
            </div>
            
            ${paymentData.notes ? `
            <div class="section">
              <div class="section-title">📝 NOTES</div>
              <div style="background: #f9fafb; padding: 5px; border-radius: 3px; font-size: 8px; color: #6b7280;">
                ${paymentData.notes}
              </div>
            </div>
            ` : ''}
            
            <div class="signatures">
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-text">Student</div>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-text">Admin</div>
              </div>
            </div>
            
            <div class="footer">
              <div>Thank you for enrolling!</div>
              <div>Generated: ${receiptDate} ${receiptTime}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    receiptWindow.document.close();
    receiptWindow.print();
  };

  // Enrollment action handlers
  const handleEditEnrollment = (enrollment) => {
    setEditingEnrollment(enrollment);
    setEditFormData({
      status: enrollment.status || 'active',
      payment_status: enrollment.payment_status || 'paid',
      notes: enrollment.notes || ''
    });
    setShowEditEnrollmentModal(true);
  };

  const handleDeleteEnrollment = (enrollment) => {
    setDeletingEnrollment(enrollment);
    setShowDeleteModal(true);
  };

  // Real delete enrollment
  const confirmDeleteEnrollment = async () => {
    if (!deletingEnrollment) return;

    try {
      setDeleteLoading(true);
      const response = await dropEnrollment(deletingEnrollment.id);
      
      if (response.success) {
        showMessage('success', `Enrollment for ${getClassName(deletingEnrollment)} deleted successfully`);
        // Reload data to reflect changes
        await loadData();
        setShowDeleteModal(false);
        setDeletingEnrollment(null);
      } else {
        showMessage('error', response.message || 'Failed to delete enrollment');
      }
      } catch (error) {
      console.error('Error deleting enrollment:', error);
      showMessage('error', 'Failed to delete enrollment');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Real update enrollment
  const handleUpdateEnrollment = async () => {
    if (!editingEnrollment) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const response = await updateEnrollment(editingEnrollment.id, editFormData);
      
      if (response.success) {
        showMessage('success', `Enrollment for ${getClassName(editingEnrollment)} updated successfully`);
        // Reload data to reflect changes
        await loadData();
        setShowEditEnrollmentModal(false);
        setEditingEnrollment(null);
        setEditFormData({});
      } else {
        setEditError(response.message || 'Failed to update enrollment');
      }
    } catch (error) {
      console.error('Error updating enrollment:', error);
      setEditError('Failed to update enrollment');
    } finally {
      setEditLoading(false);
    }
  };

  // Payment action handlers
  const handleDownloadPayment = (payment) => {
    const paymentData = {
      transactionId: payment.transaction_id,
      date: payment.date,
      studentName: selectedStudent?.studentName,
      studentId: selectedStudent?.studentId,
      className: payment.class_name,
      amount: payment.amount,
      paymentMethod: payment.payment_method,
      status: payment.status,
      referenceNumber: payment.reference_number
    };
    
    const blob = new Blob([JSON.stringify(paymentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_${payment.transaction_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('success', 'Payment receipt downloaded successfully');
  };

  const handlePrintPayment = (payment) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${payment.transaction_id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .receipt { border: 1px solid #ddd; padding: 20px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { font-weight: bold; }
            .amount { font-size: 24px; font-weight: bold; color: #28a745; text-align: center; margin: 20px 0; }
            .status { text-align: center; margin: 10px 0; }
            .status.paid { color: #28a745; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Receipt</h1>
            <h2>Class Management System</h2>
      </div>
          
          <div class="receipt">
            <div class="amount">${formatCurrency(payment.amount)}</div>
            <div class="status ${payment.status}">Status: ${payment.status.toUpperCase()}</div>
            
            <div class="info-row">
              <span class="label">Transaction ID:</span>
              <span>${payment.transaction_id}</span>
      </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span>${formatDate(payment.date)}</span>
      </div>
            <div class="info-row">
              <span class="label">Student Name:</span>
              <span>${selectedStudent?.studentName}</span>
      </div>
            <div class="info-row">
              <span class="label">Student ID:</span>
              <span>${selectedStudent?.studentId}</span>
      </div>
            <div class="info-row">
              <span class="label">Class:</span>
              <span>${payment.class_name}</span>
    </div>
            <div class="info-row">
              <span class="label">Payment Method:</span>
              <span>${payment.payment_method}</span>
          </div>
            <div class="info-row">
              <span class="label">Reference Number:</span>
              <span>${payment.reference_number}</span>
        </div>
      </div>
          
          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    
    showMessage('success', 'Payment receipt sent to printer');
  };

  // Export functions
  const exportStudentData = (student) => {
    const data = {
      student: student,
      enrollments: student.enrollments,
      payments: student.payments,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_${student.studentId}_data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('success', 'Student data exported successfully');
  };

  const printStudentReport = (student) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Report - ${student.studentName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section h3 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
            .info-row { display: flex; margin-bottom: 10px; }
            .label { font-weight: bold; width: 150px; }
            .value { flex: 1; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
            .total { font-weight: bold; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Report</h1>
            <h2>${student.studentName} (${student.studentId})</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <h3>Personal Information</h3>
            <div class="info-row"><span class="label">Name:</span><span class="value">${student.studentName}</span></div>
            <div class="info-row"><span class="label">Student ID:</span><span class="value">${student.studentId}</span></div>
            <div class="info-row"><span class="label">Email:</span><span class="value">${student.email}</span></div>
            <div class="info-row"><span class="label">Mobile:</span><span class="value">${student.mobile}</span></div>
            <div class="info-row"><span class="label">Stream:</span><span class="value">${student.stream}</span></div>
            <div class="info-row"><span class="label">School:</span><span class="value">${student.school}</span></div>
            <div class="info-row"><span class="label">District:</span><span class="value">${student.district}</span></div>
            <div class="info-row"><span class="label">Date Joined:</span><span class="value">${formatDate(student.dateJoined)}</span></div>
        </div>

          <div class="section">
            <h3>Enrollment Summary</h3>
            <div class="info-row"><span class="label">Total Enrollments:</span><span class="value">${student.totalEnrollments}</span></div>
            <div class="info-row"><span class="label">Active Enrollments:</span><span class="value">${student.activeEnrollments}</span></div>
              </div>
          
          <div class="section">
            <h3>Payment Summary</h3>
            <div class="info-row"><span class="label">Total Payments:</span><span class="value">${student.totalPayments}</span></div>
            <div class="info-row"><span class="label">Total Amount:</span><span class="value">${formatCurrency(student.totalAmount)}</span></div>
            <div class="info-row"><span class="label">Last Payment:</span><span class="value">${formatDate(student.lastPaymentDate)}</span></div>
              </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    
    showMessage('success', 'Student report sent to printer');
  };

  // Table columns configuration
  const columns = [
    {
      key: 'studentInfo',
      label: 'Student Information',
      render: (row) => (
        <div className="space-y-1">
          <div className="font-semibold text-blue-600">{row.studentName}</div>
          <div className="text-sm text-gray-600">ID: {row.studentId}</div>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <FaEnvelope className="text-gray-400" />
            {row.email}
            </div>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <FaPhone className="text-gray-400" />
            {row.mobile}
          </div>
              </div>
      )
    },
    {
      key: 'academicInfo',
      label: 'Academic Details',
      render: (row) => (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">Stream:</span> 
            <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
              {row.stream}
            </span>
              </div>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <FaSchool className="text-gray-400" />
            {row.school}
            </div>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <FaMapMarkerAlt className="text-gray-400" />
            {row.district}
          </div>
          <div className="text-sm text-gray-600">
            Joined: {formatDate(row.dateJoined)}
              </div>
              </div>
      )
    },
    {
      key: 'enrollmentSummary',
      label: 'Enrollment Summary',
      render: (row) => (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Enrollments:</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
              {row.totalEnrollments}
            </span>
            </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Active:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
              {row.activeEnrollments}
            </span>
          </div>
          {row.enrollments.length > 0 && (
            <div className="text-xs text-gray-600">
              <div className="font-medium mb-1">Recent Classes:</div>
              {row.enrollments.slice(0, 2).map((enrollment, index) => (
                <div key={index} className="mb-1">
                  • {getClassName(enrollment)}
              </div>
              ))}
              {row.enrollments.length > 2 && (
                <div className="text-gray-500">+{row.enrollments.length - 2} more</div>
        )}
              </div>
          )}
            </div>
      )
    },
    {
      key: 'paymentSummary',
      label: 'Payment Summary',
      render: (row) => (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Payments:</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-semibold">
              {row.totalPayments}
      </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Amount:</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
              {formatCurrency(row.totalAmount)}
      </span>
        </div>
          {row.lastPaymentDate && (
            <div className="text-xs text-gray-600">
              <div className="font-medium">Last Payment:</div>
              <div className="flex items-center gap-1">
                <FaCalendar className="text-gray-400" />
                {formatDate(row.lastPaymentDate)}
      </div>
            </div>
          )}
          {row.payments.length > 0 && (
            <div className="text-xs text-gray-600">
              <div className="font-medium mb-1">Recent Payments:</div>
              {row.payments
                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, most recent first
                .slice(0, 3)
                .map((payment, index) => (
                <div key={index} className="mb-1">
                  {index === 0 && <span className="font-medium text-green-600">● Latest:</span>}
                  {index === 1 && <span className="font-medium text-blue-600">● 2nd:</span>}
                  {index === 2 && <span className="font-medium text-purple-600">● 3rd:</span>}
                  {' '}{formatCurrency(payment.amount)} ({payment.payment_method}) - {formatDate(payment.date)}
          </div>
              ))}
              {row.payments.length > 3 && (
                <div className="text-gray-500 mt-1">
                  +{row.payments.length - 3} more payments
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="space-y-2">
      <button
            className="w-full px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
            onClick={() => handleViewDetails(row)}
            title="View complete student details"
          >
            <FaUser className="text-xs" />
            View Details
      </button>
            <button
            className="w-full px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
            onClick={() => handleManageEnrollments(row)}
            title="Manage class enrollments"
            >
            <FaGraduationCap className="text-xs" />
            Manage Enrollments
            </button>
        <button 
            className="w-full px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
            onClick={() => handlePaymentHistory(row)}
            title="View payment history"
        >
            <FaMoneyBill className="text-xs" />
            Payment History
        </button>
          <div className="flex gap-1 mt-2">
        <button 
              className="flex-1 px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors flex items-center justify-center"
              onClick={() => exportStudentData(row)}
              title="Export student data"
            >
              <FaDownload className="text-xs" />
            </button>
            <button
              className="flex-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors flex items-center justify-center"
              onClick={() => printStudentReport(row)}
              title="Print student report"
            >
              <FaPrint className="text-xs" />
        </button>
      </div>
        </div>
      )
    }
  ];

  // Modal Components
  const DetailsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Student Details</h2>
                <button
            onClick={closeDetailsModal}
            className="text-gray-500 hover:text-gray-700"
                >
            <FaTimes className="text-xl" />
                </button>
            </div>

        {selectedStudent && (
            <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Personal Information</h3>
                <div className="space-y-2">
                  <div><span className="font-medium">Name:</span> {selectedStudent.studentName}</div>
                  <div><span className="font-medium">Student ID:</span> {selectedStudent.studentId}</div>
                  <div><span className="font-medium">Email:</span> {selectedStudent.email}</div>
                  <div><span className="font-medium">Mobile:</span> {selectedStudent.mobile}</div>
                  <div><span className="font-medium">NIC:</span> {selectedStudent.nic || 'N/A'}</div>
                  <div><span className="font-medium">Gender:</span> {selectedStudent.gender}</div>
                  <div><span className="font-medium">Age:</span> {selectedStudent.age}</div>
                  <div><span className="font-medium">Date of Birth:</span> {formatDate(selectedStudent.dateOfBirth)}</div>
            </div>
          </div>
          
              {/* Academic Information */}
                  <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Academic Information</h3>
                <div className="space-y-2">
                  <div><span className="font-medium">Stream:</span> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{selectedStudent.stream}</span></div>
                  <div><span className="font-medium">School:</span> {selectedStudent.school}</div>
                  <div><span className="font-medium">District:</span> {selectedStudent.district}</div>
                  <div><span className="font-medium">Date Joined:</span> {formatDate(selectedStudent.dateJoined)}</div>
                      </div>
                      
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Parent Information</h3>
                <div className="space-y-2">
                  <div><span className="font-medium">Parent Name:</span> {selectedStudent.parentName}</div>
                  <div><span className="font-medium">Parent Mobile:</span> {selectedStudent.parentMobile}</div>
                              </div>
                            </div>
      </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Address</h3>
              <p className="text-gray-700">{selectedStudent.address}</p>
          </div>
          
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => exportStudentData(selectedStudent)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FaDownload />
                Export Data
              </button>
            <button
                onClick={() => printStudentReport(selectedStudent)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
                <FaPrint />
                Print Report
            </button>
          </div>
                        </div>
                      )}
                    </div>
      </div>
  );

  const EnrollmentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Enrollment Management</h2>
          <div className="flex gap-3">
            <button
              onClick={() => handleNewEnrollment(selectedStudent)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FaPlus />
              New Enrollment
            </button>
            <button
              onClick={closeEnrollmentModal}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="text-xl" />
            </button>
                              </div>
                              </div>

        {selectedStudent && (
            <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {selectedStudent.studentName} - Enrollment Summary
                  </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedStudent.totalEnrollments}</div>
                  <div className="text-sm text-gray-600">Total Enrollments</div>
                              </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedStudent.activeEnrollments}</div>
                  <div className="text-sm text-gray-600">Active Enrollments</div>
                              </div>
                                 <div className="bg-purple-50 p-4 rounded-lg">
                   <div className="text-2xl font-bold text-purple-600">
                     {selectedStudent.enrollments.filter(e => e.status !== 'active').length}
                              </div>
                   <div className="text-sm text-gray-600">Inactive Enrollments</div>
                              </div>
                            </div>
                          </div>
                          
            {selectedStudent.enrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Class</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Subject</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Teacher</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Enrollment Date</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent.enrollments.map((enrollment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                                                 <td className="border border-gray-300 px-4 py-2">{getClassName(enrollment)}</td>
                        <td className="border border-gray-300 px-4 py-2">{enrollment.subject || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{enrollment.teacher || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{formatDate(enrollment.enrollment_date)}</td>
                                                 <td className="border border-gray-300 px-4 py-2">
                           <span className={`px-2 py-1 rounded text-xs ${
                             enrollment.status === 'active' 
                               ? 'bg-green-100 text-green-800' 
                               : enrollment.status === 'completed'
                               ? 'bg-blue-100 text-blue-800'
                               : enrollment.status === 'dropped'
                               ? 'bg-red-100 text-red-800'
                               : enrollment.status === 'suspended'
                               ? 'bg-yellow-100 text-yellow-800'
                               : 'bg-gray-100 text-gray-800'
                           }`}>
                             {enrollment.status}
                           </span>
                         </td>
                                                 <td className="border border-gray-300 px-4 py-2">
                           <div className="flex gap-2">
                             <button 
                               className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                               onClick={() => handleEditEnrollment(enrollment)}
                               title="Edit Enrollment"
                             >
                               <FaEdit />
                             </button>
                             <button 
                               className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                               onClick={() => handleDeleteEnrollment(enrollment)}
                               title="Delete Enrollment"
                             >
                               <FaTrash />
                             </button>
                              </div>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No enrollments found for this student.
                              </div>
            )}
                              </div>
        )}
                              </div>
                            </div>
  );

  const PaymentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Payment History</h2>
          <button
            onClick={closePaymentModal}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="text-xl" />
          </button>
                          </div>
                          
        {selectedStudent && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {selectedStudent.studentName} - Payment Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedStudent.totalPayments}</div>
                  <div className="text-sm text-gray-600">Total Payments</div>
                        </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedStudent.totalAmount)}</div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                      </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatDate(selectedStudent.lastPaymentDate)}</div>
                  <div className="text-sm text-gray-600">Last Payment</div>
                              </div>
                  </div>
                </div>

            {selectedStudent.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Transaction ID</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Class</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Method</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent.payments.map((payment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">{formatDate(payment.date)}</td>
                        <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{payment.transaction_id}</td>
                        <td className="border border-gray-300 px-4 py-2">{payment.class_name}</td>
                        <td className="border border-gray-300 px-4 py-2 font-semibold">{formatCurrency(payment.amount)}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            payment.payment_method === 'online' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {payment.payment_method}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            payment.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                                                 <td className="border border-gray-300 px-4 py-2">
                           <div className="flex gap-2">
                             <button 
                               className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                               onClick={() => handleDownloadPayment(payment)}
                               title="Download Payment Receipt"
                             >
                               <FaDownload />
                             </button>
                             <button 
                               className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                               onClick={() => handlePrintPayment(payment)}
                               title="Print Payment Receipt"
                             >
                               <FaPrint />
                             </button>
                            </div>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                            </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No payment history found for this student.
                            </div>
            )}
                          </div>
                    )}
                      </div>
                    </div>
  );

  // Edit Enrollment Modal
  const EditEnrollmentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Edit Enrollment</h2>
          <button
            onClick={() => {
              setShowEditEnrollmentModal(false);
              setEditingEnrollment(null);
              setEditFormData({});
              setEditError(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="text-xl" />
          </button>
                            </div>
        
        {editingEnrollment && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {getClassName(editingEnrollment)} - {editingEnrollment.subject || 'New Enrollment'}
            </h3>
                  <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Status:</label>
                                 <select
                   value={editFormData.status}
                   onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 >
                   <option value="active">Active</option>
                   <option value="completed">Completed</option>
                   <option value="dropped">Dropped</option>
                   <option value="suspended">Suspended</option>
                 </select>
                            </div>
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Payment Status:</label>
                                 <select
                   value={editFormData.payment_status}
                   onChange={(e) => setEditFormData({ ...editFormData, payment_status: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 >
                   <option value="paid">Paid</option>
                   <option value="pending">Pending</option>
                   <option value="partial">Partial</option>
                   <option value="overdue">Overdue</option>
                 </select>
                            </div>
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Notes:</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
                            </div>
              {editError && (
                <div className="text-red-600 text-sm">
                  <FaExclamationTriangle className="inline-block mr-1" />
                  {editError}
                          </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEditEnrollmentModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateEnrollment}
                  disabled={editLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {editLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave />
                      Save Changes
                    </>
                  )}
                </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
  );

  // Delete Confirmation Modal
  const DeleteEnrollmentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Confirm Deletion</h2>
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setDeletingEnrollment(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="text-xl" />
          </button>
              </div>

        {deletingEnrollment && (
          <div className="p-6 text-center">
            <FaExclamationTriangle className="text-red-500 text-5xl mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Deletion</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete the enrollment for <strong>{getClassName(deletingEnrollment)}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
                <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                onClick={confirmDeleteEnrollment}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash />
                    Delete Enrollment
                  </>
                )}
                </button>
              </div>
            </div>
        )}
          </div>
        </div>
  );

  // New Enrollment Modal
  const NewEnrollmentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">New Enrollment</h2>
          <button
            onClick={closeNewEnrollmentModal}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="text-xl" />
          </button>
            </div>

        {selectedStudent && (
            <div className="p-6">
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Enrolling: {selectedStudent.studentName} ({selectedStudent.studentId})
              </h3>
              <p className="text-sm text-gray-600">
                Stream: {selectedStudent.stream} | School: {selectedStudent.school}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                📚 Available classes are filtered to match your exact stream ({selectedStudent.stream}).
              </p>
                  </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Class Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-medium text-gray-700">Select Class *</label>
                  <button
                    type="button"
                    onClick={loadAvailableClasses}
                    disabled={loadingClasses}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    🔄 Reload
                  </button>
                  </div>
                <select
                  value={newEnrollmentData.classId}
                  onChange={(e) => handleClassSelection(e.target.value)}
                  disabled={loadingClasses}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingClasses ? 'Loading classes...' : 'Choose a class...'}
                  </option>
                  {!loadingClasses && availableClasses.length > 0 ? (
                    availableClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.className} - {cls.subject} (Rs. {formatCurrency(cls.fee)})
                      </option>
                    ))
                  ) : !loadingClasses && availableClasses.length === 0 ? (
                    <option value="" disabled>
                      No classes available for {selectedStudent.stream} stream
                    </option>
                  ) : null}
                </select>
                {loadingClasses && (
                  <p className="text-xs text-blue-600 mt-1">
                    🔄 Loading classes for {selectedStudent.stream} stream...
                  </p>
                )}
                {!loadingClasses && (
                  <p className="text-xs text-gray-600 mt-1">
                    📊 Found {availableClasses.length} classes for {selectedStudent.stream} stream
                    {availableClasses.length > 0 && (
                      <span className="block mt-1">
                        Available: {availableClasses.map(cls => `${cls.className} (ID: ${cls.id})`).join(', ')}
                      </span>
                    )}
                  </p>
                )}
                {!loadingClasses && availableClasses.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ No active classes found for {selectedStudent.stream} stream. Please create classes for this stream first.
                  </p>
                )}
                </div>

              {/* Payment Method */}
                  <div>
                <label className="block font-medium text-gray-700 mb-2">Payment Method *</label>
                <select
                  value={newEnrollmentData.paymentMethod}
                  onChange={(e) => handleNewEnrollmentChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash Payment</option>
                  <option value="online">Online Payment</option>
                  <option value="card">Card Payment</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
                  </div>

              {/* Amount */}
                    <div>
                <label className="block font-medium text-gray-700 mb-2">Class Fee (Rs.) *</label>
                      <input
                        type="number"
                  value={newEnrollmentData.amount}
                  onChange={(e) => handleNewEnrollmentChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter class fee"
                />
                  </div>

              {/* Tute Collection Type */}
                  <div>
                <label className="block font-medium text-gray-700 mb-2">Tute Collection Type</label>
                    <select
                  value={newEnrollmentData.tuteCollectionType}
                  onChange={(e) => handleNewEnrollmentChange('tuteCollectionType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="physical">Physical Class</option>
                  <option value="speedPost">Speed Post Delivery</option>
                    </select>
                  </div>

              {/* Speed Post Fee */}
              {newEnrollmentData.tuteCollectionType === 'speedPost' && (
                <div>
                  <label className="block font-medium text-gray-700 mb-2">Speed Post Fee (Rs.)</label>
                  <input
                    type="number"
                    value={newEnrollmentData.speedPostFee}
                    onChange={(e) => handleNewEnrollmentChange('speedPostFee', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter speed post fee"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newEnrollmentData.notes}
                  onChange={(e) => handleNewEnrollmentChange('notes', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this enrollment..."
                />
                    </div>
                      </div>

            {/* Total Amount Display */}
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  Rs. {formatCurrency(calculateTotalAmount())}
                </span>
                      </div>
              <div className="text-sm text-gray-600 mt-1">
                Class Fee: Rs. {formatCurrency(newEnrollmentData.amount || 0)}
                {newEnrollmentData.speedPostFee > 0 && (
                  <span> + Speed Post: Rs. {formatCurrency(newEnrollmentData.speedPostFee)}</span>
                )}
                </div>
              </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <button
                onClick={closeNewEnrollmentModal}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                onClick={handleCreateEnrollment}
                disabled={newEnrollmentLoading || !newEnrollmentData.classId || !newEnrollmentData.amount || availableClasses.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {newEnrollmentLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Enrollment...
                    </>
                  ) : (
                    <>
                    <FaSave />
                    Create Enrollment & Generate Receipt
                </>
              )}
                </button>
              </div>
            </div>
        )}
          </div>
        </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Details & Purchased Classes</h1>
        <p className="text-gray-600">Comprehensive overview of all students, their enrollments, and payment history</p>
            </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

          {/* Stream Filter */}
                    <div>
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Streams</option>
              {uniqueStreams.map(stream => (
                <option key={stream} value={stream}>{stream}</option>
              ))}
            </select>
            </div>

          {/* Status Filter */}
                  <div>
                    <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
                    </select>
          </div>

          {/* Refresh Button */}
              <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
            <FaSync className={`${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
              </button>
                  </div>
                </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaUser className="text-blue-600 text-xl" />
                    </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
                      </div>
                      </div>
                      </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaGraduationCap className="text-green-600 text-xl" />
                    </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredStudents.reduce((sum, s) => sum + s.totalEnrollments, 0)}
              </p>
                  </div>
                </div>
              </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaMoneyBill className="text-purple-600 text-xl" />
              </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredStudents.reduce((sum, s) => sum + s.totalPayments, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FaCalendar className="text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(filteredStudents.reduce((sum, s) => sum + s.totalAmount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Bulk Actions</h3>
        <div className="flex flex-wrap gap-3">
              <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            onClick={() => {
              const data = filteredStudents.map(student => ({
                student: student,
                enrollments: student.enrollments,
                payments: student.payments
              }));
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `all_students_data_${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            disabled={filteredStudents.length === 0}
          >
            <FaDownload />
            Export All Students
              </button>
              <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            onClick={() => {
              const printWindow = window.open('', '_blank');
              printWindow.document.write(`
                <html>
                  <head>
                    <title>All Students Report</title>
                    <style>
                      body { font-family: Arial, sans-serif; margin: 20px; }
                      .header { text-align: center; margin-bottom: 30px; }
                      table { width: 100%; border-collapse: collapse; }
                      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                      th { background-color: #f8f9fa; }
                      .summary { margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h1>All Students Report</h1>
                      <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
                    
                    <div class="summary">
                      <h3>Summary</h3>
                      <p>Total Students: ${filteredStudents.length}</p>
                      <p>Total Enrollments: ${filteredStudents.reduce((sum, s) => sum + s.totalEnrollments, 0)}</p>
                      <p>Total Payments: ${filteredStudents.reduce((sum, s) => sum + s.totalPayments, 0)}</p>
                      <p>Total Revenue: ${formatCurrency(filteredStudents.reduce((sum, s) => sum + s.totalAmount, 0))}</p>
          </div>
                    
                    <table>
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Name</th>
                          <th>Stream</th>
                          <th>Enrollments</th>
                          <th>Payments</th>
                          <th>Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${filteredStudents.map(student => `
                          <tr>
                            <td>${student.studentId}</td>
                            <td>${student.studentName}</td>
                            <td>${student.stream}</td>
                            <td>${student.totalEnrollments}</td>
                            <td>${student.totalPayments}</td>
                            <td>${formatCurrency(student.totalAmount)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </body>
                </html>
              `);
              printWindow.document.close();
              printWindow.print();
            }}
            disabled={filteredStudents.length === 0}
          >
            <FaPrint />
            Print All Students Report
          </button>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            onClick={() => {
              const csvContent = [
                ['Student ID', 'Name', 'Email', 'Mobile', 'Stream', 'School', 'Enrollments', 'Payments', 'Total Amount'],
                ...filteredStudents.map(student => [
                  student.studentId,
                  student.studentName,
                  student.email,
                  student.mobile,
                  student.stream,
                  student.school,
                  student.totalEnrollments,
                  student.totalPayments,
                  student.totalAmount
                ])
              ].map(row => row.join(',')).join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `students_report_${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            disabled={filteredStudents.length === 0}
          >
            <FaDownload />
            Export as CSV
              </button>
        </div>
          </div>

      {/* Main Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student details...</p>
            </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
            <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
            Try Again
            </button>
          </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">No students found matching your criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStreamFilter('');
              setStatusFilter('');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <BasicTable
            columns={columns}
            data={filteredStudents}
            className="w-full"
          />
        </div>
      )}

      {/* Modals */}
      {showDetailsModal && <DetailsModal />}
      {showEnrollmentModal && <EnrollmentModal />}
      {showPaymentModal && <PaymentModal />}
      {showEditEnrollmentModal && <EditEnrollmentModal />}
      {showDeleteModal && <DeleteEnrollmentModal />}
      {showNewEnrollmentModal && <NewEnrollmentModal />}

             {message.show && (
         <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md shadow-lg z-50 ${
           message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
         }`}>
           <div className="flex items-center">
             {message.type === 'success' ? (
               <FaCheck className="mr-2" />
             ) : (
               <FaExclamationTriangle className="mr-2" />
             )}
             {message.text}
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPurchasedClasses; 
