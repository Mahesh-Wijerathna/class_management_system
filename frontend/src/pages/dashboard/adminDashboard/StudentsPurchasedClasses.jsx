import React, { useState, useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { MdPayment, MdReceipt, MdPersonAdd, MdClass, MdAttachMoney, MdDateRange, MdReceiptLong, MdEdit, MdDelete, MdCheckCircle, MdWarning, MdInfo, MdError, MdSuccess, MdPending, MdClose, MdSearch, MdRefresh, MdSchool, MdPerson, MdGroup, MdToday, MdArrowBack, MdPhone, MdEmail, MdLocationOn, MdBadge } from 'react-icons/md';
import * as Yup from 'yup';
import Receipt from '../../../components/Receipt';
import BasicTable from '../../../components/BasicTable';
import { getAllStudents } from '../../../api/auth';
import { getActiveClasses } from '../../../api/classes';

// Validation Schema
const validationSchema = Yup.object().shape({
  studentId: Yup.string().required('Student ID is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
  phone: Yup.string().required('Phone number is required'),
  classId: Yup.string().required('Class is required'),
  paymentMethod: Yup.string().required('Payment method is required'),
  amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
  discount: Yup.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%'),
  speedPostFee: Yup.number().min(0, 'Speed post fee cannot be negative')
});

  const StudentsPurchasedClasses = () => {
  // State Management
    const [purchasedClasses, setPurchasedClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPaymentData, setCurrentPaymentData] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [speedPostFee, setSpeedPostFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentDetails, setStudentDetails] = useState(null);

  // Load data from database on component mount
  useEffect(() => {
    loadDataFromDatabase();
  }, []);

  // Filter students based on search term
  useEffect(() => {
    if (studentSearchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.studentId?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        student.firstName?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        student.lastName?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        student.phone?.includes(studentSearchTerm)
      );
      setFilteredStudents(filtered);
    }
  }, [studentSearchTerm, students]);

  const loadDataFromDatabase = async () => {
    try {
      setIsLoading(true);
      
      // Load students from database
      const studentsResponse = await getAllStudents();
      if (studentsResponse.success) {
        // Transform student data to match the expected format
        const studentData = studentsResponse.students?.map(student => ({
          studentId: student.userid,
          firstName: student.firstName || '',
          lastName: student.lastName || '',
          email: student.email || '',
          phone: student.mobile || '',
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
        })) || [];
        setStudents(studentData);
      } else {
        console.error('Failed to load students:', studentsResponse.message);
        setStudents([]);
      }

      // Load classes from database
      const classesResponse = await getActiveClasses();
      if (classesResponse.success) {
        setAvailableClasses(classesResponse.data || []);
      } else {
        console.error('Failed to load classes:', classesResponse.message);
        setAvailableClasses([]);
      }

      // Load enrollment data from database
      const enrollmentsResponse = await fetch('http://localhost:8087/routes.php/get_all_enrollments');
      if (enrollmentsResponse.ok) {
        const enrollmentsData = await enrollmentsResponse.json();
        if (enrollmentsData.success && enrollmentsData.data) {
          // Transform enrollment data to match the expected format
          const transformedEnrollments = enrollmentsData.data.map(enrollment => {
            // Parse student name properly
            const studentName = enrollment.student_name || '';
            const nameParts = studentName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            return {
              id: enrollment.id,
              studentId: enrollment.student_id,
              firstName: firstName,
              lastName: lastName,
              email: '', // Will be filled from student data
              phone: '', // Will be filled from student data
              purchasedClass: enrollment.class_name || '',
              subject: enrollment.subject || '',
              teacher: enrollment.teacher || '',
              stream: enrollment.stream || '',
              courseType: enrollment.course_type || '',
              amount: parseFloat(enrollment.amount_paid) || 0,
              paymentMethod: enrollment.payment_method || '',
              paymentStatus: enrollment.payment_status === 'paid' ? 'Paid' : 'Pending',
              status: enrollment.status === 'enrolled' ? 'Active' : 'Inactive',
              purchaseDate: enrollment.enrollment_date || '',
              transactionId: enrollment.transaction_id || '',
              receiptNumber: `RCP-${enrollment.id}-${Math.floor(Math.random() * 1000)}`,
              nextPaymentDate: enrollment.next_payment_date || '',
              schedule: enrollment.schedule || {}
            };
          });
          console.log('Transformed enrollments:', transformedEnrollments);
          setPurchasedClasses(transformedEnrollments);
        } else {
          console.error('Failed to load enrollments:', enrollmentsData.message);
          setPurchasedClasses([]);
        }
      } else {
        console.error('Failed to fetch enrollments from API');
        setPurchasedClasses([]);
      }
    } catch (error) {
      console.error('Error loading data from database:', error);
      setStudents([]);
      setAvailableClasses([]);
      setPurchasedClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Search student by ID and display details
  const searchStudentById = (studentId) => {
    const student = students.find(s => s.studentId === studentId);
    if (student) {
      setStudentDetails(student);
      setSelectedStudent(student);
      setShowStudentSearch(false);
    } else {
      setStudentDetails(null);
      setSelectedStudent(null);
    }
  };

  // Handle student search input change
  const handleStudentSearchChange = (e) => {
    const value = e.target.value;
    setStudentSearchTerm(value);
    
    // If it looks like a student ID (exact match), search for it
    if (value.length >= 3) {
      const student = students.find(s => s.studentId === value);
      if (student) {
        setStudentDetails(student);
        setSelectedStudent(student);
        setShowStudentSearch(false);
      } else {
        setStudentDetails(null);
        setShowStudentSearch(true);
      }
    } else {
      setStudentDetails(null);
      setShowStudentSearch(false);
    }
  };

  // Filter data based on search term and selected filter
  const filteredData = purchasedClasses.filter(record => {
    const matchesSearch = 
      (record.studentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.purchasedClass || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.teacher || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'paid') return matchesSearch && record.paymentStatus === 'Paid';
    if (selectedFilter === 'pending') return matchesSearch && record.paymentStatus === 'Pending';
    if (selectedFilter === 'active') return matchesSearch && record.status === 'Active';
    if (selectedFilter === 'completed') return matchesSearch && record.status === 'Completed';
    
    return matchesSearch;
  });

  // Debug logging
  console.log('purchasedClasses:', purchasedClasses);
  console.log('filteredData:', filteredData);
  console.log('searchTerm:', searchTerm);
  console.log('selectedFilter:', selectedFilter);

  // Test API call function
  const testApiCall = async () => {
    try {
      console.log('Testing API call...');
      const response = await fetch('http://localhost:8087/routes.php/get_all_enrollments');
      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        console.log('Number of enrollments:', data.data?.length || 0);
      } else {
        console.error('API call failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('API call error:', error);
    }
  };

  const handleNewEnrollment = () => {
    setSelectedStudent(null);
    setSelectedClass(null);
    setPaymentAmount(0);
    setDiscount(0);
    setSpeedPostFee(0);
    setPaymentMethod('cash');
    setStudentDetails(null);
    setStudentSearchTerm('');
    setShowEnrollmentModal(true);
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setStudentDetails(student);
    setShowStudentSearch(false);
  };

  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
    setPaymentAmount(cls.fee || 0);
    setDiscount(0);
    setSpeedPostFee(0);
  };

  const handleProceedToPayment = () => {
    if (!selectedStudent || !selectedClass) {
      alert('Please select both student and class');
      return;
    }
    setShowEnrollmentModal(false);
    setShowPaymentModal(true);
  };

  const calculateTotal = () => {
    const baseAmount = paymentAmount || 0;
    const discountAmount = (baseAmount * (discount || 0)) / 100;
    const finalAmount = baseAmount - discountAmount + (speedPostFee || 0);
    return Math.max(0, finalAmount);
  };

  const handleProcessPayment = async () => {
    setProcessingPayment(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const totalAmount = calculateTotal();
      const transactionId = `TXN${Date.now()}`;
      const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const newEnrollment = {
        id: Date.now(),
        studentId: selectedStudent.studentId,
        firstName: selectedStudent.firstName,
        lastName: selectedStudent.lastName,
        email: selectedStudent.email,
        phone: selectedStudent.phone,
        classId: selectedClass.id,
        purchasedClass: selectedClass.className,
        subject: selectedClass.subject,
        teacher: selectedClass.teacher,
        stream: selectedClass.stream,
        courseType: selectedClass.courseType,
        purchaseDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        paymentStatus: 'Paid',
        amount: totalAmount,
        discount: discount,
        speedPostFee: speedPostFee,
        paymentMethod: paymentMethod,
        transactionId: transactionId,
        receiptNumber: receiptNumber
      };
      
      setPurchasedClasses(prev => [...prev, newEnrollment]);
      
      // Create payment data for receipt
      const paymentData = {
        transactionId: transactionId,
        invoiceId: transactionId,
        date: new Date().toLocaleDateString(),
        paymentMethod: paymentMethod,
        firstName: selectedStudent.firstName,
        lastName: selectedStudent.lastName,
        email: selectedStudent.email,
        phone: selectedStudent.phone,
        className: selectedClass.className,
        subject: selectedClass.subject,
        teacher: selectedClass.teacher,
        stream: selectedClass.stream,
        courseType: selectedClass.courseType,
        basePrice: paymentAmount,
        discount: discount,
        speedPostFee: speedPostFee,
        amount: totalAmount
      };
      
      setCurrentPaymentData(paymentData);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      
      // Show success message
      setSuccessMessage('Payment processed successfully! Receipt generated.');
      setShowSuccessAlert(true);
      
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleViewReceipt = (record) => {
    const paymentData = {
      transactionId: record.transactionId,
      invoiceId: record.transactionId,
      date: new Date(record.purchaseDate).toLocaleDateString(),
      paymentMethod: record.paymentMethod,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone,
      className: record.purchasedClass,
      subject: record.subject,
      teacher: record.teacher,
      stream: record.stream,
      courseType: record.courseType,
      basePrice: record.amount,
      discount: record.discount,
      speedPostFee: record.speedPostFee,
      amount: record.amount
    };
    
    setCurrentPaymentData(paymentData);
    setShowReceiptModal(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setSelectedStudent({
      studentId: record.studentId,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone
    });
    setSelectedClass({
      id: record.classId,
      className: record.purchasedClass,
      subject: record.subject,
      teacher: record.teacher,
      stream: record.stream,
      courseType: record.courseType,
      fee: record.amount
    });
    setPaymentAmount(record.amount);
    setDiscount(record.discount);
    setSpeedPostFee(record.speedPostFee);
    setPaymentMethod(record.paymentMethod);
    setShowEnrollmentModal(true);
  };

  const handleDelete = (record) => {
    setRecordToDelete(record);
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      setPurchasedClasses(prev => prev.filter(record => record.id !== recordToDelete.id));
      
      try {
        const myClasses = JSON.parse(localStorage.getItem('myClasses') || '[]');
        const updatedMyClasses = myClasses.filter(cls => 
          !(cls.studentId === recordToDelete.studentId && 
            (cls.classId === recordToDelete.classId || cls.id === recordToDelete.classId))
        );
        localStorage.setItem('myClasses', JSON.stringify(updatedMyClasses));
      } catch (error) {
        console.error('Error updating myClasses:', error);
      }
      
      setShowDeleteAlert(false);
      setRecordToDelete(null);
      
      setSuccessMessage('Enrollment record deleted successfully!');
      setShowSuccessAlert(true);
    }
  };

  const columns = [
    { key: 'studentId', label: 'Student ID', render: (row) => (
      <div className="flex items-center gap-2">
        <MdPerson className="text-blue-600" />
        <span className="font-medium">{row.studentId}</span>
      </div>
    )},
    { key: 'studentName', label: 'Student Name', render: (row) => (
      <div>
        <div className="font-medium">{row.firstName} {row.lastName}</div>
        <div className="text-sm text-gray-500">{row.email}</div>
      </div>
    )},
    { key: 'classInfo', label: 'Class Information', render: (row) => (
      <div>
        <div className="font-medium">{row.purchasedClass}</div>
        <div className="text-sm text-gray-500">{row.subject} • {row.teacher}</div>
        <div className="text-xs text-gray-400">{row.stream} • {row.courseType}</div>
      </div>
    )},
    { key: 'purchaseDate', label: 'Enrollment Date', render: (row) => (
      <div className="flex items-center gap-2">
        <MdDateRange className="text-green-600" />
        <span>{new Date(row.purchaseDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
        })}</span>
      </div>
    )},
    { key: 'paymentInfo', label: 'Payment Details', render: (row) => (
      <div>
        <div className="font-medium">LKR {row.amount?.toLocaleString()}</div>
        <div className="text-sm text-gray-500">{row.paymentMethod}</div>
        {row.discount > 0 && (
          <div className="text-xs text-green-600">-{row.discount}% discount</div>
        )}
      </div>
    )},
    { key: 'paymentStatus', label: 'Payment Status', render: (row) => (
      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
        row.paymentStatus === 'Paid' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {row.paymentStatus === 'Paid' ? <MdCheckCircle /> : <MdPending />}
        {row.paymentStatus}
      </span>
    )},
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
        row.status === 'Active' 
          ? 'bg-blue-100 text-blue-800' 
          : row.status === 'Completed'
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {row.status}
      </span>
    )}
  ];

  const actions = (row) => (
    <div className="flex gap-2">
      <button
        className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded"
        title="View Receipt"
        onClick={() => handleViewReceipt(row)}
      >
        <MdReceiptLong />
      </button>
      <button
        className="text-green-600 hover:text-green-800 transition-colors p-1 rounded"
        title="Edit"
        onClick={() => handleEdit(row)}
      >
        <MdEdit />
      </button>
      <button
        className="text-red-600 hover:text-red-800 transition-colors p-1 rounded"
        title="Delete"
        onClick={() => handleDelete(row)}
      >
        <MdDelete />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-lg text-gray-600">
            <FaSpinner className="animate-spin" />
            Loading enrollment system...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Physical Enrollment System</h1>
            <p className="text-gray-600">Industry-level student enrollment and payment processing</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDataFromDatabase}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <MdRefresh />
              Refresh
            </button>
            <button
              onClick={handleNewEnrollment}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <MdPersonAdd />
              New Enrollment
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{purchasedClasses.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <MdGroup className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Enrollments</p>
                <p className="text-2xl font-bold text-green-600">
                  {purchasedClasses.filter(r => r.paymentStatus === 'Paid').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <MdCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-blue-600">
                  {purchasedClasses.filter(r => r.status === 'Active').length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <MdSchool className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">
                  LKR {purchasedClasses.reduce((sum, r) => sum + (r.amount || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <MdAttachMoney className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
                placeholder="Search by student ID, name, class, or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Enrollments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            
            <button
              onClick={handleNewEnrollment}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MdPersonAdd />
              New Enrollment
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mb-4">
        <button 
          onClick={loadDataFromDatabase}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
        >
          Test Load Data ({purchasedClasses.length} records)
        </button>
        <button 
          onClick={testApiCall}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Test API Call
        </button>
      </div>
      
      <BasicTable
        columns={columns}
        data={filteredData}
        actions={actions}
        className="bg-white"
      />

      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingRecord ? 'Edit Enrollment' : 'New Student Enrollment'}
            </h2>
                <button
                  onClick={() => setShowEnrollmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Student Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MdPerson />
                    Student Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Student by ID
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Enter Student ID (e.g., 99985570)..."
                          value={studentSearchTerm}
                          onChange={handleStudentSearchChange}
                          onFocus={() => setShowStudentSearch(true)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <MdSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>
                      
                      {showStudentSearch && filteredStudents.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredStudents.map((student) => (
                            <div
                              key={student.studentId}
                              onClick={() => handleStudentSelect(student)}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium">{student.firstName} {student.lastName}</div>
                              <div className="text-sm text-gray-500">
                                {student.studentId} • {student.email} • {student.phone}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Student Details Display */}
                    {studentDetails && (
                      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                              <MdPerson className="w-5 h-5" />
                              Personal Information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <MdBadge className="text-blue-600" />
                                <span className="font-medium">ID:</span>
                                <span>{studentDetails.studentId}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MdPerson className="text-blue-600" />
                                <span className="font-medium">Name:</span>
                                <span>{studentDetails.firstName} {studentDetails.lastName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MdEmail className="text-blue-600" />
                                <span className="font-medium">Email:</span>
                                <span>{studentDetails.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MdPhone className="text-blue-600" />
                                <span className="font-medium">Phone:</span>
                                <span>{studentDetails.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MdLocationOn className="text-blue-600" />
                                <span className="font-medium">Date of Birth:</span>
                                <span>{studentDetails.dateOfBirth}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Gender:</span>
                                <span>{studentDetails.gender}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                              <MdSchool className="w-5 h-5" />
                              Academic Information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <MdSchool className="text-blue-600" />
                                <span className="font-medium">School:</span>
                                <span>{studentDetails.school}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Stream:</span>
                                <span>{studentDetails.stream}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MdLocationOn className="text-blue-600" />
                                <span className="font-medium">District:</span>
                                <span>{studentDetails.district}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Address:</span>
                                <span>{studentDetails.address}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MdLocationOn className="text-blue-600" />
                                <span className="font-medium">Date Joined:</span>
                                <span>{studentDetails.dateJoined}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Class Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MdClass />
                    Class Selection
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Classes
                      </label>
                      <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
                        {availableClasses.map((cls) => (
                          <div
                            key={cls.id}
                            onClick={() => handleClassSelect(cls)}
                            className={`p-4 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                              selectedClass?.id === cls.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="font-medium">{cls.className}</div>
                            <div className="text-sm text-gray-600">
                              {cls.subject} • {cls.teacher}
                            </div>
                            <div className="text-sm text-gray-500">
                              {cls.stream} • {cls.courseType}
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              LKR {cls.fee?.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedClass && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <MdClass className="w-8 h-8 text-green-600" />
                          <div>
                            <div className="font-medium text-green-900">
                              {selectedClass.className}
                            </div>
                            <div className="text-sm text-green-700">
                              {selectedClass.subject} • {selectedClass.teacher}
                            </div>
                            <div className="text-sm text-green-600">
                              {selectedClass.stream} • {selectedClass.courseType}
                            </div>
                            <div className="text-lg font-bold text-green-800">
                              LKR {selectedClass.fee?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowEnrollmentModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToPayment}
                  disabled={!selectedStudent || !selectedClass}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <MdPayment />
                Payment Processing
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Student and Class Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Student</h4>
                    <p className="text-blue-700">{selectedStudent?.firstName} {selectedStudent?.lastName}</p>
                    <p className="text-sm text-blue-600">{selectedStudent?.studentId}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Class</h4>
                    <p className="text-green-700">{selectedClass?.className}</p>
                    <p className="text-sm text-green-600">{selectedClass?.subject}</p>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Amount
                    </label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Speed Post Fee
                      </label>
                      <input
                        type="number"
                        value={speedPostFee}
                        onChange={(e) => setSpeedPostFee(parseFloat(e.target.value) || 0)}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="online">Online Payment</option>
                    </select>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Base Amount:</span>
                      <span>LKR {paymentAmount?.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({discount}%):</span>
                        <span>- LKR {((paymentAmount * discount) / 100).toLocaleString()}</span>
                      </div>
                    )}
                    {speedPostFee > 0 && (
                      <div className="flex justify-between">
                        <span>Speed Post Fee:</span>
                        <span>LKR {speedPostFee?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount:</span>
                        <span>LKR {calculateTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={processingPayment || calculateTotal() <= 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <MdPayment />
                      Process Payment
                </>
              )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && currentPaymentData && (
        <Receipt
          paymentData={currentPaymentData}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Delete Confirmation Alert */}
      {showDeleteAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <MdWarning className="w-8 h-8 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the enrollment record for{' '}
              <strong>{recordToDelete?.firstName} {recordToDelete?.lastName}</strong> -{' '}
              <strong>{recordToDelete?.purchasedClass}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAlert(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <MdCheckCircle className="w-8 h-8 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Success</h3>
            </div>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <button
              onClick={() => setShowSuccessAlert(false)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPurchasedClasses; 