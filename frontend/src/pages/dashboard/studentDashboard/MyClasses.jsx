import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BasicCard from '../../../components/BasicCard';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import SecureZoomMeeting from '../../../components/SecureZoomMeeting';
import { FaCalendar, FaClock, FaMoneyBill, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaEye, FaCreditCard, FaMapMarkerAlt, FaVideo, FaUsers, FaFileAlt, FaDownload, FaPlay, FaHistory, FaQrcode, FaBarcode, FaBell, FaBook, FaGraduationCap, FaUserClock, FaExclamationCircle, FaInfoCircle, FaStar, FaCalendarAlt, FaUserGraduate, FaChartLine, FaShieldAlt, FaSearch } from 'react-icons/fa';

const MyClasses = () => {
  const [myClasses, setMyClasses] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [showForgetCardModal, setShowForgetCardModal] = useState(false);
  const [selectedClassForForgetCard, setSelectedClassForForgetCard] = useState(null);
  const [showLatePaymentModal, setShowLatePaymentModal] = useState(false);
  const [selectedClassForLatePayment, setSelectedClassForLatePayment] = useState(null);
  const [showSecureZoomModal, setShowSecureZoomModal] = useState(false);
  const [selectedClassForZoom, setSelectedClassForZoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'payment', 'status'
  const navigate = useNavigate();

  useEffect(() => {
    try {
    const stored = localStorage.getItem('myClasses');
      if (stored) {
        const classes = JSON.parse(stored);
        // Validate and normalize class data
        const validatedClasses = classes.map(cls => ({
          ...cls,
          schedule: cls.schedule || { day: '', startTime: '', endTime: '', frequency: 'weekly' },
          fee: cls.fee || 0,
          maxStudents: cls.maxStudents || 50,
          status: cls.status || 'active',
          currentStudents: cls.currentStudents || 0,
          className: cls.className || 'Unnamed Class',
          subject: cls.subject || 'Unknown Subject',
          teacher: cls.teacher || 'Unknown Teacher',
          stream: cls.stream || 'Unknown Stream',
          deliveryMethod: cls.deliveryMethod || 'online',
          courseType: cls.courseType || 'theory',
          paymentStatus: cls.paymentStatus || 'pending',
          // Handle new payment tracking structure
          paymentTracking: cls.paymentTracking || { enabled: false },
          paymentTrackingFreeDays: cls.paymentTrackingFreeDays || 7,
          // Ensure payment tracking is properly structured
          ...(cls.paymentTracking && typeof cls.paymentTracking === 'object' ? {} : {
            paymentTracking: {
              enabled: cls.paymentTracking || false,
              freeDays: cls.paymentTrackingFreeDays || 7,
              active: cls.paymentTracking || false
            }
          }),
          // Add missing fields with defaults
          attendance: cls.attendance || [],
          paymentHistory: cls.paymentHistory || [],
          hasExams: cls.hasExams || false,
          hasTutes: cls.hasTutes || false,
          forgetCardRequested: cls.forgetCardRequested || false,
          latePaymentRequested: cls.latePaymentRequested || false,
          purchaseDate: cls.purchaseDate || new Date().toISOString(),
          nextPaymentDate: cls.nextPaymentDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }));
        setMyClasses(validatedClasses);
      } else {
        setMyClasses([]);
      }
    } catch (err) {
      console.error('Error loading classes:', err);
      setError('Failed to load classes. Please refresh the page.');
      setMyClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get image based on subject
  const getClassImage = (subject) => {
    if (!subject) return '/assets/nfts/Nft1.png';
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
    try {
    const [hour, minute] = timeStr.split(':');
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
    } catch (err) {
      return timeStr;
    }
  };

  // Format day for display
  const formatDay = (day) => {
    if (!day) return '';
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Get payment status info with enhanced details
  const getPaymentStatusInfo = (status, nextPaymentDate) => {
    const nextPayment = new Date(nextPaymentDate);
    const today = new Date();
    const daysUntilPayment = Math.ceil((nextPayment - today) / (1000 * 60 * 60 * 24));
    
    switch (status) {
      case 'paid':
        return { 
          color: 'text-green-600', 
          icon: <FaCheckCircle />, 
          text: 'Paid',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'pending':
        return { 
          color: 'text-yellow-600', 
          icon: <FaExclamationTriangle />, 
          text: daysUntilPayment > 0 ? `Due in ${daysUntilPayment} days` : 'Due Today',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'overdue':
        return { 
          color: 'text-red-600', 
          icon: <FaTimesCircle />, 
          text: `Overdue by ${Math.abs(daysUntilPayment)} days`,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'late_payment':
        return { 
          color: 'text-orange-600', 
          icon: <FaUserClock />, 
          text: 'Late Payment Approved',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      default:
        return { 
          color: 'text-gray-600', 
          icon: <FaClock />, 
          text: 'Unknown',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
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
        return { color: 'text-gray-600', icon: <FaUsers />, text: method || 'Unknown' };
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
        return { color: 'text-gray-600', icon: <FaBook />, text: type || 'Unknown' };
    }
  };

  // Get class status info
  const getClassStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { color: 'text-green-600', icon: <FaCheckCircle />, text: 'Active', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      case 'inactive':
        return { color: 'text-red-600', icon: <FaTimesCircle />, text: 'Inactive', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
      default:
        return { color: 'text-gray-600', icon: <FaClock />, text: 'Unknown', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    }
  };

  // Get class priority/urgency
  const getClassPriority = (cls) => {
    // If class is inactive, it should be high priority
    if (cls.status === 'inactive') return { priority: 'high', text: 'Inactive', color: 'text-red-600', bgColor: 'bg-red-50' };
    
    const nextPayment = new Date(cls.nextPaymentDate);
    const today = new Date();
    const daysUntilPayment = Math.ceil((nextPayment - today) / (1000 * 60 * 60 * 24));
    
    if (cls.paymentStatus === 'overdue') return { priority: 'high', text: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (cls.paymentStatus === 'pending' && daysUntilPayment <= 3) return { priority: 'medium', text: 'Due Soon', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    if (cls.paymentStatus === 'paid') return { priority: 'low', text: 'Active', color: 'text-green-600', bgColor: 'bg-green-50' };
    return { priority: 'normal', text: 'Normal', color: 'text-gray-600', bgColor: 'bg-gray-50' };
  };

  // Filter and sort classes
  const filteredAndSortedClasses = myClasses
        .filter(cls => {
      // Tab filtering
      if (selectedTab === 'all') return true;
      if (selectedTab === 'active') return cls.status === 'active';
      if (selectedTab === 'inactive') return cls.status === 'inactive';
      if (selectedTab === 'payment-due') {
        const nextPayment = new Date(cls.nextPaymentDate);
        const today = new Date();
        return nextPayment <= today && cls.paymentStatus !== 'paid';
      }
      if (selectedTab === 'overdue') return cls.paymentStatus === 'overdue';
      if (selectedTab === 'late-payment') return cls.paymentStatus === 'late_payment';
      if (selectedTab === 'with-exams') return cls.hasExams;
      if (selectedTab === 'with-tutes') return cls.hasTutes;
      if (selectedTab === 'online') return cls.deliveryMethod === 'online';
      if (selectedTab === 'physical') return cls.deliveryMethod === 'physical';
      if (selectedTab === 'hybrid') return cls.deliveryMethod === 'hybrid';
      if (selectedTab === 'theory') return cls.courseType === 'theory';
      if (selectedTab === 'revision') return cls.courseType === 'revision';
      if (selectedTab === 'both') return cls.courseType === 'both';
      if (selectedTab === 'payment-tracking') return cls.paymentTracking && (cls.paymentTracking.enabled || cls.paymentTracking === true);
      return cls.schedule?.frequency === selectedTab;
    })
    .filter(cls => {
      // Search filtering
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        cls.className?.toLowerCase().includes(searchLower) ||
        cls.subject?.toLowerCase().includes(searchLower) ||
        cls.teacher?.toLowerCase().includes(searchLower) ||
        cls.stream?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Sorting
      switch (sortBy) {
        case 'name':
          return (a.className || '').localeCompare(b.className || '');
        case 'date':
          return new Date(b.purchaseDate) - new Date(a.purchaseDate);
        case 'payment':
          return new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate);
        case 'status':
          const priorityA = getClassPriority(a).priority;
          const priorityB = getClassPriority(b).priority;
          const priorityOrder = { high: 3, medium: 2, normal: 1, low: 0 };
          return priorityOrder[priorityB] - priorityOrder[priorityA];
        default:
          return 0;
      }
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
    if (cls.deliveryMethod === 'online' || cls.deliveryMethod === 'hybrid') {
      if (cls.zoomLink) {
        // Use secure zoom meeting modal instead of opening link directly
        setSelectedClassForZoom(cls);
        setShowSecureZoomModal(true);
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
    { key: 'all', label: 'All Classes', icon: <FaEye />, count: myClasses.length },
    { key: 'active', label: 'Active', icon: <FaCheckCircle />, count: myClasses.filter(c => c.status === 'active').length },
    { key: 'inactive', label: 'Inactive', icon: <FaTimesCircle />, count: myClasses.filter(c => c.status === 'inactive').length },
    { key: 'online', label: 'Online', icon: <FaVideo />, count: myClasses.filter(c => c.deliveryMethod === 'online').length },
    { key: 'physical', label: 'Physical', icon: <FaMapMarkerAlt />, count: myClasses.filter(c => c.deliveryMethod === 'physical').length },
    { key: 'hybrid', label: 'Hybrid', icon: <FaUsers />, count: myClasses.filter(c => c.deliveryMethod === 'hybrid').length },
    { key: 'theory', label: 'Theory', icon: <FaBook />, count: myClasses.filter(c => c.courseType === 'theory').length },
    { key: 'revision', label: 'Revision', icon: <FaGraduationCap />, count: myClasses.filter(c => c.courseType === 'revision').length },
    { key: 'both', label: 'Theory + Revision', icon: <FaBook />, count: myClasses.filter(c => c.courseType === 'both').length },
    { key: 'payment-tracking', label: 'Payment Tracking', icon: <FaMoneyBill />, count: myClasses.filter(c => c.paymentTracking && (c.paymentTracking.enabled || c.paymentTracking === true)).length },
    { key: 'payment-due', label: 'Payment Due', icon: <FaExclamationTriangle />, count: myClasses.filter(c => {
      const nextPayment = new Date(c.nextPaymentDate);
      const today = new Date();
      return nextPayment <= today && c.paymentStatus !== 'paid';
    }).length },
    { key: 'overdue', label: 'Overdue', icon: <FaTimesCircle />, count: myClasses.filter(c => c.paymentStatus === 'overdue').length },
    { key: 'late-payment', label: 'Late Payment', icon: <FaUserClock />, count: myClasses.filter(c => c.paymentStatus === 'late_payment').length },
    { key: 'with-exams', label: 'With Exams', icon: <FaGraduationCap />, count: myClasses.filter(c => c.hasExams).length },
    { key: 'with-tutes', label: 'With Tutes', icon: <FaBook />, count: myClasses.filter(c => c.hasTutes).length }
  ];

  if (loading) {
    return (
      <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your classes...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
        <div className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <FaExclamationCircle className="text-4xl mx-auto mb-2" />
            <p>{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700"
          >
            Refresh Page
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="p-2 sm:p-4 md:p-6">
        {/* Header with Stats */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 text-center">My Classes</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{myClasses.length}</div>
              <div className="text-sm text-blue-700">Total Classes</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {myClasses.filter(c => c.status === 'active').length}
              </div>
              <div className="text-sm text-green-700">Active Classes</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {myClasses.filter(c => {
                  const nextPayment = new Date(c.nextPaymentDate);
                  const today = new Date();
                  return nextPayment <= today && c.paymentStatus !== 'paid';
                }).length}
              </div>
              <div className="text-sm text-yellow-700">Payment Due</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {myClasses.filter(c => c.paymentTracking && (c.paymentTracking.enabled || c.paymentTracking === true)).length}
              </div>
              <div className="text-sm text-purple-700">Payment Tracking</div>
            </div>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search classes by name, subject, teacher, or stream..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="payment">Sort by Payment Due</option>
              <option value="status">Sort by Priority</option>
            </select>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {tabOptions.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-150 border-2 flex items-center gap-2
                ${selectedTab === tab.key
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                  : 'bg-white text-cyan-700 border-cyan-200 hover:bg-cyan-50'}
              `}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.icon} {tab.label}
              <span className="bg-white text-cyan-600 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 gap-y-8">
          {filteredAndSortedClasses.length > 0 ? (
            filteredAndSortedClasses.map((cls) => {
              const paymentStatus = getPaymentStatusInfo(cls.paymentStatus, cls.nextPaymentDate);
              const deliveryInfo = getDeliveryMethodInfo(cls.deliveryMethod);
              const courseTypeInfo = getCourseTypeInfo(cls.courseType);
              const classStatus = getClassStatusInfo(cls.status);
              const priority = getClassPriority(cls);
              const nextPaymentDate = new Date(cls.nextPaymentDate);
              const today = new Date();
              const isPaymentDue = nextPaymentDate <= today && cls.paymentStatus !== 'paid';
              const canAttendToday = (cls.paymentStatus === 'paid' || cls.paymentStatus === 'late_payment') && cls.status === 'active';
              const isInactive = cls.status === 'inactive';
              
              const scheduleText = cls.schedule ? 
                `${formatDay(cls.schedule.day)} ${formatTime(cls.schedule.startTime)}-${formatTime(cls.schedule.endTime)}` : 
                'Schedule not set';

              return (
              <BasicCard
                  key={cls.id}
                  title={
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-semibold">{cls.className}</span>
                        <div className="text-xs text-gray-500 mt-1">{cls.teacher}</div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${priority.bgColor} ${priority.color}`}>
                        {priority.text}
                      </div>
                    </div>
                  }
                  price={<span className="text-xs">LKR {parseInt(cls.fee).toLocaleString()}</span>}
                  image={getClassImage(cls.subject)}
                  description={
                    <div className="text-xs text-gray-600 space-y-2">
                      <div className="flex items-center justify-between">
                        <span><strong>Subject:</strong> {cls.subject}</span>
                        <span><strong>Stream:</strong> {cls.stream}</span>
                      </div>
                      <div><strong>Schedule:</strong> {scheduleText}</div>
                      <div className="flex items-center gap-1">
                        <span className={deliveryInfo.color}>{deliveryInfo.icon}</span>
                        <span>{deliveryInfo.text}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={courseTypeInfo.color}>{courseTypeInfo.icon}</span>
                        <span>{courseTypeInfo.text}</span>
                      </div>
                      <div className={`flex items-center gap-1 p-2 rounded ${paymentStatus.bgColor} ${paymentStatus.borderColor} border`}>
                        <span className={paymentStatus.color}>{paymentStatus.icon}</span>
                        <span className={paymentStatus.color}>{paymentStatus.text}</span>
                      </div>
                      <div className={`flex items-center gap-1 p-2 rounded ${classStatus.bgColor} ${classStatus.borderColor} border`}>
                        <span className={classStatus.color}>{classStatus.icon}</span>
                        <span className={classStatus.color}>{classStatus.text}</span>
                      </div>
                      <div><strong>Next Payment:</strong> {nextPaymentDate.toLocaleDateString()}</div>
                      <div><strong>Students:</strong> {cls.currentStudents || 0}/{cls.maxStudents}</div>
                      {cls.attendance && cls.attendance.length > 0 && (
                        <div><strong>Attendance:</strong> {cls.attendance.filter(a => a.status === 'present').length}/{cls.attendance.length}</div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {cls.hasExams && <span className="text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded"><FaGraduationCap className="inline mr-1" />Exams</span>}
                        {cls.hasTutes && <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded"><FaBook className="inline mr-1" />Tutes</span>}
                        {cls.forgetCardRequested && <span className="text-orange-600 text-xs bg-orange-50 px-2 py-1 rounded"><FaQrcode className="inline mr-1" />Forget Card</span>}
                        {(cls.paymentTracking && (cls.paymentTracking.enabled || cls.paymentTracking === true)) && (
                          <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded">
                            <FaMoneyBill className="inline mr-1" />
                            Payment Tracking
                            {cls.paymentTracking.enabled && cls.paymentTracking.freeDays && (
                              <span> ({cls.paymentTracking.freeDays}d)</span>
                            )}
                            {cls.paymentTracking === true && (
                              <span> (7d)</span>
                            )}
                          </span>
                        )}
                        {cls.theoryRevisionDiscount && cls.courseType === 'both' && <span className="text-purple-600 text-xs bg-purple-50 px-2 py-1 rounded"><FaMoneyBill className="inline mr-1" />Discount</span>}
                      </div>
                      {isPaymentDue && (
                        <div className="text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-200">⚠️ Payment Due!</div>
                      )}
                      {isInactive && (
                        <div className="text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-200">⚠️ This class has been deactivated by the admin.</div>
                      )}
                    </div>
                  }
                  buttonText={isPaymentDue ? "Make Payment" : "View Details"}
                  onButtonClick={() => isPaymentDue ? handleMakePayment(cls) : handleViewDetails(cls)}
                >
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {canAttendToday && !isInactive && (
                      <button
                        onClick={() => handleJoinClass(cls)}
                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                        title="Join Class"
                      >
                        <FaPlay /> Join
                      </button>
                    )}
                    
                    {canAttendToday && !isInactive && (
                      <button
                        onClick={() => handleMarkAttendance(cls)}
                        className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700 flex items-center gap-1"
                        title="Mark Attendance"
                      >
                        <FaCheckCircle /> Attend
                      </button>
                    )}
                    
                    {isInactive && (
                      <button
                        disabled
                        className="bg-gray-400 text-white text-xs px-2 py-1 rounded cursor-not-allowed flex items-center gap-1"
                        title="Class is inactive"
                      >
                        <FaTimesCircle /> Inactive
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
              {selectedTab === 'all' && !searchTerm ? 'You have not purchased any classes yet.' : `No ${selectedTab} classes found.`}
              {searchTerm && <div className="mt-2">Try adjusting your search terms.</div>}
            </div>
          )}
        </div>

        {/* Forget Card Modal */}
        {showForgetCardModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Request Forget Card</h3>
              <p className="text-gray-600 mb-4">
                You are requesting a forget card for: <strong>{selectedClassForForgetCard?.className}</strong>
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
                You are requesting late payment for: <strong>{selectedClassForLatePayment?.className}</strong>
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

        {/* Secure Zoom Meeting Modal */}
        {showSecureZoomModal && selectedClassForZoom && (
          <SecureZoomMeeting
            zoomLink={selectedClassForZoom.zoomLink}
            className={selectedClassForZoom.className}
            onClose={() => {
              setShowSecureZoomModal(false);
              setSelectedClassForZoom(null);
            }}
            isOpen={showSecureZoomModal}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyClasses; 