import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import cashierSidebarSections from './CashierDashboardSidebar';
import BasicCard from '../../../components/BasicCard';
import BasicTable from '../../../components/BasicTable';
import CustomTextField from '../../../components/CustomTextField';
import { useNavigate } from 'react-router-dom';
import { 
  LuSearch, 
  LuFilter, 
  LuUser, 
  LuMail, 
  LuPhone,
  LuCalendar,
  LuDollarSign,
  LuCreditCard,
  LuEye,
  LuFileText,
  LuUsers,
  LuBookOpen,
  LuClock,
  LuCircleCheck,
  LuX,
  LuPlus,
  LuDownload
} from 'react-icons/lu';

const StudentRecords = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const [classes] = useState([
    { value: '', label: 'All Classes' },
    { value: 'Class 10A', label: 'Class 10A' },
    { value: 'Class 10B', label: 'Class 10B' },
    { value: 'Class 11A', label: 'Class 11A' },
    { value: 'Class 11B', label: 'Class 11B' },
    { value: 'Class 12A', label: 'Class 12A' },
    { value: 'Class 12B', label: 'Class 12B' }
  ]);

  const [statusOptions] = useState([
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending Payment' },
    { value: 'overdue', label: 'Payment Overdue' }
  ]);

  useEffect(() => {
    loadStudentRecords();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, selectedClass, selectedStatus]);

  const loadStudentRecords = () => {
    setLoading(true);
    
    // Mock data - in real implementation, this would come from API
    setTimeout(() => {
      const mockStudents = [
        {
          id: 1,
          studentId: 'STU001',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '0771234567',
          class: 'Class 10A',
          status: 'active',
          registrationDate: '2023-09-01',
          totalPaid: 2500,
          pendingAmount: 0,
          lastPaymentDate: '2024-01-15',
          paymentHistory: [
            { date: '2024-01-15', amount: 500, type: 'Class Payment' },
            { date: '2023-12-15', amount: 500, type: 'Class Payment' },
            { date: '2023-11-15', amount: 500, type: 'Class Payment' },
            { date: '2023-10-15', amount: 500, type: 'Class Payment' },
            { date: '2023-09-15', amount: 500, type: 'Class Payment' }
          ]
        },
        {
          id: 2,
          studentId: 'STU002',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '0772345678',
          class: 'Class 11B',
          status: 'active',
          registrationDate: '2023-08-15',
          totalPaid: 3000,
          pendingAmount: 0,
          lastPaymentDate: '2024-01-10',
          paymentHistory: [
            { date: '2024-01-10', amount: 750, type: 'Study Pack' },
            { date: '2023-12-10', amount: 750, type: 'Study Pack' },
            { date: '2023-11-10', amount: 750, type: 'Study Pack' },
            { date: '2023-10-10', amount: 750, type: 'Study Pack' }
          ]
        },
        {
          id: 3,
          studentId: 'STU003',
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          phone: '0773456789',
          class: 'Class 12A',
          status: 'pending',
          registrationDate: '2024-01-05',
          totalPaid: 1200,
          pendingAmount: 300,
          lastPaymentDate: '2024-01-05',
          paymentHistory: [
            { date: '2024-01-05', amount: 1200, type: 'Registration Fee' }
          ]
        },
        {
          id: 4,
          studentId: 'STU004',
          name: 'Sarah Wilson',
          email: 'sarah.wilson@example.com',
          phone: '0774567890',
          class: 'Class 10B',
          status: 'active',
          registrationDate: '2023-09-10',
          totalPaid: 2000,
          pendingAmount: 0,
          lastPaymentDate: '2024-01-12',
          paymentHistory: [
            { date: '2024-01-12', amount: 500, type: 'Class Payment' },
            { date: '2023-12-12', amount: 500, type: 'Class Payment' },
            { date: '2023-11-12', amount: 500, type: 'Class Payment' },
            { date: '2023-10-12', amount: 500, type: 'Class Payment' }
          ]
        },
        {
          id: 5,
          studentId: 'STU005',
          name: 'David Brown',
          email: 'david.brown@example.com',
          phone: '0775678901',
          class: 'Class 11A',
          status: 'overdue',
          registrationDate: '2023-08-20',
          totalPaid: 1800,
          pendingAmount: 500,
          lastPaymentDate: '2023-12-20',
          paymentHistory: [
            { date: '2023-12-20', amount: 500, type: 'Class Payment' },
            { date: '2023-11-20', amount: 500, type: 'Class Payment' },
            { date: '2023-10-20', amount: 500, type: 'Class Payment' },
            { date: '2023-09-20', amount: 300, type: 'Registration Fee' }
          ]
        },
        {
          id: 6,
          studentId: 'STU006',
          name: 'Emily Davis',
          email: 'emily.davis@example.com',
          phone: '0776789012',
          class: 'Class 12B',
          status: 'active',
          registrationDate: '2023-09-05',
          totalPaid: 3200,
          pendingAmount: 0,
          lastPaymentDate: '2024-01-08',
          paymentHistory: [
            { date: '2024-01-08', amount: 800, type: 'Study Pack' },
            { date: '2023-12-08', amount: 800, type: 'Study Pack' },
            { date: '2023-11-08', amount: 800, type: 'Study Pack' },
            { date: '2023-10-08', amount: 800, type: 'Study Pack' }
          ]
        },
        {
          id: 7,
          studentId: 'STU007',
          name: 'Michael Wilson',
          email: 'michael.wilson@example.com',
          phone: '0777890123',
          class: 'Class 10A',
          status: 'inactive',
          registrationDate: '2023-08-01',
          totalPaid: 1000,
          pendingAmount: 0,
          lastPaymentDate: '2023-10-01',
          paymentHistory: [
            { date: '2023-10-01', amount: 500, type: 'Class Payment' },
            { date: '2023-09-01', amount: 500, type: 'Class Payment' }
          ]
        },
        {
          id: 8,
          studentId: 'STU008',
          name: 'Lisa Anderson',
          email: 'lisa.anderson@example.com',
          phone: '0778901234',
          class: 'Class 11B',
          status: 'active',
          registrationDate: '2023-09-15',
          totalPaid: 2250,
          pendingAmount: 0,
          lastPaymentDate: '2024-01-14',
          paymentHistory: [
            { date: '2024-01-14', amount: 750, type: 'Study Pack' },
            { date: '2023-12-14', amount: 750, type: 'Study Pack' },
            { date: '2023-11-14', amount: 750, type: 'Study Pack' }
          ]
        }
      ];
      
      setStudents(mockStudents);
      setFilteredStudents(mockStudents);
      setLoading(false);
    }, 1000);
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.phone.includes(searchQuery)
      );
    }

    // Class filter
    if (selectedClass) {
      filtered = filtered.filter(student => student.class === selectedClass);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(student => student.status === selectedStatus);
    }

    setFilteredStudents(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedClass('');
    setSelectedStatus('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <LuCircleCheck className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <LuX className="h-4 w-4 text-gray-600" />;
      case 'pending':
        return <LuClock className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <LuClock className="h-4 w-4 text-red-600" />;
      default:
        return <LuClock className="h-4 w-4 text-gray-600" />;
    }
  };

  const viewStudentDetails = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const processPayment = (student) => {
    navigate('/cashier/process-payment', { 
      state: { 
        selectedStudent: {
          id: student.id,
          name: student.name,
          studentId: student.studentId,
          mobile: student.phone,
          email: student.email,
          class: student.class
        }
      } 
    });
  };

  const downloadStudentList = () => {
    // In a real implementation, this would generate and download a CSV/PDF report
    alert('Student list download functionality would be implemented here');
  };

  const tableColumns = [
    {
      key: 'studentId',
      label: 'Student ID',
      render: (row) => (
        <span className="font-mono text-sm text-blue-600">{row.studentId}</span>
      )
    },
    {
      key: 'name',
      label: 'Student Name',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      )
    },
    {
      key: 'class',
      label: 'Class',
      render: (row) => (
        <span className="text-sm text-gray-700">{row.class}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
            {typeof row.status === 'string' ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : row.status}
          </span>
        </div>
      )
    },
    {
      key: 'totalPaid',
      label: 'Total Paid',
      render: (row) => (
        <span className="font-semibold text-green-600">Rs. {row.totalPaid.toLocaleString()}</span>
      )
    },
    {
      key: 'pendingAmount',
      label: 'Pending',
      render: (row) => (
        <span className={`font-semibold ${row.pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
          Rs. {row.pendingAmount.toLocaleString()}
        </span>
      )
    },
    {
      key: 'lastPaymentDate',
      label: 'Last Payment',
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900">{new Date(row.lastPaymentDate).toLocaleDateString()}</div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => viewStudentDetails(row)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="View Details"
          >
            <LuEye className="h-4 w-4" />
          </button>
          <button
            onClick={() => processPayment(row)}
            className="text-green-600 hover:text-green-800 p-1"
            title="Process Payment"
          >
            <LuCreditCard className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout userRole="Cashier" sidebarItems={cashierSidebarSections}>
     <div className="p-6 bg-white rounded-lg shadow">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Records</h1>
            <p className="text-gray-600 mt-1">View and manage student information and payment records</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={downloadStudentList}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <LuDownload className="h-4 w-4" />
              <span>Download List</span>
            </button>
            <button
              onClick={() => navigate('/cashier/process-payment')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LuPlus className="h-4 w-4" />
              <span>New Payment</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <LuUsers className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </BasicCard>

          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.status === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <LuCircleCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </BasicCard>

          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <LuClock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </BasicCard>

          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rs. {students.reduce((sum, student) => sum + student.totalPaid, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <LuDollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </BasicCard>
        </div>

        {/* Filters */}
        <BasicCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <LuFilter className="h-4 w-4" />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <CustomTextField
                label="Search"
                placeholder="Search by name, ID, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={LuSearch}
              />
              
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {classes.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredStudents.length} of {students.length} students
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </BasicCard>

        {/* Student Table */}
          <BasicTable
            data={filteredStudents}
            columns={tableColumns}
            loading={loading}
            emptyMessage="No students found"
          />
        

        {/* Student Details Modal */}
        {showStudentModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-25xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Student Details</h3>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <LuX className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Student ID:</span>
                        <span className="font-mono text-gray-900">{selectedStudent.studentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="text-gray-900">{selectedStudent.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="text-gray-900">{selectedStudent.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="text-gray-900">{selectedStudent.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Class:</span>
                        <span className="text-gray-900">{selectedStudent.class}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedStudent.status)}`}>
                  {typeof selectedStudent.status === 'string' ? selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1) : selectedStudent.status}
                </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registration Date:</span>
                        <span className="text-gray-900">{new Date(selectedStudent.registrationDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Financial Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Paid:</span>
                        <span className="font-semibold text-green-600">Rs. {selectedStudent.totalPaid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending Amount:</span>
                        <span className={`font-semibold ${selectedStudent.pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          Rs. {selectedStudent.pendingAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Payment:</span>
                        <span className="text-gray-900">{new Date(selectedStudent.lastPaymentDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Payment History</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedStudent.paymentHistory.map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{payment.type}</p>
                          <p className="text-sm text-gray-600">{new Date(payment.date).toLocaleDateString()}</p>
                        </div>
                        <span className="font-semibold text-green-600">Rs. {payment.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => processPayment(selectedStudent)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Process Payment
                </button>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentRecords; 