import React, { useState, useEffect } from 'react';
import { FaUsers, FaMoneyBill, FaCalendar, FaSearch, FaGraduationCap, FaExclamationTriangle, FaEye, FaPhone, FaEnvelope } from 'react-icons/fa';
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
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
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
        
        if (studentsResponse.success && studentsResponse.students) {
          const studentsMap = {};
          studentsResponse.students.forEach(student => {
            studentsMap[student.userid] = student;
          });
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
        
        // Apply date filters to the enrollments
        if (dateFilter) {
          // Filter by specific date
          const targetDate = new Date(dateFilter);
          targetDate.setHours(0, 0, 0, 0);
          
          filteredEnrollments = filteredEnrollments.filter(enrollment => {
            if (!enrollment.payment_history_details) return false;
            
            try {
              const paymentHistory = JSON.parse(enrollment.payment_history_details);
              if (!paymentHistory.date) return false;
              
              const paymentDate = new Date(paymentHistory.date);
              paymentDate.setHours(0, 0, 0, 0);
              
              return paymentDate.getTime() === targetDate.getTime();
            } catch (error) {
              return false;
            }
          });
        } else if (monthFilter && yearFilter) {
          // Filter by month and year
          const targetMonth = parseInt(monthFilter);
          const targetYear = parseInt(yearFilter);
          
          filteredEnrollments = filteredEnrollments.filter(enrollment => {
            if (!enrollment.payment_history_details) return false;
            
            try {
              const paymentHistory = JSON.parse(enrollment.payment_history_details);
              if (!paymentHistory.date) return false;
              
              const paymentDate = new Date(paymentHistory.date);
              return paymentDate.getMonth() + 1 === targetMonth && paymentDate.getFullYear() === targetYear;
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

  const handleViewStudentDetails = (student) => {
    setSelectedStudent(student);
  };

  const closeStudentDetails = () => {
    setSelectedStudent(null);
  };

  // Calculate payment statistics
  const calculatePaymentStats = (enrollments) => {
    const totalStudents = enrollments.length;
    const paidStudents = enrollments.filter(e => e.payment_status === 'paid').length;
    const pendingStudents = enrollments.filter(e => e.payment_status === 'pending').length;
    const overdueStudents = enrollments.filter(e => e.payment_status === 'overdue').length;
    const totalRevenue = enrollments.reduce((sum, e) => sum + parseFloat(e.paid_amount || 0), 0);
    const expectedRevenue = enrollments.reduce((sum, e) => {
      const student = studentsData[e.student_id];
      return sum + parseFloat(student?.fee || 0);
    }, 0);

    return {
      totalStudents,
      paidStudents,
      pendingStudents,
      overdueStudents,
      totalRevenue,
      expectedRevenue,
      collectionRate: totalStudents > 0 ? (paidStudents / totalStudents) * 100 : 0
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
    
    // Check if class has enrollments that match date filters
    const enrollments = classPaymentData[classItem.id] || [];
    let matchesDateFilter = true;
    
    if (dateFilter || (monthFilter && yearFilter)) {
      matchesDateFilter = false;
      
      for (const enrollment of enrollments) {
        if (!enrollment.payment_history_details) continue;
        
        try {
          const paymentHistory = JSON.parse(enrollment.payment_history_details);
          if (!paymentHistory.date) continue;
          
          const paymentDate = new Date(paymentHistory.date);
          
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
        } catch (error) {
          continue;
        }
      }
    }
    
    return matchesSearch && matchesStream && matchesStatus && matchesDateFilter;
  });
  
  console.log('Filtered classes count:', filteredClasses.length, 'Total classes:', classes.length);

  // Get unique values for filter dropdowns
  const uniqueStreams = [...new Set(classes.map(c => c.stream))].filter(Boolean).sort();
  const uniqueStatuses = [...new Set(classes.map(c => c.status))].filter(Boolean).sort();

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
          const paymentHistory = JSON.parse(enrollment.payment_history_details);
          if (!paymentHistory.date) return false;
          
          const paymentDate = new Date(paymentHistory.date);
          paymentDate.setHours(0, 0, 0, 0);
          
          return paymentDate.getTime() === targetDate.getTime();
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
          const paymentHistory = JSON.parse(enrollment.payment_history_details);
          if (!paymentHistory.date) return false;
          
          const paymentDate = new Date(paymentHistory.date);
          return paymentDate.getMonth() + 1 === targetMonth && paymentDate.getFullYear() === targetYear;
        } catch (error) {
          return false;
        }
      });
    }
    
    const totalPayments = filteredEnrollments.reduce((sum, e) => sum + parseFloat(e.paid_amount || 0), 0);
    const studentsWithPayments = filteredEnrollments.filter(e => parseFloat(e.paid_amount || 0) > 0).length;
    
    return {
      totalPayments,
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
        return (
          <div className="flex flex-col space-y-1">
            <div className="font-semibold text-gray-900 text-sm">
              {student ? `${student.firstName} ${student.lastName}` : row.student_id}
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
        const student = studentsData[row.student_id];
        return (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <FaEnvelope className="text-blue-500 text-xs" />
              <span className="text-xs text-gray-800">{student?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FaPhone className="text-green-500 text-xs" />
              <span className="text-xs text-gray-800">{student?.mobile || 'N/A'}</span>
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
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(row.payment_status)}`}>
          {row.payment_status || 'Not specified'}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => {
        const student = studentsData[row.student_id];
        const fee = student?.fee || 0;
        const paid = parseFloat(row.paid_amount || 0);
        const remaining = fee - paid;
        
        return (
          <div className="flex flex-col space-y-1">
            <div className="text-xs text-gray-700">
              <span className="font-medium">Fee:</span> {formatCurrency(fee)}
            </div>
            <div className="text-xs text-green-600">
              <span className="font-medium">Paid:</span> {formatCurrency(paid)}
            </div>
            {remaining > 0 && (
              <div className="text-xs text-red-600">
                <span className="font-medium">Due:</span> {formatCurrency(remaining)}
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
        onClick={() => handleViewStudentDetails(student)}
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
            <FaSearch className="mr-2" />
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
            <option value="">All Years</option>
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
              setMonthFilter('');
              setYearFilter('');
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Clear All Filters
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <FaGraduationCap className="text-blue-600 text-2xl mr-4" />
              <div>
                <p className="text-sm font-medium text-blue-600">My Classes</p>
                <p className="text-2xl font-bold text-blue-900">{filteredClasses.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <FaUsers className="text-green-600 text-2xl mr-4" />
              <div>
                <p className="text-sm font-medium text-green-600">Active Classes</p>
                <p className="text-2xl font-bold text-green-900">
                  {filteredClasses.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center">
              <FaMoneyBill className="text-purple-600 text-2xl mr-4" />
              <div>
                <p className="text-sm font-medium text-purple-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(filteredClasses.reduce((sum, c) => {
                    const stats = calculateClassPaymentStats(c.id);
                    return sum + stats.totalPayments;
                  }, 0))}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg">
            <div className="flex items-center">
              <FaCalendar className="text-yellow-600 text-2xl mr-4" />
              <div>
                <p className="text-sm font-medium text-yellow-600">Students with Payments</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {filteredClasses.reduce((sum, c) => {
                    const stats = calculateClassPaymentStats(c.id);
                    return sum + stats.studentsWithPayments;
                  }, 0)}
                </p>
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
            <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                  <FaSearch size={24} />
                </button>
              </div>
              
              {/* Payment Statistics */}
              {(() => {
                const stats = calculatePaymentStats(selectedClass.enrollments);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-600">Total Students</p>
                      <p className="text-xl font-bold text-blue-900">{stats.totalStudents}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-600">Paid Students</p>
                      <p className="text-xl font-bold text-green-900">{stats.paidStudents}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-yellow-600">Pending Payments</p>
                      <p className="text-xl font-bold text-yellow-900">{stats.pendingStudents}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-red-600">Overdue</p>
                      <p className="text-xl font-bold text-red-900">{stats.overdueStudents}</p>
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
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Student Details
                </h2>
                <button
                  onClick={closeStudentDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaSearch size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="font-medium text-gray-700">Name:</label>
                      <p className="text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Student ID:</label>
                      <p className="text-gray-900">{selectedStudent.userid}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Email:</label>
                      <p className="text-gray-900">{selectedStudent.email}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Mobile:</label>
                      <p className="text-gray-900">{selectedStudent.mobile}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">School:</label>
                      <p className="text-gray-900">{selectedStudent.school}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Stream:</label>
                      <p className="text-gray-900">{selectedStudent.stream}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Academic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="font-medium text-gray-700">Parent Name:</label>
                      <p className="text-gray-900">{selectedStudent.parentName}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Parent Mobile:</label>
                      <p className="text-gray-900">{selectedStudent.parentMobile}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Address:</label>
                      <p className="text-gray-900">{selectedStudent.address}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">District:</label>
                      <p className="text-gray-900">{selectedStudent.district}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Date of Birth:</label>
                      <p className="text-gray-900">{formatDate(selectedStudent.dateOfBirth)}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Age:</label>
                      <p className="text-gray-900">{selectedStudent.age}</p>
                    </div>
                  </div>
                </div>
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

export default TeacherClassPayments;
