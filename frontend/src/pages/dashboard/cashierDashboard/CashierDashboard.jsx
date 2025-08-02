import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import cashierSidebarSections from './CashierDashboardSidebar';
import BasicCard from '../../../components/BasicCard';
import { useNavigate } from 'react-router-dom';
import { 
  LuDollarSign, 
  LuUsers, 
  LuCreditCard, 
  LuReceipt, 
  LuTrendingUp, 
  LuCalendar, 
  LuCircleCheck, 
  LuClock,
  LuArrowUp,
  LuArrowDown,
  LuUserCheck,
  LuFileText
} from 'react-icons/lu';

// Helper function to get the appropriate storage
const getStorage = () => {
  const usePersistentStorage = sessionStorage.getItem('usePersistentStorage');
  return usePersistentStorage === 'true' ? localStorage : sessionStorage;
};

const CashierDashboard = ({ onLogout }) => {
  const [currentCashier, setCurrentCashier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayPayments: 0,
    totalStudents: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
    todayRevenue: 0,
    weeklyRevenue: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load authenticated user data from appropriate storage
    const storage = getStorage();
    const userData = storage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        
        // Check if user is a cashier
        if (user.role === 'cashier') {
          setCurrentCashier(user);
          // Load cashier-specific data
          loadCashierData();
        } else {
          // If not a cashier, redirect to appropriate dashboard
          console.log("User is not a cashier, redirecting...");
          navigate('/login');
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate('/login');
      }
    } else {
      // If no user data, redirect to login
      console.log("No user data found, redirecting to login");
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const loadCashierData = () => {
    // Mock data - in real implementation, this would come from API
    setStats({
      todayPayments: 15,
      totalStudents: 150,
      pendingPayments: 8,
      monthlyRevenue: 25000,
      todayRevenue: 3500,
      weeklyRevenue: 12000
    });

    setRecentTransactions([
      {
        id: 1,
        studentName: 'John Doe',
        studentId: 'STU001',
        amount: 500,
        type: 'Class Payment',
        status: 'completed',
        time: '2 hours ago',
        paymentMethod: 'Cash'
      },
      {
        id: 2,
        studentName: 'Jane Smith',
        studentId: 'STU002',
        amount: 750,
        type: 'Study Pack',
        status: 'pending',
        time: '4 hours ago',
        paymentMethod: 'Card'
      },
      {
        id: 3,
        studentName: 'Mike Johnson',
        studentId: 'STU003',
        amount: 300,
        type: 'Class Payment',
        status: 'completed',
        time: '6 hours ago',
        paymentMethod: 'Bank Transfer'
      },
      {
        id: 4,
        studentName: 'Sarah Wilson',
        studentId: 'STU004',
        amount: 1200,
        type: 'Registration Fee',
        status: 'completed',
        time: '8 hours ago',
        paymentMethod: 'Online'
      }
    ]);

    setTodaySchedule([
      {
        id: 1,
        time: '9:00 AM',
        activity: 'Payment Collection - Class 10A',
        students: 25,
        status: 'completed'
      },
      {
        id: 2,
        time: '11:00 AM',
        activity: 'Payment Collection - Class 11B',
        students: 20,
        status: 'in-progress'
      },
      {
        id: 3,
        time: '2:00 PM',
        activity: 'Study Pack Sales',
        students: 15,
        status: 'upcoming'
      },
      {
        id: 4,
        time: '4:00 PM',
        activity: 'Late Fee Collection',
        students: 8,
        status: 'upcoming'
      }
    ]);
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show loading or redirect if no cashier data
  if (!currentCashier) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
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
      case 'in-progress':
        return <LuClock className="h-4 w-4 text-blue-600" />;
      case 'upcoming':
        return <LuCalendar className="h-4 w-4 text-gray-600" />;
      default:
        return <LuClock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <DashboardLayout userRole="Cashier" sidebarItems={cashierSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {getGreeting()}, {currentCashier.name || 'Cashier'}!
              </h1>
              <p className="text-blue-100 mt-1">
                Welcome to your cashier dashboard. Here's what's happening today.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-blue-100 text-sm">Today's Date</p>
                <p className="font-semibold">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold">
                  {getInitials(currentCashier.name?.split(' ')[0], currentCashier.name?.split(' ')[1])}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayPayments}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <LuArrowUp className="h-3 w-3 mr-1" />
                  +12% from yesterday
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <LuCreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </BasicCard>

          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <LuUserCheck className="h-3 w-3 mr-1" />
                  Active students
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <LuUsers className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </BasicCard>

          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
                <p className="text-xs text-yellow-600 flex items-center mt-1">
                  <LuClock className="h-3 w-3 mr-1" />
                  Requires attention
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
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">Rs. {stats.todayRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <LuArrowUp className="h-3 w-3 mr-1" />
                  +8% from yesterday
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
                <p className="text-sm font-medium text-gray-600">Weekly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">Rs. {stats.weeklyRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <LuTrendingUp className="h-3 w-3 mr-1" />
                  +15% from last week
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <LuTrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </BasicCard>

          <BasicCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">Rs. {stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <LuArrowUp className="h-3 w-3 mr-1" />
                  +22% from last month
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <LuReceipt className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </BasicCard>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/cashier/process-payment')}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <LuCreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Process Payment</p>
                <p className="text-sm text-gray-600">New transaction</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/cashier/students')}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <LuUsers className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Student Records</p>
                <p className="text-sm text-gray-600">View & manage</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/cashier/payment-history')}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-purple-300"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <LuFileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Payment History</p>
                <p className="text-sm text-gray-600">View transactions</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/cashier/reports')}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-orange-300"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <LuTrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Financial Reports</p>
                <p className="text-sm text-gray-600">Generate reports</p>
              </div>
            </div>
          </button>
        </div>

        {/* Today's Schedule and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <BasicCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
              <button
                onClick={() => navigate('/cashier/payment-schedule')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {todaySchedule.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <p className="font-medium text-gray-900">{item.activity}</p>
                      <p className="text-sm text-gray-600">{item.time} • {item.students} students</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status.replace('-', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </BasicCard>

          {/* Recent Transactions */}
          <BasicCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <button
                onClick={() => navigate('/cashier/payment-history')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">
                        {transaction.studentName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.studentName}</p>
                      <p className="text-sm text-gray-600">{transaction.type} • {transaction.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">Rs. {transaction.amount}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </BasicCard>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default CashierDashboard; 