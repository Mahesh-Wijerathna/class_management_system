import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import CustomButton from '../../../components/CustomButton';
import { FaCalendar, FaClock, FaMoneyBill, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaEye, FaCreditCard, FaMapMarkerAlt, FaVideo, FaUsers, FaFileAlt, FaDownload, FaPlay, FaHistory, FaBook, FaGraduationCap, FaUserClock, FaExclamationCircle } from 'react-icons/fa';

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

  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  // Format day for display
  const formatDay = (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
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
      case 'late_payment':
        return { color: 'text-orange-600', icon: <FaUserClock />, text: 'Late Payment' };
      default:
        return { color: 'text-gray-600', icon: <FaClock />, text: 'Unknown' };
    }
  };

  // Get delivery method info
  const getDeliveryMethodInfo = (method) => {
    switch (method) {
      case 'online':
        return { color: 'text-purple-600', icon: <FaVideo />, text: 'Online' };
      case 'physical':
        return { color: 'text-orange-600', icon: <FaMapMarkerAlt />, text: 'Physical' };
      case 'hybrid':
        return { color: 'text-indigo-600', icon: <FaUsers />, text: 'Hybrid' };
      default:
        return { color: 'text-gray-600', icon: <FaUsers />, text: method };
    }
  };

  // Get course type info
  const getCourseTypeInfo = (type) => {
    switch (type) {
      case 'theory':
        return { color: 'text-blue-600', icon: <FaBook />, text: 'Theory' };
      case 'revision':
        return { color: 'text-green-600', icon: <FaGraduationCap />, text: 'Revision' };
      case 'both':
        return { color: 'text-purple-600', icon: <FaBook />, text: 'Theory + Revision' };
      default:
        return { color: 'text-gray-600', icon: <FaBook />, text: type };
    }
  };

  // Handle make payment
  const handleMakePayment = () => {
    navigate(`/student/checkout/${classData.id}`, { state: { type: 'renewal' } });
  };

  // Handle join class
  const handleJoinClass = () => {
    if (classData.deliveryMethod === 'online' || classData.deliveryMethod === 'hybrid') {
      if (classData.zoomLink) {
        window.open(classData.zoomLink, '_blank');
      } else {
        alert('Zoom link not available for this class.');
      }
    } else {
      alert('This is a physical class. Please attend at the specified location.');
    }
  };

  const nextPaymentDate = new Date(classData.nextPaymentDate);
  const today = new Date();
  const isPaymentDue = nextPaymentDate <= today && classData.paymentStatus !== 'paid';
  const paymentStatus = getPaymentStatusInfo(classData.paymentStatus);
  const deliveryInfo = getDeliveryMethodInfo(classData.deliveryMethod);
  const courseTypeInfo = getCourseTypeInfo(classData.courseType);
  
  const scheduleText = classData.schedule ? 
    `${formatDay(classData.schedule.day)} ${formatTime(classData.schedule.startTime)}-${formatTime(classData.schedule.endTime)}` : 
    'Schedule not set';

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
            alt={classData.className} 
            className="w-32 h-32 object-cover rounded-xl border"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{classData.className}</h1>
            <div className="text-gray-600 mb-2">By {classData.teacher}</div>
            <div className="text-gray-700 mb-4">{classData.description}</div>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-cyan-700 font-bold text-lg">LKR {parseInt(classData.fee).toLocaleString()}</span>
              <span className={`flex items-center gap-1 ${paymentStatus.color}`}>
                {paymentStatus.icon} {paymentStatus.text}
              </span>
              <span className={`flex items-center gap-1 ${deliveryInfo.color}`}>
                {deliveryInfo.icon} {deliveryInfo.text}
              </span>
              <span className={`flex items-center gap-1 ${courseTypeInfo.color}`}>
                {courseTypeInfo.icon} {courseTypeInfo.text}
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
                  <div><strong>Stream:</strong> {classData.stream}</div>
                  <div><strong>Schedule:</strong> {scheduleText}</div>
                  <div><strong>Frequency:</strong> {classData.schedule?.frequency || 'Not set'}</div>
                  <div><strong>Start Date:</strong> {new Date(classData.startDate).toLocaleDateString()}</div>
                  <div><strong>End Date:</strong> {new Date(classData.endDate).toLocaleDateString()}</div>
                  <div><strong>Students:</strong> {classData.currentStudents || 0}/{classData.maxStudents}</div>
                  <div><strong>Purchase Date:</strong> {new Date(classData.purchaseDate).toLocaleDateString()}</div>
                  {classData.hall && <div><strong>Hall:</strong> {classData.hall}</div>}
                  {classData.zoomLink && (classData.deliveryMethod === 'online' || classData.deliveryMethod === 'hybrid') && (
                    <div><strong>Zoom Link:</strong> <a href={classData.zoomLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Join Meeting</a></div>
                  )}
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
                  {classData.paymentTracking && (
                    <div className="text-green-600 font-semibold">✓ Payment Tracking Enabled</div>
                  )}
                  {classData.theoryRevisionDiscount && classData.courseType === 'both' && (
                    <div className="text-purple-600 font-semibold">✓ Theory + Revision Discount Applied</div>
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
                            {new Date(payment.date).toLocaleDateString()} - {payment.method}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">LKR {payment.amount.toLocaleString()}</div>
                          <div className={`text-sm ${payment.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {payment.status}
                          </div>
                        </div>
                      </div>
                      {payment.invoiceId && (
                        <div className="text-xs text-gray-500 mt-2">Invoice: {payment.invoiceId}</div>
                      )}
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
                <div className="space-y-3">
                  {classData.attendance.map((record, index) => (
                    <div key={index} className="flex justify-between items-center border rounded-lg p-3">
                      <div>
                        <div className="font-semibold">{new Date(record.date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-600">{new Date(record.timestamp).toLocaleTimeString()}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </div>
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
              <h3 className="text-lg font-semibold mb-4">Course Materials</h3>
              <div className="space-y-4">
                {classData.hasExams && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaGraduationCap className="text-blue-600" />
                      <span className="font-semibold">Exams</span>
                    </div>
                    <p className="text-gray-600 mb-3">Access your course exams and assessments.</p>
                    <CustomButton className="bg-blue-600 hover:bg-blue-700">
                      <FaDownload className="mr-2" /> Access Exams
                    </CustomButton>
                  </div>
                )}
                
                {classData.hasTutes && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaBook className="text-green-600" />
                      <span className="font-semibold">Tutes & Materials</span>
                    </div>
                    <p className="text-gray-600 mb-3">Download course materials, tutes, and study resources.</p>
                    <CustomButton className="bg-green-600 hover:bg-green-700">
                      <FaDownload className="mr-2" /> Download Materials
                    </CustomButton>
                  </div>
                )}
                
                {!classData.hasExams && !classData.hasTutes && (
                  <div className="text-gray-500 text-center py-8">No materials available yet.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Class Schedule</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-semibold mb-2">Regular Schedule</div>
                      <div className="space-y-2">
                        <div><strong>Day:</strong> {classData.schedule ? formatDay(classData.schedule.day) : 'Not set'}</div>
                        <div><strong>Time:</strong> {classData.schedule ? `${formatTime(classData.schedule.startTime)} - ${formatTime(classData.schedule.endTime)}` : 'Not set'}</div>
                        <div><strong>Frequency:</strong> {classData.schedule?.frequency || 'Not set'}</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Class Period</div>
                      <div className="space-y-2">
                        <div><strong>Start Date:</strong> {new Date(classData.startDate).toLocaleDateString()}</div>
                        <div><strong>End Date:</strong> {new Date(classData.endDate).toLocaleDateString()}</div>
                        <div><strong>Duration:</strong> {classData.schedule?.frequency || 'Not specified'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {classData.deliveryMethod === 'hybrid' && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="font-semibold mb-2 text-blue-800">Hybrid Class Information</div>
                    <p className="text-blue-700 text-sm">This class alternates between online and physical sessions. Check with your teacher for the current week's format.</p>
                  </div>
                )}
                
                {classData.deliveryMethod === 'physical' && classData.hall && (
                  <div className="border rounded-lg p-4 bg-orange-50">
                    <div className="font-semibold mb-2 text-orange-800">Physical Class Location</div>
                    <p className="text-orange-700">Class will be held in <strong>{classData.hall}</strong></p>
                  </div>
        )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyClassDetail; 