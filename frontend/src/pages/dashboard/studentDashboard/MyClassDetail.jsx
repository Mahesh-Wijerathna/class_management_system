import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import CustomButton from '../../../components/CustomButton';
import { FaCalendar, FaClock, FaMoneyBill, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaEye, FaCreditCard, FaMapMarkerAlt, FaVideo, FaUsers, FaFileAlt, FaDownload, FaPlay, FaHistory } from 'react-icons/fa';

const MyClassDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [classData, setClassData] = useState(null);

  useEffect(() => {
    if (location.state && location.state.class) {
      setClassData(location.state.class);
    } else {
      // Load from localStorage if not passed via state
      const myClasses = JSON.parse(localStorage.getItem('myClasses') || '[]');
      const foundClass = myClasses.find(c => c.id === parseInt(id, 10));
      setClassData(foundClass);
    }
  }, [id, location.state]);

  if (!classData) {
    return (
      <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
        <div className="p-6 text-center text-gray-500">Class not found.</div>
      </DashboardLayout>
    );
  }

  // Get image based on subject
  const getClassImage = (subject) => {
    const imageMap = {
      'Physics': '/assets/nfts/Nft1.png',
      'Chemistry': '/assets/nfts/Nft2.png',
      'Mathematics': '/assets/nfts/Nft3.png',
      'Biology': '/assets/nfts/Nft4.png',
      'English': '/assets/nfts/Nft5.png',
      'ICT': '/assets/nfts/Nft6.png'
    };
    return imageMap[subject] || '/assets/nfts/Nft1.png';
  };

  // Get payment status info
  const getPaymentStatusInfo = (status) => {
    switch (status) {
      case 'paid':
        return { color: 'text-green-600', icon: <FaCheckCircle />, text: 'Paid' };
      case 'pending':
        return { color: 'text-yellow-600', icon: <FaExclamationTriangle />, text: 'Pending' };
      case 'overdue':
        return { color: 'text-red-600', icon: <FaTimesCircle />, text: 'Overdue' };
      default:
        return { color: 'text-gray-600', icon: <FaClock />, text: 'Unknown' };
    }
  };

  // Get class type info
  const getClassTypeInfo = (type) => {
    switch (type) {
      case 'online':
        return { color: 'text-purple-600', icon: <FaVideo />, text: 'Online' };
      case 'physical':
        return { color: 'text-orange-600', icon: <FaMapMarkerAlt />, text: 'Physical' };
      case 'hybrid':
        return { color: 'text-indigo-600', icon: <FaUsers />, text: 'Hybrid' };
      default:
        return { color: 'text-gray-600', icon: <FaUsers />, text: 'Unknown' };
    }
  };

  // Handle make payment
  const handleMakePayment = () => {
    navigate(`/student/checkout/${classData.id}`, { state: { type: 'renewal' } });
  };

  // Handle join class
  const handleJoinClass = () => {
    if (classData.type === 'online' || classData.type === 'hybrid') {
      // Navigate to live class or open zoom link
      window.open(classData.zoomLink || '#', '_blank');
    } else {
      alert('This is a physical class. Please attend at the specified location.');
    }
  };

  const nextPaymentDate = new Date(classData.nextPaymentDate);
  const today = new Date();
  const isPaymentDue = nextPaymentDate <= today && classData.paymentStatus !== 'paid';
  const paymentStatus = getPaymentStatusInfo(classData.paymentStatus);
  const classType = getClassTypeInfo(classData.type);

  const tabOptions = [
    { key: 'overview', label: 'Overview', icon: <FaEye /> },
    { key: 'payments', label: 'Payments', icon: <FaMoneyBill /> },
    { key: 'attendance', label: 'Attendance', icon: <FaCalendar /> },
    { key: 'materials', label: 'Materials', icon: <FaFileAlt /> },
    { key: 'schedule', label: 'Schedule', icon: <FaClock /> }
  ];

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <img 
            src={getClassImage(classData.subject)} 
            alt={classData.title} 
            className="w-32 h-32 object-cover rounded-xl border"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{classData.title}</h1>
            <div className="text-gray-600 mb-2">By {classData.teacher}</div>
            <div className="text-gray-700 mb-4">{classData.description}</div>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-cyan-700 font-bold text-lg">LKR {classData.price.toLocaleString()}</span>
              <span className={`flex items-center gap-1 ${paymentStatus.color}`}>
                {paymentStatus.icon} {paymentStatus.text}
              </span>
              <span className={`flex items-center gap-1 ${classType.color}`}>
                {classType.icon} {classType.text}
              </span>
            </div>
            <div className="flex gap-2">
              {isPaymentDue && (
                <CustomButton onClick={handleMakePayment} className="bg-red-600 hover:bg-red-700">
                  <FaCreditCard className="mr-2" /> Make Payment
                </CustomButton>
              )}
              <CustomButton onClick={handleJoinClass} className="bg-blue-600 hover:bg-blue-700">
                <FaPlay className="mr-2" /> Join Class
              </CustomButton>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {tabOptions.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 font-semibold rounded-t flex items-center gap-2 ${
                activeTab === tab.key 
                  ? 'bg-cyan-700 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Class Information</h3>
                <div className="space-y-3">
                  <div><strong>Subject:</strong> {classData.subject}</div>
                  <div><strong>Duration:</strong> {classData.duration}</div>
                  <div><strong>Schedule:</strong> {classData.schedule}</div>
                  <div><strong>Start Date:</strong> {new Date(classData.startDate).toLocaleDateString()}</div>
                  <div><strong>End Date:</strong> {new Date(classData.endDate).toLocaleDateString()}</div>
                  <div><strong>Students:</strong> {classData.currentStudents}/{classData.maxStudents}</div>
                  <div><strong>Purchase Date:</strong> {new Date(classData.purchaseDate).toLocaleDateString()}</div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                <div className="space-y-3">
                  <div><strong>Payment Status:</strong> 
                    <span className={`ml-2 ${paymentStatus.color}`}>
                      {paymentStatus.icon} {paymentStatus.text}
                    </span>
                  </div>
                  <div><strong>Payment Method:</strong> {classData.paymentMethod}</div>
                  <div><strong>Next Payment:</strong> {nextPaymentDate.toLocaleDateString()}</div>
                  {isPaymentDue && (
                    <div className="text-red-600 font-semibold">⚠️ Payment is due!</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment History</h3>
              {classData.paymentHistory && classData.paymentHistory.length > 0 ? (
                <div className="space-y-4">
                  {classData.paymentHistory.map((payment, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">Payment #{index + 1}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(payment.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">LKR {payment.amount.toLocaleString()}</div>
                          <div className={`text-sm ${
                            payment.status === 'paid' ? 'text-green-600' : 
                            payment.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {payment.status}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Method: {payment.method} | Invoice: {payment.invoiceId}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">No payment history available.</div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Attendance Record</h3>
              {classData.attendance && classData.attendance.length > 0 ? (
                <div className="space-y-2">
                  {classData.attendance.map((record, index) => (
                    <div key={index} className="flex justify-between items-center border rounded-lg p-3">
                      <div>
                        <div className="font-semibold">Session {index + 1}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">No attendance records available.</div>
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Class Materials</h3>
              <div className="text-gray-500 text-center py-8">
                No materials available yet. Check back later for updates from your teacher.
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Class Schedule</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="font-semibold mb-2">Regular Schedule</div>
                  <div className="text-gray-600">{classData.schedule}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="font-semibold mb-2">Class Period</div>
                  <div className="text-gray-600">
                    {new Date(classData.startDate).toLocaleDateString()} - {new Date(classData.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyClassDetail; 