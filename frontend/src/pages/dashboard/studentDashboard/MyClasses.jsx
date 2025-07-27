import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BasicCard from '../../../components/BasicCard';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import { FaCalendar, FaClock, FaMoneyBill, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaEye, FaCreditCard, FaMapMarkerAlt, FaVideo, FaUsers, FaFileAlt, FaDownload, FaPlay, FaHistory, FaQrcode, FaBarcode, FaBell, FaBook, FaGraduationCap, FaUserClock, FaExclamationCircle } from 'react-icons/fa';

const MyClasses = () => {
  const [myClasses, setMyClasses] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [showForgetCardModal, setShowForgetCardModal] = useState(false);
  const [selectedClassForForgetCard, setSelectedClassForForgetCard] = useState(null);
  const [showLatePaymentModal, setShowLatePaymentModal] = useState(false);
  const [selectedClassForLatePayment, setSelectedClassForLatePayment] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('myClasses');
    setMyClasses(stored ? JSON.parse(stored) : []);
  }, []);

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
      case 'late_payment':
        return { color: 'text-orange-600', icon: <FaUserClock />, text: 'Late Payment' };
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

  // Filter classes based on selected tab
  const filteredClasses = myClasses.filter(cls => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'payment-due') {
      const nextPayment = new Date(cls.nextPaymentDate);
      const today = new Date();
      return nextPayment <= today && cls.paymentStatus !== 'paid';
    }
    if (selectedTab === 'overdue') {
      return cls.paymentStatus === 'overdue';
    }
    if (selectedTab === 'late-payment') {
      return cls.paymentStatus === 'late_payment';
    }
    if (selectedTab === 'with-exams') {
      return cls.hasExams;
    }
    if (selectedTab === 'with-tutes') {
      return cls.hasTutes;
    }
    return cls.duration === selectedTab;
  });

  // Handle make payment
  const handleMakePayment = (cls) => {
    navigate(`/student/checkout/${cls.id}`, { state: { type: 'renewal' } });
  };

  // Handle view details
  const handleViewDetails = (cls) => {
    navigate(`/student/my-classes/${cls.id}`, { state: { class: cls } });
  };

  // Handle join class
  const handleJoinClass = (cls) => {
    if (cls.type === 'online' || cls.type === 'hybrid') {
      if (cls.zoomLink) {
        window.open(cls.zoomLink, '_blank');
      } else {
        alert('Zoom link not available for this class.');
      }
    } else {
      alert('This is a physical class. Please attend at the specified location.');
    }
  };

  // Handle attendance marking
  const handleMarkAttendance = (cls) => {
    const updatedClasses = myClasses.map(c => {
      if (c.id === cls.id) {
        const today = new Date().toISOString().split('T')[0];
        const attendance = c.attendance || [];
        const existingRecord = attendance.find(a => a.date === today);
        
        if (!existingRecord) {
          attendance.push({
            date: today,
            status: 'present',
            timestamp: new Date().toISOString()
          });
        }
        
        return { ...c, attendance };
      }
      return c;
    });
    
    setMyClasses(updatedClasses);
    localStorage.setItem('myClasses', JSON.stringify(updatedClasses));
    alert('Attendance marked successfully!');
  };

  // Handle forget card request
  const handleForgetCardRequest = (cls) => {
    setSelectedClassForForgetCard(cls);
    setShowForgetCardModal(true);
  };

  // Submit forget card request
  const submitForgetCardRequest = () => {
    if (selectedClassForForgetCard) {
      const updatedClasses = myClasses.map(c => {
        if (c.id === selectedClassForForgetCard.id) {
          return {
            ...c,
            forgetCardRequested: true,
            forgetCardRequestDate: new Date().toISOString()
          };
        }
        return c;
      });
      
      setMyClasses(updatedClasses);
      localStorage.setItem('myClasses', JSON.stringify(updatedClasses));
      setShowForgetCardModal(false);
      setSelectedClassForForgetCard(null);
      alert('Forget card request submitted successfully!');
    }
  };

  // Handle late payment request
  const handleLatePaymentRequest = (cls) => {
    setSelectedClassForLatePayment(cls);
    setShowLatePaymentModal(true);
  };

  // Submit late payment request
  const submitLatePaymentRequest = () => {
    if (selectedClassForLatePayment) {
      const updatedClasses = myClasses.map(c => {
        if (c.id === selectedClassForLatePayment.id) {
          return {
            ...c,
            paymentStatus: 'late_payment',
            latePaymentRequested: true,
            latePaymentRequestDate: new Date().toISOString()
          };
        }
        return c;
      });
      
      setMyClasses(updatedClasses);
      localStorage.setItem('myClasses', JSON.stringify(updatedClasses));
      setShowLatePaymentModal(false);
      setSelectedClassForLatePayment(null);
      alert('Late payment request submitted successfully! You can attend today\'s class.');
    }
  };

  // Handle exam access
  const handleExamAccess = (cls) => {
    if (cls.hasExams) {
      navigate(`/student/exams/${cls.id}`, { state: { class: cls } });
    } else {
      alert('No exams available for this class yet.');
    }
  };

  // Handle tute access
  const handleTuteAccess = (cls) => {
    if (cls.hasTutes) {
      navigate(`/student/tutes/${cls.id}`, { state: { class: cls } });
    } else {
      alert('No tutes available for this class yet.');
    }
  };

  // Handle view schedule
  const handleViewSchedule = (cls) => {
    navigate(`/student/schedule/${cls.id}`, { state: { class: cls } });
  };

  // Handle notifications
  const handleNotifications = (cls) => {
    navigate(`/student/notifications/${cls.id}`, { state: { class: cls } });
  };

  const tabOptions = [
    { key: 'all', label: 'All Classes' },
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
    { key: 'payment-due', label: 'Payment Due' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'late-payment', label: 'Late Payment' },
    { key: 'with-exams', label: 'With Exams' },
    { key: 'with-tutes', label: 'With Tutes' }
  ];

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="p-2 sm:p-4 md:p-6">
        <h1 className="text-lg font-bold mb-6 text-center">My Classes</h1>
        
        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {tabOptions.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-150 border-2
                ${selectedTab === tab.key
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                  : 'bg-white text-cyan-700 border-cyan-200 hover:bg-cyan-50'}
              `}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 gap-y-8">
          {filteredClasses.length > 0 ? (
            filteredClasses.map((cls) => {
              const paymentStatus = getPaymentStatusInfo(cls.paymentStatus);
              const classType = getClassTypeInfo(cls.type);
              const nextPaymentDate = new Date(cls.nextPaymentDate);
              const today = new Date();
              const isPaymentDue = nextPaymentDate <= today && cls.paymentStatus !== 'paid';
              const canAttendToday = cls.paymentStatus === 'paid' || cls.paymentStatus === 'late_payment';

              return (
                <BasicCard
                  key={cls.id}
                  title={<div><span className="text-sm">{cls.title}</span><div className="text-xs text-gray-500 mt-1">{cls.teacher}</div></div>}
                  price={<span className="text-xs">LKR {cls.price.toLocaleString()}</span>}
                  image={getClassImage(cls.subject)}
                  description={
                    <div className="text-xs text-gray-600 space-y-1">
                      <div><strong>Subject:</strong> {cls.subject}</div>
                      <div><strong>Duration:</strong> {cls.duration}</div>
                      <div><strong>Schedule:</strong> {cls.schedule}</div>
                      <div className="flex items-center gap-1">
                        <span className={classType.color}>{classType.icon}</span>
                        <span>{classType.text}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={paymentStatus.color}>{paymentStatus.icon}</span>
                        <span>{paymentStatus.text}</span>
                      </div>
                      <div><strong>Next Payment:</strong> {nextPaymentDate.toLocaleDateString()}</div>
                      <div><strong>Students:</strong> {cls.currentStudents}/{cls.maxStudents}</div>
                      {cls.attendance && cls.attendance.length > 0 && (
                        <div><strong>Attendance:</strong> {cls.attendance.filter(a => a.status === 'present').length}/{cls.attendance.length}</div>
                      )}
                      {cls.hasExams && <div className="text-blue-600"><FaGraduationCap className="inline mr-1" />Exams Available</div>}
                      {cls.hasTutes && <div className="text-green-600"><FaBook className="inline mr-1" />Tutes Available</div>}
                      {cls.forgetCardRequested && <div className="text-orange-600"><FaQrcode className="inline mr-1" />Forget Card Requested</div>}
                      {isPaymentDue && (
                        <div className="text-red-600 font-semibold">⚠️ Payment Due!</div>
                      )}
                    </div>
                  }
                  buttonText={isPaymentDue ? "Make Payment" : "View Details"}
                  onButtonClick={() => isPaymentDue ? handleMakePayment(cls) : handleViewDetails(cls)}
                >
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {canAttendToday && (
                      <button
                        onClick={() => handleJoinClass(cls)}
                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                        title="Join Class"
                      >
                        <FaPlay /> Join
                      </button>
                    )}
                    
                    {canAttendToday && (
                      <button
                        onClick={() => handleMarkAttendance(cls)}
                        className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700 flex items-center gap-1"
                        title="Mark Attendance"
                      >
                        <FaCheckCircle /> Attend
                      </button>
                    )}
                    
                    {cls.hasExams && (
                      <button
                        onClick={() => handleExamAccess(cls)}
                        className="bg-purple-600 text-white text-xs px-2 py-1 rounded hover:bg-purple-700 flex items-center gap-1"
                        title="Access Exams"
                      >
                        <FaGraduationCap /> Exams
                      </button>
                    )}
                    
                    {cls.hasTutes && (
                      <button
                        onClick={() => handleTuteAccess(cls)}
                        className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700 flex items-center gap-1"
                        title="Access Tutes"
                      >
                        <FaBook /> Tutes
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleViewSchedule(cls)}
                      className="bg-gray-600 text-white text-xs px-2 py-1 rounded hover:bg-gray-700 flex items-center gap-1"
                      title="View Schedule"
                    >
                      <FaCalendar /> Schedule
                    </button>
                    
                    <button
                      onClick={() => handleNotifications(cls)}
                      className="bg-yellow-600 text-white text-xs px-2 py-1 rounded hover:bg-yellow-700 flex items-center gap-1"
                      title="Notifications"
                    >
                      <FaBell /> Notify
                    </button>
                    
                    {!cls.forgetCardRequested && (
                      <button
                        onClick={() => handleForgetCardRequest(cls)}
                        className="bg-orange-600 text-white text-xs px-2 py-1 rounded hover:bg-orange-700 flex items-center gap-1"
                        title="Request Forget Card"
                      >
                        <FaQrcode /> Forget Card
                      </button>
                    )}
                    
                    {cls.paymentStatus === 'overdue' && !cls.latePaymentRequested && (
                      <button
                        onClick={() => handleLatePaymentRequest(cls)}
                        className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700 flex items-center gap-1"
                        title="Request Late Payment"
                      >
                        <FaExclamationCircle /> Late Pay
                      </button>
                    )}
                  </div>
                </BasicCard>
              );
            })
          ) : (
            <div className="text-center text-gray-500 col-span-full mt-8">
              {selectedTab === 'all' ? 'You have not purchased any classes yet.' : `No ${selectedTab} classes found.`}
            </div>
          )}
        </div>

        {/* Forget Card Modal */}
        {showForgetCardModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Request Forget Card</h3>
              <p className="text-gray-600 mb-4">
                You are requesting a forget card for: <strong>{selectedClassForForgetCard?.title}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                This will allow you to attend the class even if you forgot your ID card.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={submitForgetCardRequest}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Submit Request
                </button>
                <button
                  onClick={() => setShowForgetCardModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Late Payment Modal */}
        {showLatePaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Request Late Payment</h3>
              <p className="text-gray-600 mb-4">
                You are requesting late payment for: <strong>{selectedClassForLatePayment?.title}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                This will allow you to attend today's class without immediate payment.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={submitLatePaymentRequest}
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                >
                  Submit Request
                </button>
                <button
                  onClick={() => setShowLatePaymentModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyClasses; 