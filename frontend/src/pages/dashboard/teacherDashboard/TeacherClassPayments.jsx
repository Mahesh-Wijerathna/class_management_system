import React, { useState, useEffect } from 'react';
import { FaUsers, FaMoneyBill, FaCalendar, FaSearch, FaGraduationCap, FaExclamationTriangle, FaEye, FaPhone, FaEnvelope, FaSync, FaTimes } from 'react-icons/fa';
import { getClassesByTeacher } from '../../../api/classes';
import { getClassEnrollments } from '../../../api/enrollments';
import { getAllStudents } from '../../../api/students';
import { getUserData } from '../../../api/apiUtils';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import teacherSidebarSections from './TeacherDashboardSidebar';
import BasicTable from '../../../components/BasicTable';

const TeacherClassPayments = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [studentsData, setStudentsData] = useState({});
  const [classPaymentData, setClassPaymentData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [streamFilter, setStreamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState((new Date().getMonth() + 1).toString());
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [dateFilter, setDateFilter] = useState('');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const teacherData = getUserData();
      setCurrentTeacher(teacherData);

      // Check if we have teacher data with teacherId (same logic as TeacherAllClasses)
      const teacherId = teacherData?.teacherId || teacherData?.id || teacherData?.userid || null;
      
      if (!teacherId) {
        setError('Teacher information not found. Please log in again.');
        return;
      }

      const [classesResponse, studentsResponse] = await Promise.all([
        getClassesByTeacher(teacherId),
        getAllStudents()
      ]);

      if (classesResponse.success) {
        const classesList = classesResponse.data || [];
        setClasses(classesList);
        
        // Handle both array response and object with students property
        if (studentsResponse && Array.isArray(studentsResponse)) {
          const studentsMap = {};
          studentsResponse.forEach(student => {
            // Map user_id to userid for consistency
            const mappedStudent = {
              ...student,
              userid: student.user_id || student.userid,
              firstName: student.first_name || student.firstName,
              lastName: student.last_name || student.lastName,
              mobile: student.mobile_number || student.mobile,
              email: student.email || ''
            };
            studentsMap[mappedStudent.userid] = mappedStudent;
          });
          console.log('Students data loaded:', studentsMap);
          setStudentsData(studentsMap);
        } else if (studentsResponse.success && studentsResponse.students) {
          const studentsMap = {};
          studentsResponse.students.forEach(student => {
            studentsMap[student.userid] = student;
          });
          console.log('Students data loaded (object format):', studentsMap);
          setStudentsData(studentsMap);
        }

        const paymentData = {};
        for (const classItem of classesList) {
          try {
            const enrollmentsResponse = await getClassEnrollments(classItem.id);
            if (enrollmentsResponse.success) {
              paymentData[classItem.id] = enrollmentsResponse.data || [];
            }
          } catch (error) {
            console.error(`Error loading payments for class ${classItem.id}:`, error);
            paymentData[classItem.id] = [];
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

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return 'LKR 0.00';
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-LK');
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'text-green-700 bg-green-100 border border-green-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100 border border-yellow-200';
      case 'overdue':
        return 'text-red-700 bg-red-100 border border-red-200';
      case 'partial':
        return 'text-orange-700 bg-orange-100 border border-orange-200';
      default:
        return 'text-gray-700 bg-gray-100 border border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-700 bg-green-100 border border-green-200';
      case 'inactive':
        return 'text-red-700 bg-red-100 border border-red-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100 border border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-100 border border-gray-200';
    }
  };

  const handleViewPayments = async (classItem) => {
    try {
      const enrollmentsResponse = await getClassEnrollments(classItem.id);
      if (enrollmentsResponse.success) {
        let filteredEnrollments = enrollmentsResponse.data || [];
        
        // Apply date filters to the enrollments only if filters are set
        if (dateFilter) {
          // Filter by specific date
          const targetDate = new Date(dateFilter);
          targetDate.setHours(0, 0, 0, 0);
          
          filteredEnrollments = filteredEnrollments.filter(enrollment => {
            if (!enrollment.payment_history_details) return false;
            
            try {
              const paymentHistory = enrollment.payment_history_details.split('|').map(p => {
                try { return JSON.parse(p); } catch (e) { return null; }
              }).filter(p => p);
              
              return paymentHistory.some(payment => {
                if (!payment.date) return false;
                const paymentDate = new Date(payment.date);
                paymentDate.setHours(0, 0, 0, 0);
                return paymentDate.getTime() === targetDate.getTime();
              });
            } catch (error) {
              return false;
            }
          });
        } else if (monthFilter && yearFilter && monthFilter !== '' && yearFilter !== '') {
          // Filter by month and year only if both are selected
          const targetMonth = parseInt(monthFilter);
          const targetYear = parseInt(yearFilter);
          
          filteredEnrollments = filteredEnrollments.filter(enrollment => {
            if (!enrollment.payment_history_details) return false;
            
            try {
              const paymentHistory = enrollment.payment_history_details.split('|').map(p => {
                try { return JSON.parse(p); } catch (e) { return null; }
              }).filter(p => p);
              
              return paymentHistory.some(payment => {
                if (!payment.date) return false;
                const paymentDate = new Date(payment.date);
                return paymentDate.getMonth() + 1 === targetMonth && paymentDate.getFullYear() === targetYear;
              });
            } catch (error) {
              return false;
            }
          });
        }
        
        setSelectedClass({
          ...classItem,
          enrollments: filteredEnrollments
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
      const paid = parseFloat(enrollment.paid_amount || 0);
      
      if (fee === 0) {
        freeStudents++;
      }
      
      // Count students with "partial" payment status
      if (enrollment.payment_status === 'partial') {
        halfPaidStudents++;
      }
    });
    
    let totalRevenue = 0;
    let cashRevenue = 0;
    let onlineRevenue = 0;
    
    enrollments.forEach(enrollment => {
      if (enrollment.payment_history_details) {
        try {
          const paymentHistory = enrollment.payment_history_details.split('|').map(p => {
            try { return JSON.parse(p); } catch (e) { return null; }
          }).filter(p => p);
          
          paymentHistory.forEach(payment => {
            const amount = parseFloat(payment.amount || 0);
            totalRevenue += amount;
            
            if (payment.payment_method?.toLowerCase() === 'cash') {
              cashRevenue += amount;
            } else if (payment.payment_method?.toLowerCase() === 'online' || payment.payment_method?.toLowerCase() === 'card') {
              onlineRevenue += amount;
            }
          });
        } catch (error) {
          // Fallback to enrollment data
          totalRevenue += parseFloat(enrollment.paid_amount || 0);
        }
      } else {
        totalRevenue += parseFloat(enrollment.paid_amount || 0);
      }
    });

    return {
      totalStudents,
      paidStudents,
      pendingStudents,
      freeStudents,
      halfPaidStudents,
      totalRevenue,
      cashRevenue,
      onlineRevenue
    };
  };

  // Filter classes based on search term and filters
  console.log('Filter values:', { searchTerm, streamFilter, statusFilter, dateFilter, monthFilter, yearFilter });
  
  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = searchTerm === '' || 
      classItem.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStream = streamFilter === '' || classItem.stream === streamFilter;
    const matchesStatus = statusFilter === '' || classItem.status === statusFilter;
    const matchesDelivery = deliveryFilter === '' || classItem.deliveryMethod === deliveryFilter;
    
    // Check if class has enrollments that match date filters
    const enrollments = classPaymentData[classItem.id] || [];
    let matchesDateFilter = true;
    
    if (dateFilter || (monthFilter && yearFilter)) {
      matchesDateFilter = false;
      
      for (const enrollment of enrollments) {
        if (!enrollment.payment_history_details) continue;
        
        try {
          const paymentHistory = enrollment.payment_history_details.split('|').map(p => {
            try { return JSON.parse(p); } catch (e) { return null; }
          }).filter(p => p);
          
          for (const payment of paymentHistory) {
            if (!payment.date) continue;
            
            const paymentDate = new Date(payment.date);
            
            if (dateFilter) {
              // Filter by specific date
              const targetDate = new Date(dateFilter);
              targetDate.setHours(0, 0, 0, 0);
              paymentDate.setHours(0, 0, 0, 0);
              
              if (paymentDate.getTime() === targetDate.getTime()) {
                matchesDateFilter = true;
                break;
              }
            } else if (monthFilter && yearFilter) {
              // Filter by month and year
              const targetMonth = parseInt(monthFilter);
              const targetYear = parseInt(yearFilter);
              
              if (paymentDate.getMonth() + 1 === targetMonth && paymentDate.getFullYear() === targetYear) {
                matchesDateFilter = true;
                break;
              }
            }
          }
          
          if (matchesDateFilter) break;
        } catch (error) {
          continue;
        }
      }
    }
    
    return matchesSearch && matchesStream && matchesStatus && matchesDelivery && matchesDateFilter;
  });
  
  console.log('Filtered classes count:', filteredClasses.length, 'Total classes:', classes.length);

  // Get unique values for filter dropdowns
  const uniqueStreams = [...new Set(classes.map(c => c.stream))].filter(Boolean).sort();
  const uniqueStatuses = ['active', 'inactive']; // Fixed status options
  const uniqueDeliveryMethods = [...new Set(classes.map(c => c.deliveryMethod))].filter(Boolean).sort();

  // Helper functions for monthly revenue calculations
  const calculateCurrentMonthRevenue = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    let totalRevenue = 0;
    let cashRevenue = 0;
    let onlineRevenue = 0;
    
    Object.values(classPaymentData).forEach(enrollments => {
      enrollments.forEach(enrollment => {
        if (enrollment.payment_history_details) {
          try {
            const paymentHistory = enrollment.payment_history_details.split('|').map(p => {
              try { return JSON.parse(p); } catch (e) { return null; }
            }).filter(p => p);
            
            paymentHistory.forEach(payment => {
              if (payment.date) {
                const paymentDate = new Date(payment.date);
                if (paymentDate.getMonth() + 1 === currentMonth && paymentDate.getFullYear() === currentYear) {
                  const amount = parseFloat(payment.amount || 0);
                  totalRevenue += amount;
                  
                  if (payment.payment_method?.toLowerCase() === 'cash') {
                    cashRevenue += amount;
                  } else if (payment.payment_method?.toLowerCase() === 'online' || payment.payment_method?.toLowerCase() === 'card') {
                    onlineRevenue += amount;
                  }
                }
              }
            });
          } catch (error) {
            // Skip malformed data
          }
        }
      });
    });
    
    return { totalRevenue, cashRevenue, onlineRevenue };
  };

  const calculatePreviousMonthRevenue = () => {
    const currentDate = new Date();
    const previousMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
    const previousYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    
    let totalRevenue = 0;
    let cashRevenue = 0;
    let onlineRevenue = 0;
    
    Object.values(classPaymentData).forEach(enrollments => {
      enrollments.forEach(enrollment => {
        if (enrollment.payment_history_details) {
          try {
            const paymentHistory = enrollment.payment_history_details.split('|').map(p => {
              try { return JSON.parse(p); } catch (e) { return null; }
            }).filter(p => p);
            
            paymentHistory.forEach(payment => {
              if (payment.date) {
                const paymentDate = new Date(payment.date);
                if (paymentDate.getMonth() + 1 === previousMonth && paymentDate.getFullYear() === previousYear) {
                  const amount = parseFloat(payment.amount || 0);
                  totalRevenue += amount;
                  
                  if (payment.payment_method?.toLowerCase() === 'cash') {
                    cashRevenue += amount;
                  } else if (payment.payment_method?.toLowerCase() === 'online' || payment.payment_method?.toLowerCase() === 'card') {
                    onlineRevenue += amount;
                  }
                }
              }
            });
          } catch (error) {
            // Skip malformed data
          }
        }
      });
    });
    
    return { totalRevenue, cashRevenue, onlineRevenue };
  };

  const calculateClassPaymentStats = (classId) => {
    const enrollments = classPaymentData[classId] || [];
    
    // Filter enrollments based on date filters
    let filteredEnrollments = enrollments;
    
    if (dateFilter) {
      // Filter by specific date
      const targetDate = new Date(dateFilter);
      targetDate.setHours(0, 0, 0, 0);
      
      filteredEnrollments = enrollments.filter(enrollment => {
        if (!enrollment.payment_history_details) return false;
        
        try {
          const paymentHistory = enrollment.payment_history_details.split('|').map(p => {
            try { return JSON.parse(p); } catch (e) { return null; }
          }).filter(p => p);
          
          return paymentHistory.some(payment => {
            if (!payment.date) return false;
            const paymentDate = new Date(payment.date);
            paymentDate.setHours(0, 0, 0, 0);
            return paymentDate.getTime() === targetDate.getTime();
          });
        } catch (error) {
          return false;
        }
      });
    } else if (monthFilter && yearFilter) {
      // Filter by month and year
      const targetMonth = parseInt(monthFilter);
      const targetYear = parseInt(yearFilter);
      
      filteredEnrollments = enrollments.filter(enrollment => {
        if (!enrollment.payment_history_details) return false;
        
        try {
          const paymentHistory = enrollment.payment_history_details.split('|').map(p => {
            try { return JSON.parse(p); } catch (e) { return null; }
          }).filter(p => p);
          
          return paymentHistory.some(payment => {
            if (!payment.date) return false;
            const paymentDate = new Date(payment.date);
            return paymentDate.getMonth() + 1 === targetMonth && paymentDate.getFullYear() === targetYear;
          });
        } catch (error) {
          return false;
        }
      });
    }
    
    let totalPayments = 0;
    let cashPayments = 0;
    let onlinePayments = 0;
    
    filteredEnrollments.forEach(enrollment => {
      if (enrollment.payment_history_details) {
        try {
          const paymentHistory = enrollment.payment_history_details.split('|').map(p => {
            try { return JSON.parse(p); } catch (e) { return null; }
          }).filter(p => p);
          
          paymentHistory.forEach(payment => {
            const amount = parseFloat(payment.amount || 0);
            totalPayments += amount;
            
            if (payment.payment_method?.toLowerCase() === 'cash') {
              cashPayments += amount;
            } else if (payment.payment_method?.toLowerCase() === 'online' || payment.payment_method?.toLowerCase() === 'card') {
              onlinePayments += amount;
            }
          });
        } catch (error) {
          // Fallback to enrollment data
          totalPayments += parseFloat(enrollment.paid_amount || 0);
        }
      } else {
        totalPayments += parseFloat(enrollment.paid_amount || 0);
      }
    });
    
    const studentsWithPayments = filteredEnrollments.filter(e => {
      // Check if student has any payment history
      if (e.payment_history_details) {
        try {
          const paymentHistory = e.payment_history_details.split('|').map(p => {
            try { return JSON.parse(p); } catch (e) { return null; }
          }).filter(p => p);
          return paymentHistory.length > 0;
        } catch (error) {
          return false;
        }
      }
      return parseFloat(e.paid_amount || 0) > 0;
    }).length;
    
    return {
      totalPayments,
      cashPayments,
      onlinePayments,
      studentsWithPayments,
      totalEnrollments: enrollments.length
    };
  };

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
      label: 'Total Payments',
      render: (row) => {
        const stats = calculateClassPaymentStats(row.id);
        return (
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center space-x-1">
              <div className="bg-green-100 p-1 rounded-full">
                <FaMoneyBill className="text-green-600 text-sm" />
              </div>
              <span className="text-xs font-semibold text-gray-900">
                {formatCurrency(stats.totalPayments)}
              </span>
            </div>
            <div className="flex flex-col space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-green-600 font-medium">Cash:</span>
                <span className="text-green-700">{formatCurrency(stats.cashPayments)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 font-medium">Online:</span>
                <span className="text-blue-700">{formatCurrency(stats.onlinePayments)}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {stats.studentsWithPayments}/{stats.totalEnrollments} students
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
    }
  ];

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

  // Define columns for students table in payment details modal
  const studentColumns = [
    {
      key: 'studentInfo',
      label: 'Student Info',
      render: (row) => {
        const student = studentsData[row.student_id];
        if (!student) {
          return (
            <div className="flex flex-col space-y-1">
              <div className="font-semibold text-gray-900 text-sm">
                {row.student_id}
              </div>
              <div className="text-xs text-gray-700">Student not found</div>
              <div className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded inline-block w-fit">
                ID: {row.student_id}
              </div>
            </div>
          );
        }
        
        // Handle different field name variations
        const firstName = student.firstName || student.first_name || '';
        const lastName = student.lastName || student.last_name || '';
        const school = student.school || student.school_name || 'School not specified';
        
        return (
          <div className="flex flex-col space-y-1">
            <div className="font-semibold text-gray-900 text-sm">
              {firstName && lastName ? `${firstName} ${lastName}` : row.student_id}
            </div>
            <div className="text-xs text-gray-700">{school}</div>
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
        const student = studentsData[row.student_id];
        console.log('Contact render - student_id:', row.student_id, 'student:', student, 'studentsData keys:', Object.keys(studentsData));
        
        if (!student) {
          return (
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-1">
                <FaEnvelope className="text-blue-500 text-xs" />
                <span className="text-xs text-gray-800">Student not found</span>
              </div>
              <div className="flex items-center space-x-1">
                <FaPhone className="text-green-500 text-xs" />
                <span className="text-xs text-gray-800">Student not found</span>
              </div>
            </div>
          );
        }
        
        // Handle different field name variations
        const email = student.email || student.email_address || '';
        const mobile = student.mobile || student.mobile_number || student.phone || '';
        
        console.log('Contact data - email:', email, 'mobile:', mobile);
        
        return (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <FaEnvelope className="text-blue-500 text-xs" />
              <span className="text-xs text-gray-800">{email || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FaPhone className="text-green-500 text-xs" />
              <span className="text-xs text-gray-800">{mobile || 'N/A'}</span>
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
        let paymentMethod = 'N/A';
        
        // Try to get payment method from payment history
        if (row.payment_history_details) {
          try {
            const paymentHistory = row.payment_history_details.split('|').map(p => {
              try { return JSON.parse(p); } catch (e) { return null; }
            }).filter(p => p);
            
            if (paymentHistory.length > 0) {
              const lastPayment = paymentHistory[paymentHistory.length - 1];
              paymentMethod = lastPayment.payment_method || 'N/A';
            }
          } catch (error) {
            // Fallback
          }
        }
        
        return (
          <div className="flex flex-col space-y-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(row.payment_status)}`}>
              {row.payment_status === 'paid' ? 'Paid' :
               row.payment_status === 'pending' ? 'Pending' :
               row.payment_status === 'partial' ? 'Half Card' :
               row.payment_status === 'overdue' ? 'Free Card' :
               row.payment_status || 'Not specified'}
            </span>
            <span className="text-xs text-gray-600">
              {paymentMethod === 'cash' ? '💵 Cash' : 
               paymentMethod === 'online' || paymentMethod === 'card' ? '💳 Online' : 
               'N/A'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => {
        const student = studentsData[row.student_id];
        const fee = parseFloat(row.fee || 0); // Get fee from enrollment data
        const paid = parseFloat(row.paid_amount || 0);
        const remaining = fee - paid;
        
        // Check if student has revision discount (enrolled in theory class)
        const hasTheoryEnrollment = Object.values(classPaymentData).some(enrollments => 
          enrollments.some(enrollment => 
            enrollment.student_id === row.student_id && 
            enrollment.course_type === 'theory' &&
            enrollment.status === 'active'
          )
        );
        
        // Check if current class is revision
        const isRevisionClass = row.course_type === 'revision';
        
        // Apply revision discount logic
        const hasRevisionDiscount = hasTheoryEnrollment && isRevisionClass;
        
        return (
          <div className="flex flex-col space-y-1">
            <div className="text-xs text-gray-700">
              <span className="font-medium">Fee:</span> {formatCurrency(fee)}
            </div>
            <div className="text-xs text-green-600">
              <span className="font-medium">Paid:</span> {formatCurrency(paid)}
            </div>
            {remaining > 0 && !hasRevisionDiscount && (
              <div className="text-xs text-red-600">
                <span className="font-medium">Due:</span> {formatCurrency(remaining)}
              </div>
            )}
            {remaining > 0 && hasRevisionDiscount && (
              <div className="text-xs text-blue-600">
                <span className="font-medium">Discount:</span> {formatCurrency(remaining)}
              </div>
            )}
          </div>
        );
      }
    }
  ];

  // Define actions for students table
  const studentActions = (row) => {
    const student = studentsData[row.student_id];
    return (
      <button
        onClick={() => handleViewStudentDetails(student, row)}
        className="flex items-center justify-center px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded transition-all duration-200 border border-green-200 text-xs font-medium shadow-sm hover:shadow-md"
        title="View Student Details"
      >
        <FaEye size={12} className="mr-1" />
        Details
      </button>
    );
  };

  if (loading) {
    return (
      <DashboardLayout userRole="Teacher" sidebarItems={teacherSidebarSections}>
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
      <DashboardLayout userRole="Teacher" sidebarItems={teacherSidebarSections}>
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
    <DashboardLayout userRole="Teacher" sidebarItems={teacherSidebarSections}>
      <div className="w-full max-w-7xl mx-auto bg-white p-8 rounded-lg shadow">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Class Payments</h1>
            <p className="text-gray-600 mt-2">
              Manage monthly recurring payments for your classes - Teacher ID: {currentTeacher?.teacherId || currentTeacher?.id || currentTeacher?.userid}
            </p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Delivery Methods</option>
            {uniqueDeliveryMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

          <div className="flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStreamFilter('');
                setStatusFilter('');
                setDeliveryFilter('');
                setDateFilter('');
                setMonthFilter((new Date().getMonth() + 1).toString());
                setYearFilter(new Date().getFullYear().toString());
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Reset to Current Month
            </button>
          </div>
        </div>

        {/* Filter Indicator */}
        {(dateFilter || (monthFilter && yearFilter && monthFilter !== '' && yearFilter !== '')) && (
          <div className="mb-4 flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filters applied:</span>
            {dateFilter && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Date: {new Date(dateFilter).toLocaleDateString()}
              </span>
            )}
            {monthFilter && yearFilter && monthFilter !== '' && yearFilter !== '' && !dateFilter && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {new Date(parseInt(yearFilter), parseInt(monthFilter) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            )}
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
              {filteredClasses.length} classes shown
            </span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaGraduationCap className="text-blue-600 text-xl mr-3" />
              <div>
                <p className="text-xs font-medium text-blue-600">My Classes</p>
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
                <div className="flex flex-col space-y-1 text-xs mt-1">
                  <div className="flex justify-between">
                    <span className="text-green-600 font-medium">Cash:</span>
                    <span className="text-green-700">{formatCurrency(filteredClasses.reduce((sum, c) => {
                      const stats = calculateClassPaymentStats(c.id);
                      return sum + stats.cashPayments;
                    }, 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 font-medium">Online:</span>
                    <span className="text-blue-700">{formatCurrency(filteredClasses.reduce((sum, c) => {
                      const stats = calculateClassPaymentStats(c.id);
                      return sum + stats.onlinePayments;
                    }, 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaCalendar className="text-yellow-600 text-xl mr-3" />
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

          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaMoneyBill className="text-indigo-600 text-xl mr-3" />
              <div>
                <p className="text-xs font-medium text-indigo-600">This Month Revenue</p>
                <p className="text-lg font-bold text-indigo-900">
                  {formatCurrency(calculateCurrentMonthRevenue().totalRevenue)}
                </p>
                <div className="flex flex-col space-y-1 text-xs mt-1">
                  <div className="flex justify-between">
                    <span className="text-green-600 font-medium">Cash:</span>
                    <span className="text-green-700">{formatCurrency(calculateCurrentMonthRevenue().cashRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 font-medium">Online:</span>
                    <span className="text-blue-700">{formatCurrency(calculateCurrentMonthRevenue().onlineRevenue)}</span>
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
                  {formatCurrency(calculatePreviousMonthRevenue().totalRevenue)}
                </p>
                <div className="flex flex-col space-y-1 text-xs mt-1">
                  <div className="flex justify-between">
                    <span className="text-green-600 font-medium">Cash:</span>
                    <span className="text-green-700">{formatCurrency(calculatePreviousMonthRevenue().cashRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 font-medium">Online:</span>
                    <span className="text-blue-700">{formatCurrency(calculatePreviousMonthRevenue().onlineRevenue)}</span>
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
                      <p className="text-sm font-bold text-purple-900">{formatCurrency(stats.totalRevenue)}</p>
                      <div className="flex flex-col space-y-1 text-xs mt-2">
                        <div className="flex justify-between">
                          <span className="text-green-600 font-medium">Cash:</span>
                          <span className="text-green-700">{formatCurrency(stats.cashRevenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600 font-medium">Online:</span>
                          <span className="text-blue-700">{formatCurrency(stats.onlineRevenue)}</span>
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
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Payment History - {selectedStudent.firstName} {selectedStudent.lastName}
                </h2>
                <button
                  onClick={closeStudentDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              
              {/* Payment History */}
              {selectedStudent.enrollment && selectedStudent.enrollment.payment_history_details && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Payment History</h3>
                  <div className="space-y-3">
                    {(() => {
                      try {
                        const paymentHistory = selectedStudent.enrollment.payment_history_details.split('|').map(p => {
                          try { return JSON.parse(p); } catch (e) { return null; }
                        }).filter(p => p);
                        
                        if (paymentHistory.length === 0) {
                          return (
                            <div className="text-gray-500 text-center py-4">
                              No payment history available
                            </div>
                          );
                        }
                        
                        return paymentHistory.map((payment, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    Payment #{index + 1}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    payment.payment_method?.toLowerCase() === 'cash' ? 'bg-green-100 text-green-800' :
                                    payment.payment_method?.toLowerCase() === 'online' || payment.payment_method?.toLowerCase() === 'card' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {payment.payment_method === 'cash' ? '💵 Cash' : 
                                     payment.payment_method === 'online' || payment.payment_method === 'card' ? '💳 Online' : 
                                     payment.payment_method || 'N/A'}
                                  </span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                  {formatCurrency(parseFloat(payment.amount || 0))}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {payment.date ? formatDate(payment.date) : 'Date not available'}
                                </div>
                                {payment.notes && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    {payment.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ));
                      } catch (error) {
                        return (
                          <div className="text-red-500 text-center py-4">
                            Error loading payment history
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}
              
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

export default TeacherClassPayments;
