import React, { useState, useEffect } from 'react';
import { FaUsers, FaGraduationCap, FaCalendar, FaSearch, FaEye, FaClock, FaExclamationTriangle, FaUser, FaPhone, FaEnvelope, FaSchool, FaBook, FaChalkboardTeacher, FaVideo, FaMoneyBill, FaSync } from 'react-icons/fa';
import { getClassesByTeacher } from '../../../api/classes';
import { getClassEnrollments } from '../../../api/enrollments';
import { getAllStudents } from '../../../api/students';
import { getUserData } from '../../../api/apiUtils';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import teacherSidebarSections from './TeacherDashboardSidebar';
import BasicTable from '../../../components/BasicTable';

const TeacherEnrollments = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [streamFilter, setStreamFilter] = useState('');
  const [studentsData, setStudentsData] = useState({});
  const [showEnrollmentDetails, setShowEnrollmentDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentTeacher, setCurrentTeacher] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get teacher data from storage using the same method as TeacherAllClasses
      const teacherData = getUserData();
      setCurrentTeacher(teacherData);
      
      console.log('Teacher data:', teacherData); // Debug log
      
      // Check if we have teacher data with teacherId
      const teacherId = teacherData?.teacherId || teacherData?.id || null;
      
      if (teacherId) {
        // Load classes and students in parallel
        const [classesResponse, studentsResponse] = await Promise.all([
          getClassesByTeacher(teacherId),
          getAllStudents()
        ]);

        if (classesResponse.success) {
          setClasses(classesResponse.data || []);
          console.log('Teacher Classes Found:', classesResponse.data?.length || 0);
          
          // Store students data for quick lookup
          if (studentsResponse.success && studentsResponse.students) {
            const studentsMap = {};
            studentsResponse.students.forEach(student => {
              studentsMap[student.userid] = student;
            });
            setStudentsData(studentsMap);
          }
        } else {
          setError(classesResponse.message || 'Failed to load classes');
        }
      } else {
        setError('Teacher information not found. Please log in again.');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewEnrollments = async (classItem) => {
    try {
      const enrollmentsResponse = await getClassEnrollments(classItem.id);
      if (enrollmentsResponse.success) {
        setSelectedClass({
          ...classItem,
          enrollments: enrollmentsResponse.data || []
        });
        setShowEnrollmentDetails(true);
      }
    } catch (error) {
      console.error('Error loading enrollments:', error);
    }
  };

  const closeEnrollmentDetails = () => {
    setShowEnrollmentDetails(false);
    setSelectedClass(null);
    setSelectedStudent(null);
  };

  const handleViewStudentDetails = (student) => {
    setSelectedStudent(student);
  };

  const closeStudentDetails = () => {
    setSelectedStudent(null);
  };

  // Filter classes based on search term and filters
  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = searchTerm === '' || 
      classItem.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStream = streamFilter === '' || classItem.stream === streamFilter;
    
    return matchesSearch && matchesStream;
  });

  // Get unique values for filter dropdowns
  const uniqueStreams = [...new Set(classes.map(c => c.stream))].filter(Boolean).sort();

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-LK');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-700 bg-green-100 border border-green-200';
      case 'inactive':
        return 'text-red-700 bg-red-100 border border-red-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100 border border-yellow-200';
      case 'completed':
        return 'text-purple-700 bg-purple-100 border border-purple-200';
      case 'cancelled':
        return 'text-red-700 bg-red-100 border border-red-200';
      case 'enrolled':
        return 'text-blue-700 bg-blue-100 border border-blue-200';
      default:
        return 'text-gray-700 bg-gray-100 border border-gray-200';
    }
  };

  // Get delivery method icon
  const getDeliveryIcon = (deliveryMethod) => {
    switch (deliveryMethod?.toLowerCase()) {
      case 'online':
        return <FaVideo className="text-blue-600 text-sm" />;
      case 'physical':
        return <FaChalkboardTeacher className="text-green-600 text-sm" />;
      case 'hybrid':
        return <FaUsers className="text-purple-600 text-sm" />;
      default:
        return <FaBook className="text-gray-600 text-sm" />;
    }
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
      key: 'deliveryMethod',
      label: 'Delivery',
      render: (row) => (
        <div className="flex items-center space-x-1">
          <div className="bg-purple-100 p-1 rounded-full">
            {getDeliveryIcon(row.deliveryMethod)}
          </div>
          <span className="text-xs text-gray-800 capitalize">
            {row.deliveryMethod || 'Not specified'}
          </span>
        </div>
      )
    },
    {
      key: 'enrollments',
      label: 'Enrollments',
      render: (row) => (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-1">
            <div className="bg-blue-100 p-1 rounded-full">
              <FaUsers className="text-blue-600 text-sm" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 text-sm">
                {row.currentStudents || 0}
                <span className="text-gray-500 font-normal text-xs">/{row.maxStudents || 'N/A'}</span>
              </span>
            </div>
          </div>
          <div className={`text-xs px-2 py-0.5 rounded-full font-medium text-center ${getStatusColor(row.status)}`}>
            {row.currentStudents && row.maxStudents ? 
              Math.round((row.currentStudents / row.maxStudents) * 100) : 0}% Full
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div className="flex justify-center">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${getStatusColor(row.status)}`}>
            {row.status || 'Unknown'}
          </span>
        </div>
      )
    }
  ];

  // Define actions for classes table
  const classActions = (row) => (
    <div className="flex flex-col space-y-1">
      <button
        onClick={() => handleViewEnrollments(row)}
        className="flex items-center justify-center px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-all duration-200 border border-blue-200 text-xs font-medium shadow-sm hover:shadow-md"
        title="View Enrollment Details"
      >
        <FaUsers size={12} className="mr-1" />
        Enrollments
      </button>
    </div>
  );

  // Define columns for students table
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
    }
  ];

  // Define actions for students table
  const studentActions = (row) => {
    const student = studentsData[row.student_id];
    return (
      <div className="flex flex-col space-y-1">
        <button
          onClick={() => handleViewStudentDetails(student)}
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
      <DashboardLayout userRole="Teacher" sidebarItems={teacherSidebarSections}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading teacher enrollments...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">My Class Enrollments</h1>
            <p className="text-gray-600 mt-2">
              Manage enrollments for your classes - Teacher ID: {currentTeacher?.teacherId || currentTeacher?.id || currentTeacher?.userid}
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FaSearch className="mr-2" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                <p className="text-sm font-medium text-purple-600">Total Students</p>
                <p className="text-2xl font-bold text-purple-900">
                  {filteredClasses.reduce((sum, c) => sum + (c.currentStudents || 0), 0)}
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

        {/* Enrollment Details Modal */}
        {showEnrollmentDetails && selectedClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Enrollment Details - {selectedClass.className}
                </h2>
                <button
                  onClick={closeEnrollmentDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaSearch size={24} />
                </button>
              </div>
              
              {/* Students Table */}
              <BasicTable
                columns={studentColumns}
                data={selectedClass.enrollments}
                actions={studentActions}
                className=""
              />
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeEnrollmentDetails}
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
                      <label className="font-medium text-gray-700">Parent Mobile:</label>
                      <p className="text-gray-900">{selectedStudent.parentMobile || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Address:</label>
                      <p className="text-gray-900">{selectedStudent.address || 'Not specified'}</p>
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

export default TeacherEnrollments;
