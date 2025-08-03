import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import cashierSidebarSections from './CashierDashboardSidebar';
import BasicCard from '../../../components/BasicCard';
import BasicTable from '../../../components/BasicTable';
import CustomTextField from '../../../components/CustomTextField';
import CustomSelectField from '../../../components/CustomButton';
import { useNavigate } from 'react-router-dom';
import { 
  LuSearch, 
  LuFilter, 
  LuDownload, 
  LuEye, 
  LuReceipt,
  LuCalendar,
  LuDollarSign,
  LuUser,
  LuCreditCard,
  LuCircleCheck,
  LuClock,
  LuX,
  LuFileText,
  LuTrendingUp,
  LuRefreshCw
} from 'react-icons/lu';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [paymentTypes] = useState([
    { value: '', label: 'All Payment Types' },
    { value: 'class_payment', label: 'Class Payment' },
    { value: 'study_pack', label: 'Study Pack' },
    { value: 'registration_fee', label: 'Registration Fee' },
    { value: 'late_fee', label: 'Late Fee' },
    { value: 'exam_fee', label: 'Exam Fee' },
    { value: 'material_fee', label: 'Material Fee' },
    { value: 'other', label: 'Other' }
  ]);

  const [statusOptions] = useState([
    { value: '', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ]);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchQuery, selectedStatus, selectedPaymentType, dateRange]);

  const loadPaymentHistory = () => {
    setLoading(true);
    
    // Mock data - in real implementation, this would come from API
    setTimeout(() => {
      const mockPayments = [
        {
          id: 1,
          receiptNumber: 'RCP1703123456789',
          studentName: 'John Doe',
          studentId: 'STU001',
          amount: 500,
          paymentType: 'class_payment',
          paymentMethod: 'cash',
          status: 'completed',
          date: '2024-01-15',
          time: '09:30',
          description: 'Class 10A monthly fee',
          cashierName: 'Sarah Wilson'
        },
        {
          id: 2,
          receiptNumber: 'RCP1703123456790',
          studentName: 'Jane Smith',
          studentId: 'STU002',
          amount: 750,
          paymentType: 'study_pack',
          paymentMethod: 'card',
          status: 'completed',
          date: '2024-01-15',
          time: '10:15',
          description: 'Advanced Mathematics study pack',
          cashierName: 'Sarah Wilson'
        },
        {
          id: 3,
          receiptNumber: 'RCP1703123456791',
          studentName: 'Mike Johnson',
          studentId: 'STU003',
          amount: 300,
          paymentType: 'class_payment',
          paymentMethod: 'bank_transfer',
          status: 'pending',
          date: '2024-01-15',
          time: '11:00',
          description: 'Class 12A monthly fee',
          cashierName: 'Sarah Wilson'
        },
        {
          id: 4,
          receiptNumber: 'RCP1703123456792',
          studentName: 'Sarah Wilson',
          studentId: 'STU004',
          amount: 1200,
          paymentType: 'registration_fee',
          paymentMethod: 'online',
          status: 'completed',
          date: '2024-01-14',
          time: '14:30',
          description: 'New student registration',
          cashierName: 'Sarah Wilson'
        },
        {
          id: 5,
          receiptNumber: 'RCP1703123456793',
          studentName: 'David Brown',
          studentId: 'STU005',
          amount: 200,
          paymentType: 'late_fee',
          paymentMethod: 'cash',
          status: 'completed',
          date: '2024-01-14',
          time: '16:45',
          description: 'Late payment penalty',
          cashierName: 'Sarah Wilson'
        },
        {
          id: 6,
          receiptNumber: 'RCP1703123456794',
          studentName: 'Emily Davis',
          studentId: 'STU006',
          amount: 400,
          paymentType: 'exam_fee',
          paymentMethod: 'mobile_money',
          status: 'failed',
          date: '2024-01-13',
          time: '13:20',
          description: 'Final exam fee',
          cashierName: 'Sarah Wilson'
        },
        {
          id: 7,
          receiptNumber: 'RCP1703123456795',
          studentName: 'Michael Wilson',
          studentId: 'STU007',
          amount: 150,
          paymentType: 'material_fee',
          paymentMethod: 'cash',
          status: 'completed',
          date: '2024-01-13',
          time: '15:10',
          description: 'Study materials fee',
          cashierName: 'Sarah Wilson'
        },
        {
          id: 8,
          receiptNumber: 'RCP1703123456796',
          studentName: 'Lisa Anderson',
          studentId: 'STU008',
          amount: 600,
          paymentType: 'class_payment',
          paymentMethod: 'check',
          status: 'refunded',
          date: '2024-01-12',
          time: '10:30',
          description: 'Class 11B monthly fee - refunded due to cancellation',
          cashierName: 'Sarah Wilson'
        }
      ];
      
      setPayments(mockPayments);
      setFilteredPayments(mockPayments);
      setLoading(false);
    }, 1000);
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(payment =>
        payment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(payment => payment.status === selectedStatus);
    }

    // Payment type filter
    if (selectedPaymentType) {
      filtered = filtered.filter(payment => payment.paymentType === selectedPaymentType);
    }

    // Date range filter
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.date);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }

    setFilteredPayments(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedPaymentType('');
    setDateRange({ startDate: '', endDate: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <LuCircleCheck className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <LuClock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <LuX className="h-4 w-4 text-red-600" />;
      case 'refunded':
        return <LuRefreshCw className="h-4 w-4 text-gray-600" />;
      default:
        return <LuClock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPaymentTypeLabel = (type) => {
    const paymentType = paymentTypes.find(pt => pt.value === type);
    return paymentType ? paymentType.label : type;
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: 'Cash',
      card: 'Card',
      bank_transfer: 'Bank Transfer',
      check: 'Check',
      online: 'Online Payment',
      mobile_money: 'Mobile Money'
    };
    return methods[method] || method;
  };

  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const downloadReport = () => {
    // In a real implementation, this would generate and download a CSV/PDF report
    alert('Report download functionality would be implemented here');
  };

  const tableColumns = [
    {
      key: 'receiptNumber',
      label: 'Receipt #',
      render: (row) => (
        <span className="font-mono text-sm text-blue-600">{row.receiptNumber}</span>
      )
    },
    {
      key: 'studentName',
      label: 'Student',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.studentName}</div>
          <div className="text-sm text-gray-500">{row.studentId}</div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className="font-semibold text-gray-900">Rs. {row.amount.toLocaleString()}</span>
      )
    },
    {
      key: 'paymentType',
      label: 'Type',
      render: (row) => (
        <span className="text-sm text-gray-700">{getPaymentTypeLabel(row.paymentType)}</span>
      )
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      render: (row) => (
        <span className="text-sm text-gray-700">{getPaymentMethodLabel(row.paymentMethod)}</span>
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
      key: 'date',
      label: 'Date',
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900">{new Date(row.date).toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">{row.time}</div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => viewPaymentDetails(row)}
          className="text-blue-600 hover:text-blue-800 p-1"
          title="View Details"
        >
          <LuEye className="h-4 w-4" />
        </button>
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
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-600 mt-1">View and manage all payment transactions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={downloadReport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <LuDownload className="h-4 w-4" />
              <span>Download Report</span>
            </button>
            <button
              onClick={() => navigate('/cashier/process-payment')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LuReceipt className="h-4 w-4" />
              <span>New Payment</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <LuReceipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </BasicCard>

          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rs. {payments.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <LuDollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </BasicCard>

          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.status === 'completed').length}
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
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <LuClock className="h-6 w-6 text-yellow-600" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <CustomTextField
                label="Search"
                placeholder="Search by student name, ID, or receipt number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={LuSearch}
              />
              
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

              <select
                value={selectedPaymentType}
                onChange={(e) => setSelectedPaymentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {paymentTypes.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="End Date"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredPayments.length} of {payments.length} payments
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </BasicCard>

        {/* Payment Table */}
          <BasicTable
            data={filteredPayments}
            columns={tableColumns}
            loading={loading}
            emptyMessage="No payments found"
          />

        {/* Payment Details Modal */}
        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <LuX className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Receipt Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Receipt Number:</span>
                        <span className="font-mono text-gray-900">{selectedPayment.receiptNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="text-gray-900">
                          {new Date(selectedPayment.date).toLocaleDateString()} at {selectedPayment.time}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                  {typeof selectedPayment.status === 'string' ? selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1) : selectedPayment.status}
                </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="text-gray-900">{selectedPayment.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Student ID:</span>
                        <span className="text-gray-900">{selectedPayment.studentId}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Payment Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-semibold text-gray-900">Rs. {selectedPayment.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Type:</span>
                        <span className="text-gray-900">{getPaymentTypeLabel(selectedPayment.paymentType)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="text-gray-900">{getPaymentMethodLabel(selectedPayment.paymentMethod)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processed By:</span>
                        <span className="text-gray-900">{selectedPayment.cashierName}</span>
                      </div>
                    </div>
                  </div>

                  {selectedPayment.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {selectedPayment.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate('/cashier/receipt', { state: { payment: selectedPayment } })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Receipt
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
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

export default PaymentHistory; 