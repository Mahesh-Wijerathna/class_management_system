import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import cashierSidebarSections from './CashierDashboardSidebar';
import BasicCard from '../../../components/BasicCard';
import CustomTextField from '../../../components/CustomTextField';
import { useNavigate } from 'react-router-dom';
import { 
  LuDownload, 
  LuCalendar,
  LuDollarSign,
  LuTrendingUp,
  LuTrendingDown,
  LuFileText,
  LuReceipt,
  LuUsers,
  LuCreditCard,
  LuFilter,
  LuRefreshCw,
  LuX
} from 'react-icons/lu';

const FinancialReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showFilters, setShowFilters] = useState(false);
  const [financialData, setFinancialData] = useState({
    summary: {},
    revenueByType: [],
    revenueByMethod: [],
    dailyRevenue: [],
    topStudents: []
  });

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod, dateRange]);

  const loadFinancialData = () => {
    setLoading(true);
    
    // Mock data - in real implementation, this would come from API
    setTimeout(() => {
      const mockData = {
        summary: {
          totalRevenue: 45000,
          totalPayments: 85,
          averagePayment: 529.41,
          growthRate: 12.5,
          pendingAmount: 3500,
          refundedAmount: 800
        },
        revenueByType: [
          { type: 'Class Payment', amount: 25000, percentage: 55.6, color: '#3B82F6' },
          { type: 'Study Pack', amount: 12000, percentage: 26.7, color: '#10B981' },
          { type: 'Registration Fee', amount: 5000, percentage: 11.1, color: '#F59E0B' },
          { type: 'Late Fee', amount: 2000, percentage: 4.4, color: '#EF4444' },
          { type: 'Other', amount: 1000, percentage: 2.2, color: '#8B5CF6' }
        ],
        revenueByMethod: [
          { method: 'Cash', amount: 20000, percentage: 44.4, color: '#10B981' },
          { method: 'Card', amount: 15000, percentage: 33.3, color: '#3B82F6' },
          { method: 'Bank Transfer', amount: 6000, percentage: 13.3, color: '#F59E0B' },
          { method: 'Online Payment', amount: 3000, percentage: 6.7, color: '#8B5CF6' },
          { method: 'Mobile Money', amount: 1000, percentage: 2.2, color: '#EF4444' }
        ],
        dailyRevenue: [
          { date: '2024-01-15', revenue: 3500, payments: 15 },
          { date: '2024-01-14', revenue: 2800, payments: 12 },
          { date: '2024-01-13', revenue: 4200, payments: 18 },
          { date: '2024-01-12', revenue: 3100, payments: 14 },
          { date: '2024-01-11', revenue: 3800, payments: 16 },
          { date: '2024-01-10', revenue: 2900, payments: 13 },
          { date: '2024-01-09', revenue: 3600, payments: 15 }
        ],
        topStudents: [
          { name: 'John Doe', studentId: 'STU001', totalPaid: 2500, payments: 5 },
          { name: 'Jane Smith', studentId: 'STU002', totalPaid: 3000, payments: 4 },
          { name: 'Mike Johnson', studentId: 'STU003', totalPaid: 1800, payments: 3 },
          { name: 'Sarah Wilson', studentId: 'STU004', totalPaid: 2200, payments: 4 },
          { name: 'David Brown', studentId: 'STU005', totalPaid: 1600, payments: 3 }
        ]
      };
      
      setFinancialData(mockData);
      setLoading(false);
    }, 1000);
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    
    if (period !== 'custom') {
      const today = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'today':
          startDate = today;
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(today.getMonth() / 3);
          startDate = new Date(today.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(today.getFullYear(), 0, 1);
          break;
        default:
          break;
      }
      
      setDateRange({
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      });
    }
  };

  const downloadReport = (type) => {
    // In a real implementation, this would generate and download a report
    alert(`${type} report download functionality would be implemented here`);
  };

  const getGrowthIcon = (rate) => {
    if (rate > 0) {
      return <LuTrendingUp className="h-4 w-4 text-green-600" />;
    } else if (rate < 0) {
      return <LuTrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getGrowthColor = (rate) => {
    if (rate > 0) return 'text-green-600';
    if (rate < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <DashboardLayout userRole="Cashier" sidebarItems={cashierSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-gray-600 mt-1">Generate and view financial reports and analytics</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <LuFilter className="h-4 w-4" />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>
            <button
              onClick={() => loadFinancialData()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LuRefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <BasicCard>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {periodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </BasicCard>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rs. {financialData.summary.totalRevenue?.toLocaleString() || '0'}
                </p>
                <div className="flex items-center mt-1">
                  {getGrowthIcon(financialData.summary.growthRate)}
                  <span className={`text-xs ml-1 ${getGrowthColor(financialData.summary.growthRate)}`}>
                    {financialData.summary.growthRate > 0 ? '+' : ''}{financialData.summary.growthRate}% from last period
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <LuDollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </BasicCard>

          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{financialData.summary.totalPayments || '0'}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Avg: Rs. {financialData.summary.averagePayment?.toFixed(2) || '0'} per payment
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <LuReceipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </BasicCard>

          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rs. {financialData.summary.pendingAmount?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-yellow-600 mt-1">Requires attention</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <LuCreditCard className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </BasicCard>

          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Refunded Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rs. {financialData.summary.refundedAmount?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-600 mt-1">This period</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <LuTrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </BasicCard>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Payment Type */}
          <BasicCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Revenue by Payment Type</h3>
              <button
                onClick={() => downloadReport('payment-type')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Download
              </button>
            </div>
            <div className="space-y-3">
              {financialData.revenueByType.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900">{item.type}</p>
                      <p className="text-sm text-gray-600">{item.percentage}% of total</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">Rs. {item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </BasicCard>

          {/* Revenue by Payment Method */}
          <BasicCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Revenue by Payment Method</h3>
              <button
                onClick={() => downloadReport('payment-method')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Download
              </button>
            </div>
            <div className="space-y-3">
              {financialData.revenueByMethod.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900">{item.method}</p>
                      <p className="text-sm text-gray-600">{item.percentage}% of total</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">Rs. {item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </BasicCard>
        </div>

        {/* Daily Revenue Chart */}
        <BasicCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Daily Revenue Trend</h3>
            <button
              onClick={() => downloadReport('daily-revenue')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Download
            </button>
          </div>
          <div className="space-y-3">
            {financialData.dailyRevenue.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600">{day.payments} payments</p>
                </div>
                <span className="font-semibold text-gray-900">Rs. {day.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </BasicCard>

        {/* Top Students */}
        <BasicCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Paying Students</h3>
            <button
              onClick={() => downloadReport('top-students')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Download
            </button>
          </div>
          <div className="space-y-3">
            {financialData.topStudents.map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.studentId} • {student.payments} payments</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-900">Rs. {student.totalPaid.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </BasicCard>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => downloadReport('comprehensive')}
            className="flex items-center justify-center space-x-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <LuFileText className="h-5 w-5" />
            <span>Download Comprehensive Report</span>
          </button>
          
          <button
            onClick={() => navigate('/cashier/payment-history')}
            className="flex items-center justify-center space-x-2 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <LuReceipt className="h-5 w-5" />
            <span>View Payment History</span>
          </button>
          
          <button
            onClick={() => navigate('/cashier/students')}
            className="flex items-center justify-center space-x-2 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <LuUsers className="h-5 w-5" />
            <span>View Student Records</span>
          </button>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default FinancialReports; 