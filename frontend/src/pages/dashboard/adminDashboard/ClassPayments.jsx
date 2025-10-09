import React, { useState, useEffect } from 'react';
import { FaUsers, FaMoneyBill, FaCalendar, FaSearch, FaFilter, FaDownload, FaPrint, FaEye, FaClock, FaCheckCircle, FaExclamationTriangle, FaGraduationCap, FaUser, FaPhone, FaEnvelope, FaSchool, FaTimes, FaSync } from 'react-icons/fa';
import { getAllClasses } from '../../../api/classes';
import { getClassEnrollments } from '../../../api/enrollments';
import { getAllStudents } from '../../../api/students';
import axios from 'axios';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicTable from '../../../components/BasicTable';

const ClassPayments = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [streamFilter, setStreamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState((new Date().getMonth() + 1).toString());
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [dateFilter, setDateFilter] = useState('');
  const [studentsData, setStudentsData] = useState({});
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [classPaymentData, setClassPaymentData] = useState({});

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load classes and students in parallel
      const [classesResponse, studentsResponse] = await Promise.all([
        getAllClasses(),
        getAllStudents()
      ]);

      if (classesResponse.success) {
        const classesList = classesResponse.data || [];
        setClasses(classesList);
        
        // Store students data for quick lookup
        if (studentsResponse.success && studentsResponse.students) {
          const studentsMap = {};
          studentsResponse.students.forEach(student => {
            studentsMap[student.user_id] = student;
          });
          setStudentsData(studentsMap);
        }

        // Load enrollment and payment data for each class
        const paymentData = {};
        const globalPaymentData = {};
        
        // First, fetch all payments from payment backend
        try {
          const paymentsResponse = await axios.get(`http://localhost:8090/routes.php/get_all_payments`);
          if (paymentsResponse.data.success && paymentsResponse.data.data) {
            // Group payments by class_id
            paymentsResponse.data.data.forEach(payment => {
              const classId = payment.class_id;
              if (!globalPaymentData[classId]) {
                globalPaymentData[classId] = [];
              }
              globalPaymentData[classId].push(payment);
            });
          }
        } catch (error) {
          console.error('Error loading global payment data:', error);
        }
        
        for (const classItem of classesList) {
          try {
            const enrollmentsResponse = await getClassEnrollments(classItem.id);
            if (enrollmentsResponse.success) {
              const enrollments = enrollmentsResponse.data || [];
              const classPayments = globalPaymentData[classItem.id] || [];
              
              // Combine enrollment data with payment data
              paymentData[classItem.id] = {
                enrollments: enrollments,
                payments: classPayments
              };
            }
          } catch (error) {
            console.error(`Error loading data for class ${classItem.id}:`, error);
            paymentData[classItem.id] = {
              enrollments: [],
              payments: []
            };
          }
        }
        setClassPaymentData(paymentData);
      } else {
        setError('Failed to load classes');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayments = async (classItem) => {
    try {
      const enrollmentsResponse = await getClassEnrollments(classItem.id);
      if (enrollmentsResponse.success) {
        const enrollments = enrollmentsResponse.data || [];
        
        // Fetch student data for each enrollment
        const studentPromises = enrollments.map(async (enrollment) => {
          try {
            const studentResponse = await axios.get(`http://localhost:8086/routes.php/get_with_id/${enrollment.student_id}`);
            return { studentId: enrollment.student_id, data: studentResponse.data };
          } catch (error) {
            console.error('Error fetching student data for', enrollment.student_id, ':', error);
            return { studentId: enrollment.student_id, data: null };
          }
        });
        
        const studentResults = await Promise.all(studentPromises);
        const studentDataMap = {};
        studentResults.forEach(result => {
          if (result.data) {
            studentDataMap[result.studentId] = result.data;
          }
        });
        
        // Fetch payment data for this class
        let classPayments = [];
        try {
          const paymentsResponse = await axios.get(`http://localhost:8090/routes.php/get_all_payments`);
          if (paymentsResponse.data.success && paymentsResponse.data.data) {
            classPayments = paymentsResponse.data.data.filter(payment => payment.class_id == classItem.id);
          }
        } catch (paymentError) {
          console.error('Error fetching payments for class', classItem.id, ':', paymentError);
        }
        
        // Apply date filters to the enrollments using payment data
        let filteredEnrollments = enrollments;
        
        if (dateFilter) {
          // Filter by specific date using payment data
          const targetDate = new Date(dateFilter);
          targetDate.setHours(0, 0, 0, 0);
          
          filteredEnrollments = enrollments.filter(enrollment => {
            const studentPayments = classPayments.filter(payment => 
              payment.user_id === enrollment.student_id
            );
            return studentPayments.some(payment => {
              const paymentDate = new Date(payment.date);
              paymentDate.setHours(0, 0, 0, 0);
              return paymentDate.getTime() === targetDate.getTime();
            });
          });
        } else if (monthFilter && yearFilter) {
          // Filter by month and year using payment data
          const targetMonth = parseInt(monthFilter);
          const targetYear = parseInt(yearFilter);
          
          filteredEnrollments = enrollments.filter(enrollment => {
            const studentPayments = classPayments.filter(payment => 
              payment.user_id === enrollment.student_id
            );
            return studentPayments.some(payment => {
              const paymentDate = new Date(payment.date);
              return paymentDate.getMonth() + 1 === targetMonth && paymentDate.getFullYear() === targetYear;
            });
          });
        }
        
        // Ensure students data is loaded
        if (Object.keys(studentsData).length === 0) {
          try {
            const studentsResponse = await getAllStudents();
            if (studentsResponse.success && studentsResponse.students) {
              const studentsMap = {};
              studentsResponse.students.forEach(student => {
                studentsMap[student.user_id] = student;
              });
              setStudentsData(studentsMap);
            }
          } catch (error) {
            console.error('Error loading students data:', error);
          }
        }
        
        setSelectedClass({
          ...classItem,
          enrollments: filteredEnrollments,
          studentData: studentDataMap,
          payments: classPayments
        });
        setShowPaymentDetails(true);
      }
    } catch (error) {
      console.error('Error loading enrollments:', error);
    }
  };

  const closePaymentDetails = () => {
    setShowPaymentDetails(false);
    setSelectedClass(null);
    setSelectedStudent(null);
  };

  const handleViewStudentDetails = (student, enrollment) => {
    setSelectedStudent({ ...student, enrollment });
  };

  const closeStudentDetails = () => {
    setSelectedStudent(null);
  };

  // Filter classes based on search term and filters
  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = searchTerm === '' || 
      classItem.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStream = streamFilter === '' || classItem.stream === streamFilter;
    const matchesStatus = statusFilter === '' || classItem.status === statusFilter;
    
    return matchesSearch && matchesStream && matchesStatus;
  });

  // Get unique values for filter dropdowns
  const uniqueStreams = [...new Set(classes.map(c => c.stream))].filter(Boolean).sort();
  const uniqueStatuses = [...new Set(classes.map(c => c.status))].filter(Boolean).sort();

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

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'text-green-700 bg-green-100 border border-green-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100 border border-yellow-200';
      case 'overdue':
        return 'text-red-700 bg-red-100 border border-red-200';
      case 'partial':
        return 'text-blue-700 bg-blue-100 border border-blue-200';
      default:
        return 'text-gray-700 bg-gray-100 border border-gray-200';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-700 bg-green-100 border border-green-200';
      case 'inactive':
        return 'text-red-700 bg-red-100 border border-red-200';
      default:
        return 'text-gray-700 bg-gray-100 border border-gray-200';
    }
  };

  // Calculate payment statistics
  const calculatePaymentStats = (enrollments) => {
    const totalStudents = enrollments.length;
    const paidStudents = enrollments.filter(e => e.payment_status === 'paid').length;
    const pendingStudents = enrollments.filter(e => e.payment_status === 'pending').length;
    
    // Count students with different payment types
    let freeStudents = 0;
    let halfPaidStudents = 0;
    
    enrollments.forEach(enrollment => {
      const fee = parseFloat(enrollment.fee || 0);
      
      if (fee === 0) {
        freeStudents++;
      }
      
      // Count students with "partial" payment status
      if (enrollment.payment_status === 'partial') {
        halfPaidStudents++;
      }
    });
    
    // Calculate revenue from payment backend data
    const totalRevenue = selectedClass?.payments?.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount || 0);
    }, 0) || 0;
    
    const expectedRevenue = enrollments.reduce((sum, e) => {
      const student = selectedClass?.studentData?.[e.student_id] || studentsData[e.student_id];
      return sum + parseFloat(student?.fee || 0);
    }, 0);

    return {
      totalStudents,
      paidStudents,
      pendingStudents,
      freeStudents,
      halfPaidStudents,
      totalRevenue,
      expectedRevenue,
      collectionRate: totalStudents > 0 ? (paidStudents / totalStudents) * 100 : 0
    };
  };

  // Calculate current month revenue for a class
  const calculateCurrentMonthRevenue = (classId) => {
    const classData = classPaymentData[classId] || { enrollments: [], payments: [] };
    const payments = classData.payments || [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    let cashRevenue = 0;
    let onlineRevenue = 0;
    
    payments.forEach(payment => {
      if (payment.date) {
        const paymentDate = new Date(payment.date);
        if (paymentDate.getMonth() + 1 === currentMonth && paymentDate.getFullYear() === currentYear) {
          const amount = parseFloat(payment.amount || 0);
          const method = payment.payment_method?.toLowerCase() || 'unknown';
          
          if (method === 'cash') {
            cashRevenue += amount;
          } else if (method === 'online' || method === 'card') {
            onlineRevenue += amount;
          }
        }
      }
    });
    
    return {
      totalRevenue: cashRevenue + onlineRevenue,
      cashRevenue,
      onlineRevenue
    };
  };

  // Calculate previous month revenue for a class
  const calculatePreviousMonthRevenue = (classId) => {
    const classData = classPaymentData[classId] || { enrollments: [], payments: [] };
    const payments = classData.payments || [];
    const currentDate = new Date();
    const previousMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
    const previousYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    
    let cashRevenue = 0;
    let onlineRevenue = 0;
    
    payments.forEach(payment => {
      if (payment.date) {
        const paymentDate = new Date(payment.date);
        if (paymentDate.getMonth() + 1 === previousMonth && paymentDate.getFullYear() === previousYear) {
          const amount = parseFloat(payment.amount || 0);
          const method = payment.payment_method?.toLowerCase() || 'unknown';
          
          if (method === 'cash') {
            cashRevenue += amount;
          } else if (method === 'online' || method === 'card') {
            onlineRevenue += amount;
          }
        }
      }
    });
    
    return {
      totalRevenue: cashRevenue + onlineRevenue,
      cashRevenue,
      onlineRevenue
    };
  };

  // Calculate payment statistics for a class based on date filters with revenue breakdown
  const calculateClassPaymentStats = (classId) => {
    const classData = classPaymentData[classId] || { enrollments: [], payments: [] };
    const enrollments = classData.enrollments || [];
    const payments = classData.payments || [];
    
    // Filter payments based on date filters
    let filteredPayments = payments;
    
    if (dateFilter) {
      // Filter by specific date
      const targetDate = new Date(dateFilter);
      targetDate.setHours(0, 0, 0, 0);
      
      filteredPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        paymentDate.setHours(0, 0, 0, 0);
        return paymentDate.getTime() === targetDate.getTime();
      });
    } else if (monthFilter && yearFilter) {
      // Filter by month and year
      const targetMonth = parseInt(monthFilter);
      const targetYear = parseInt(yearFilter);
      
      filteredPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate.getMonth() + 1 === targetMonth && paymentDate.getFullYear() === targetYear;
      });
    }
    
    // Calculate revenue breakdown by payment method
    let cashRevenue = 0;
    let onlineRevenue = 0;
    const paymentMethods = {};
    
    filteredPayments.forEach(payment => {
      const amount = parseFloat(payment.amount || 0);
      const method = payment.payment_method?.toLowerCase() || 'unknown';
      
      if (method === 'cash') {
        cashRevenue += amount;
      } else if (method === 'online' || method === 'card') {
        onlineRevenue += amount;
      }
      
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });
    
    const totalPayments = cashRevenue + onlineRevenue;
    const studentsWithPayments = filteredPayments.length;
    
    return {
      totalPayments,
      cashRevenue,
      onlineRevenue,
      paymentMethods,
      studentsWithPayments,
      totalEnrollments: enrollments.length
    };
  };

  // Define columns for classes table
  const classColumns = [
    {
      key: 'classInfo',
      label: 'Class Info',
      render: (row) => (
        <div className="flex flex-col space-y-1">
          <div className="font-semibold text-gray-900 text-sm">{row.className}</div>
          <div className="text-xs text-gray-700">{row.subject}</div>
          <div className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded inline-block w-fit">
            ID: {row.id}
          </div>
        </div>
      )
    },
    {
      key: 'teacher',
      label: 'Teacher',
      render: (row) => (
        <div className="flex items-center space-x-1">
          <div className="bg-blue-100 p-1 rounded-full">
            <FaUser className="text-blue-600 text-sm" />
          </div>
          <span className="text-xs text-gray-800">{row.teacher}</span>
        </div>
      )
    },
    {
      key: 'stream',
      label: 'Stream',
      render: (row) => (
        <div className="flex items-center space-x-1">
          <div className="bg-green-100 p-1 rounded-full">
            <FaGraduationCap className="text-green-600 text-sm" />
          </div>
          <span className="text-xs text-gray-800">{row.stream}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div className="flex justify-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
            {row.status}
          </span>
        </div>
      )
    },
    {
      key: 'totalPayments',
      label: 'Revenue',
      render: (row) => {
        const stats = calculateClassPaymentStats(row.id);
        return (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-1">
              <div className="bg-green-100 p-1 rounded-full">
                <FaMoneyBill className="text-green-600 text-sm" />
              </div>
              <span className="font-semibold text-gray-900 text-xs">{formatCurrency(stats.totalPayments)}</span>
            </div>
            <div className="flex flex-col space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-green-600 font-medium">Cash:</span>
                <span className="text-green-700">{formatCurrency(stats.cashRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-medium">Online:</span>
                <span className="text-blue-700">{formatCurrency(stats.onlineRevenue)}</span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'studentsWithPayments',
      label: 'Students with Payments',
      render: (row) => {
        const stats = calculateClassPaymentStats(row.id);
        return (
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center space-x-1">
              <div className="bg-blue-100 p-1 rounded-full">
                <FaUsers className="text-blue-600 text-sm" />
              </div>
              <span className="text-xs font-semibold text-gray-900">
                {stats.studentsWithPayments}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {stats.totalEnrollments > 0 ? Math.round((stats.studentsWithPayments / stats.totalEnrollments) * 100) : 0}% paid
            </div>
          </div>
        );
      }
    },
    {
      key: 'paymentMethods',
      label: 'Payment Methods',
      render: (row) => {
        const stats = calculateClassPaymentStats(row.id);
        return (
          <div className="flex flex-col space-y-2">
            {Object.entries(stats.paymentMethods || {}).map(([method, count]) => (
              <div key={method} className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    method === 'cash' ? 'bg-green-100 text-green-700' :
                    method === 'online' ? 'bg-blue-100 text-blue-700' :
                    method === 'card' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {method === 'cash' ? 'Cash' :
                     method === 'online' ? 'Online' :
                     method === 'card' ? 'Card' :
                     method}
                  </span>
                </div>
                <span className="text-gray-600 font-medium text-xs">{count}</span>
              </div>
            ))}
            {Object.keys(stats.paymentMethods || {}).length === 0 && (
              <span className="text-gray-400 text-xs">No payments</span>
            )}
          </div>
        );
      }
    }
  ];

  // Define actions for classes table
  const classActions = (row) => (
    <div className="flex flex-col space-y-1">
      <button
        onClick={() => handleViewPayments(row)}
        className="flex items-center justify-center px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-all duration-200 border border-blue-200 text-xs font-medium shadow-sm hover:shadow-md"
        title="View Payment Details"
      >
        <FaMoneyBill size={12} className="mr-1" />
        Payments
      </button>
    </div>
  );

  // Define columns for students table
  const studentColumns = [
    {
      key: 'studentInfo',
      label: 'Student Info',
      render: (row) => {
        const student = selectedClass?.studentData?.[row.student_id] || studentsData[row.student_id];
        return (
          <div className="flex flex-col space-y-1">
            <div className="font-semibold text-gray-900 text-sm">
              {student ? `${student.first_name} ${student.last_name}` : row.student_id}
            </div>
            <div className="text-xs text-gray-700">{student?.school || 'School not specified'}</div>
            <div className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded inline-block w-fit">
              ID: {row.student_id}
            </div>
          </div>
        );
      }
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (row) => {
        const student = selectedClass?.studentData?.[row.student_id] || studentsData[row.student_id];
        return (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <FaEnvelope className="text-blue-500 text-xs" />
              <span className="text-xs text-gray-800">{student?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FaPhone className="text-green-500 text-xs" />
              <span className="text-xs text-gray-800">{student?.mobile_number || 'N/A'}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'enrollment',
      label: 'Enrollment',
      render: (row) => (
        <div className="flex flex-col space-y-1">
          <div className="text-xs text-gray-700">
            <FaCalendar className="inline mr-1" />
            {formatDate(row.enrollment_date)}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
            {row.status}
          </span>
        </div>
      )
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      render: (row) => {
        // Get payment method from payment backend data
        let paymentMethod = 'Unknown';
        const classData = selectedClass?.payments || [];
        const studentPayments = classData.filter(payment => payment.user_id === row.student_id);
        
        if (studentPayments.length > 0) {
          const method = studentPayments[0].payment_method?.toLowerCase() || 'unknown';
          paymentMethod = method === 'cash' ? 'Cash' : 
                         method === 'online' ? 'Online' : 
                         method === 'card' ? 'Card' : 
                         method;
        } else {
          // Fallback to enrollment payment_method
          const method = row.payment_method?.toLowerCase() || 'unknown';
          paymentMethod = method === 'cash' ? 'Cash' : 
                         method === 'online' ? 'Online' : 
                         method === 'card' ? 'Card' : 
                         method;
        }

        return (
          <div className="flex flex-col space-y-1">
            <div className="flex justify-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(row.payment_status)}`}>
                {row.payment_status === 'paid' ? 'Paid' :
                 row.payment_status === 'pending' ? 'Pending' :
                 row.payment_status === 'partial' ? 'Half Card' :
                 row.payment_status === 'overdue' ? 'Free Card' :
                 row.payment_status || 'Not specified'}
              </span>
            </div>
            <div className="flex justify-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                paymentMethod === 'Cash' ? 'bg-green-100 text-green-700' :
                paymentMethod === 'Online' ? 'bg-blue-100 text-blue-700' :
                paymentMethod === 'Card' ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {paymentMethod}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => {
        // Get payment data from payment backend
        const classData = selectedClass?.payments || [];
        const studentPayments = classData.filter(payment => payment.user_id === row.student_id);
        
        const fee = parseFloat(row.fee || 0);
        const paid = studentPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
        
        return (
          <div className="flex flex-col space-y-1">
            <div className="text-xs text-gray-700">
              <span className="font-medium">Fee:</span> {formatCurrency(fee)}
            </div>
            <div className="text-xs text-green-600">
              <span className="font-medium">Paid:</span> {formatCurrency(paid)}
            </div>
          </div>
        );
      }
    }
  ];

  // Define actions for students table
  const studentActions = (row) => {
    const student = selectedClass?.studentData?.[row.student_id] || studentsData[row.student_id];
    return (
      <div className="flex flex-col space-y-1">
        <button
          onClick={() => handleViewStudentDetails(student, row)}
          className="flex items-center justify-center px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded transition-all duration-200 border border-green-200 text-xs font-medium shadow-sm hover:shadow-md"
          title="View Student Details"
        >
          <FaEye size={12} className="mr-1" />
          Details
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading class payments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="w-full max-w-7xl mx-auto bg-white p-8 rounded-lg shadow">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Monthly Tuition Payments</h1>
            <p className="text-gray-600 mt-2">Track and manage monthly recurring tuition payments with cash/online breakdown</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaSync className="mr-2" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={streamFilter}
            onChange={(e) => setStreamFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Streams</option>
            {uniqueStreams.map(stream => (
              <option key={stream} value={stream}>{stream}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Select Date"
          />

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Months</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => {
              setSearchTerm('');
              setStreamFilter('');
              setStatusFilter('');
              setDateFilter('');
              setMonthFilter((new Date().getMonth() + 1).toString());
              setYearFilter(new Date().getFullYear().toString());
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Reset to Current Month
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaGraduationCap className="text-blue-600 text-xl mr-3" />
              <div>
                <p className="text-xs font-medium text-blue-600">Total Classes</p>
                <p className="text-lg font-bold text-blue-900">{filteredClasses.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaUsers className="text-green-600 text-xl mr-3" />
              <div>
                <p className="text-xs font-medium text-green-600">Active Classes</p>
                <p className="text-lg font-bold text-green-900">
                  {filteredClasses.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaMoneyBill className="text-purple-600 text-xl mr-3" />
              <div>
                <p className="text-xs font-medium text-purple-600">Total Revenue</p>
                <p className="text-lg font-bold text-purple-900">
                  {formatCurrency(filteredClasses.reduce((sum, c) => {
                    const stats = calculateClassPaymentStats(c.id);
                    return sum + stats.totalPayments;
                  }, 0))}
                </p>
                <div className="flex flex-col space-y-1 text-xs mt-2">
                  <div className="flex justify-between">
                    <span className="text-green-600 font-medium">Cash:</span>
                    <span className="text-green-700">{formatCurrency(filteredClasses.reduce((sum, c) => {
                      const stats = calculateClassPaymentStats(c.id);
                      return sum + stats.cashRevenue;
                    }, 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 font-medium">Online:</span>
                    <span className="text-blue-700">{formatCurrency(filteredClasses.reduce((sum, c) => {
                      const stats = calculateClassPaymentStats(c.id);
                      return sum + stats.onlineRevenue;
                    }, 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaClock className="text-yellow-600 text-xl mr-3" />
              <div>
                <p className="text-xs font-medium text-yellow-600">Students with Payments</p>
                <p className="text-lg font-bold text-yellow-900">
                  {filteredClasses.reduce((sum, c) => {
                    const stats = calculateClassPaymentStats(c.id);
                    return sum + stats.studentsWithPayments;
                  }, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaMoneyBill className="text-green-600 text-xl mr-3" />
              <div>
                <p className="text-xs font-medium text-green-600">This Month Revenue</p>
                <p className="text-lg font-bold text-green-900">
                  {formatCurrency(filteredClasses.reduce((sum, c) => {
                    const stats = calculateCurrentMonthRevenue(c.id);
                    return sum + stats.totalRevenue;
                  }, 0))}
                </p>
                <div className="flex flex-col space-y-1 text-xs mt-2">
                  <div className="flex justify-between">
                    <span className="text-green-600 font-medium">Cash:</span>
                    <span className="text-green-700">{formatCurrency(filteredClasses.reduce((sum, c) => {
                      const stats = calculateCurrentMonthRevenue(c.id);
                      return sum + stats.cashRevenue;
                    }, 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 font-medium">Online:</span>
                    <span className="text-blue-700">{formatCurrency(filteredClasses.reduce((sum, c) => {
                      const stats = calculateCurrentMonthRevenue(c.id);
                      return sum + stats.onlineRevenue;
                    }, 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaMoneyBill className="text-orange-600 text-xl mr-3" />
              <div>
                <p className="text-xs font-medium text-orange-600">Last Month Revenue</p>
                <p className="text-lg font-bold text-orange-900">
                  {formatCurrency(filteredClasses.reduce((sum, c) => {
                    const stats = calculatePreviousMonthRevenue(c.id);
                    return sum + stats.totalRevenue;
                  }, 0))}
                </p>
                <div className="flex flex-col space-y-1 text-xs mt-2">
                  <div className="flex justify-between">
                    <span className="text-green-600 font-medium">Cash:</span>
                    <span className="text-green-700">{formatCurrency(filteredClasses.reduce((sum, c) => {
                      const stats = calculatePreviousMonthRevenue(c.id);
                      return sum + stats.cashRevenue;
                    }, 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 font-medium">Online:</span>
                    <span className="text-blue-700">{formatCurrency(filteredClasses.reduce((sum, c) => {
                      const stats = calculatePreviousMonthRevenue(c.id);
                      return sum + stats.onlineRevenue;
                    }, 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Classes Table */}
        <BasicTable
          columns={classColumns}
          data={filteredClasses}
          actions={classActions}
          className=""
        />

        {/* Payment Details Modal */}
        {showPaymentDetails && selectedClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Payment Details - {selectedClass.className}
                  </h2>
                  {/* Filter Indicator */}
                  {(dateFilter || (monthFilter && yearFilter)) && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Filters applied:</span>
                      {dateFilter && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Date: {new Date(dateFilter).toLocaleDateString()}
                        </span>
                      )}
                      {monthFilter && yearFilter && !dateFilter && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {new Date(parseInt(yearFilter), parseInt(monthFilter) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        {selectedClass.enrollments.length} students shown
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={closePaymentDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              
              {/* Payment Statistics */}
              {(() => {
                const stats = calculatePaymentStats(selectedClass.enrollments);
                const classStats = calculateClassPaymentStats(selectedClass.id);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-600">Total Students</p>
                      <p className="text-xl font-bold text-blue-900">{stats.totalStudents}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-600">Paid</p>
                      <p className="text-xl font-bold text-green-900">{stats.paidStudents}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-yellow-600">Pending</p>
                      <p className="text-xl font-bold text-yellow-900">{stats.pendingStudents}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-red-600">Free Card</p>
                      <p className="text-xl font-bold text-red-900">{stats.freeStudents}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-orange-600">Half Card</p>
                      <p className="text-xl font-bold text-orange-900">{stats.halfPaidStudents}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-purple-600">Total Revenue</p>
                      <p className="text-sm font-bold text-purple-900">{formatCurrency(classStats.totalPayments)}</p>
                      <div className="flex flex-col space-y-1 text-xs mt-2">
                        <div className="flex justify-between">
                          <span className="text-green-600 font-medium">Cash:</span>
                          <span className="text-green-700">{formatCurrency(classStats.cashRevenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600 font-medium">Online:</span>
                          <span className="text-blue-700">{formatCurrency(classStats.onlineRevenue)}</span>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                );
              })()}
              
              {/* Students Table */}
              <BasicTable
                columns={studentColumns}
                data={selectedClass.enrollments}
                actions={studentActions}
                className=""
              />
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closePaymentDetails}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student Details Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Payment History - {selectedStudent.first_name} {selectedStudent.last_name}
                </h2>
                <button
                  onClick={closeStudentDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              
              <div className="space-y-3">
                {(() => {
                  // Get payment data from payment backend for this student and class
                  const classPayments = selectedClass?.payments || [];
                  const studentPayments = classPayments.filter(payment => 
                    payment.user_id === selectedStudent.enrollment?.student_id
                  );
                  
                  if (studentPayments.length > 0) {
                    return studentPayments.map((payment, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-lg font-semibold text-gray-700">
                            Payment #{index + 1}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            payment.payment_method?.toLowerCase() === 'cash' ? 'bg-green-100 text-green-700' :
                            payment.payment_method?.toLowerCase() === 'online' ? 'bg-blue-100 text-blue-700' :
                            payment.payment_method?.toLowerCase() === 'card' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {payment.payment_method?.toLowerCase() === 'cash' ? 'Cash' :
                             payment.payment_method?.toLowerCase() === 'online' ? 'Online' :
                             payment.payment_method?.toLowerCase() === 'card' ? 'Card' :
                             payment.payment_method || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-600">Amount:</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(payment.amount || 0)}
                          </span>
                        </div>
                        {payment.date && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Date:</span>
                            <span className="text-sm text-gray-700">
                              {formatDate(payment.date)}
                            </span>
                          </div>
                        )}
                        {payment.transaction_id && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Transaction ID:</span>
                            <span className="text-sm text-gray-700">
                              {payment.transaction_id}
                            </span>
                          </div>
                        )}
                      </div>
                    ));
                  } else {
                    return (
                      <div className="text-center py-8">
                        <div className="text-gray-500 text-lg">No payment history available</div>
                      </div>
                    );
                  }
                })()}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeStudentDetails}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClassPayments;
