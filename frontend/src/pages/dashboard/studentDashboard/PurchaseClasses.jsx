import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BasicCard from '../../../components/BasicCard';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import { FaCalendar, FaClock, FaMoneyBill, FaUser, FaBook, FaVideo, FaMapMarkerAlt, FaUsers, FaGraduationCap, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

const PurchaseClasses = () => {
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [classes, setClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load classes and student's purchased classes from localStorage
  useEffect(() => {
    try {
      // Load available classes
      const savedClasses = localStorage.getItem('classes');
      if (savedClasses) {
        const allClasses = JSON.parse(savedClasses);
        // Ensure all classes have the required structure (like in CreateClass.jsx)
        const validatedClasses = allClasses.map(cls => ({
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
          })
        }));
        
        // Filter only active classes for purchase
        const activeClasses = validatedClasses.filter(cls => cls.status === 'active');
        setClasses(activeClasses);
      } else {
        setClasses([]);
      }

      // Load student's purchased classes
      const savedMyClasses = localStorage.getItem('myClasses');
      if (savedMyClasses) {
        setMyClasses(JSON.parse(savedMyClasses));
      } else {
        setMyClasses([]);
      }
    } catch (err) {
      console.error('Error loading classes:', err);
      setError('Failed to load classes. Please refresh the page.');
      setClasses([]);
      setMyClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if student already owns a class
  const checkStudentOwnership = (classId) => {
    return myClasses.some(myClass => myClass.id === classId);
  };

  // Check if student owns the related theory class for a revision class
  const checkRelatedTheoryOwnership = (revisionClass) => {
    if (revisionClass.courseType !== 'revision' || !revisionClass.relatedTheoryId) {
      return false;
    }
    return myClasses.some(myClass => myClass.id === revisionClass.relatedTheoryId);
  };

  // Get purchase status for a class
  const getPurchaseStatus = (cls) => {
    const alreadyOwned = checkStudentOwnership(cls.id);
    const ownsRelatedTheory = checkRelatedTheoryOwnership(cls);

    if (alreadyOwned) {
      return {
        status: 'owned',
        text: 'Already Purchased',
        color: 'text-green-600',
        icon: <FaCheckCircle />,
        buttonText: 'View in My Classes',
        buttonAction: 'view',
        disabled: false
      };
    }

    if (cls.courseType === 'revision' && cls.revisionDiscountPrice && ownsRelatedTheory) {
      return {
        status: 'discount_available',
        text: 'Discount Available (Theory Student)',
        color: 'text-blue-600',
        icon: <FaExclamationTriangle />,
        buttonText: 'Buy with Discount',
        buttonAction: 'purchase',
        disabled: false
      };
    }

    return {
      status: 'available',
      text: 'Available for Purchase',
      color: 'text-gray-600',
      icon: <FaBook />,
      buttonText: 'Buy Now',
      buttonAction: 'purchase',
      disabled: false
    };
  };

  // Filter classes based on tab and search with improved error handling
  const filteredClasses = classes.filter(cls => {
    try {
      const matchesTab = selectedTab === 'all' || 
                        (selectedTab === 'online' && cls.deliveryMethod === 'online') ||
                        (selectedTab === 'physical' && cls.deliveryMethod === 'physical') ||
                        (selectedTab === 'hybrid' && cls.deliveryMethod === 'hybrid') ||
                        (selectedTab === 'theory' && cls.courseType === 'theory') ||
                        (selectedTab === 'revision' && cls.courseType === 'revision');
      
      const searchTerm = search.toLowerCase();
      const matchesSearch = 
        (cls.className || '').toLowerCase().includes(searchTerm) ||
        (cls.teacher || '').toLowerCase().includes(searchTerm) ||
        (cls.subject || '').toLowerCase().includes(searchTerm) ||
        (cls.stream || '').toLowerCase().includes(searchTerm);
      
      return matchesTab && matchesSearch;
    } catch (err) {
      console.error('Error filtering class:', cls, err);
      return false;
    }
  });

  // Get image based on subject with fallback
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

  // Format time for display with null checks (like in CreateClass.jsx)
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [hour, minute] = timeStr.split(':');
      let h = parseInt(hour, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${minute} ${ampm}`;
    } catch (err) {
      console.error('Error formatting time:', timeStr, err);
      return timeStr || '';
    }
  };

  // Format day for display with null checks (like in CreateClass.jsx)
  const formatDay = (day) => {
    if (!day) return '';
    try {
      return day.charAt(0).toUpperCase() + day.slice(1);
    } catch (err) {
      console.error('Error formatting day:', day, err);
      return day || '';
    }
  };

  // Get delivery method info with fallbacks
  const getDeliveryMethodInfo = (method) => {
    if (!method) {
      return { color: 'text-gray-600', icon: <FaUsers />, text: 'Unknown' };
    }
    
    switch (method) {
      case 'online':
        return { color: 'text-purple-600', icon: <FaVideo />, text: 'Online' };
      case 'physical':
        return { color: 'text-orange-600', icon: <FaMapMarkerAlt />, text: 'Physical' };
      case 'hybrid':
        return { color: 'text-indigo-600', icon: <FaUsers />, text: 'Hybrid' };
      case 'other':
        return { color: 'text-gray-600', icon: <FaUsers />, text: 'Other' };
      default:
        return { color: 'text-gray-600', icon: <FaUsers />, text: method };
    }
  };

  // Get course type info with fallbacks
  const getCourseTypeInfo = (type) => {
    if (!type) {
      return { color: 'text-gray-600', icon: <FaBook />, text: 'Unknown' };
    }
    
    switch (type) {
      case 'theory':
        return { color: 'text-blue-600', icon: <FaBook />, text: 'Theory' };
      case 'revision':
        return { color: 'text-green-600', icon: <FaGraduationCap />, text: 'Revision' };
      default:
        return { color: 'text-gray-600', icon: <FaBook />, text: type };
    }
  };

  

  const tabOptions = [
    { key: 'all', label: 'All Classes' },
    { key: 'online', label: 'Online' },
    { key: 'physical', label: 'Physical' },
    { key: 'hybrid', label: 'Hybrid' },
    { key: 'theory', label: 'Theory' },
    { key: 'revision', label: 'Revision' }
  ];

  // Handle button actions
  const handleButtonAction = (cls, action) => {
    try {
      if (action === 'view') {
        navigate('/student/my-classes');
      } else if (action === 'purchase') {
        navigate(`/student/checkout/${cls.id}`);
      }
    } catch (err) {
      console.error('Error handling button action:', err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
        <div className="p-2 sm:p-4 md:p-6">
          <div className="text-center text-gray-500 mt-8">Loading classes...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
        <div className="p-2 sm:p-4 md:p-6">
          <div className="text-center text-red-500 mt-8">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="p-2 sm:p-4 md:p-6">
        <h1 className="text-lg font-bold mb-6 text-center">Available Classes</h1>
        
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

        <div className="flex justify-center mb-6">
          <input
            type="text"
            placeholder="Search by class name, teacher, subject, or stream..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full max-w-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 gap-y-8">
          {filteredClasses.map((cls) => {
            try {
              const deliveryInfo = getDeliveryMethodInfo(cls.deliveryMethod);
              const courseTypeInfo = getCourseTypeInfo(cls.courseType);
              const purchaseStatus = getPurchaseStatus(cls);
              const scheduleText = cls.schedule ? 
                `${formatDay(cls.schedule.day)} ${formatTime(cls.schedule.startTime)}-${formatTime(cls.schedule.endTime)}` : 
                'Schedule not set';

              // Calculate fee with discount for revision classes
              let displayFee = Number(cls.fee) || 0;
              let discountInfo = null;
              let finalFee = displayFee;
              
              if (cls.courseType === 'revision' && cls.revisionDiscountPrice && checkRelatedTheoryOwnership(cls)) {
                const discount = Number(cls.revisionDiscountPrice) || 0;
                finalFee = Math.max(0, displayFee - discount);
                discountInfo = `(Theory student: Rs. ${finalFee.toLocaleString()})`;
              }

              return (
                <BasicCard
                  key={cls.id}
                  title={
                    <div>
                      <span className="text-sm font-semibold">{cls.className || 'Unnamed Class'}</span>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <FaUser className="text-gray-400" />
                        {cls.teacher || 'Unknown Teacher'}
                      </div>
                    </div>
                  }
                  price={
                    <div className="text-xs font-semibold text-green-600">
                      <div>LKR {displayFee.toLocaleString()}</div>
                      {discountInfo && (
                        <div className="text-xs text-blue-700">{discountInfo}</div>
                      )}
                    </div>
                  }
                  image={getClassImage(cls.subject)}
                  description={
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <FaBook className="text-gray-400" />
                        <strong>Subject:</strong> {cls.subject || 'Unknown Subject'}
                      </div>
                      <div className="flex items-center gap-1">
                        <FaGraduationCap className="text-gray-400" />
                        <strong>Stream:</strong> {cls.stream || 'Unknown Stream'}
                      </div>
                      <div className="flex items-center gap-1">
                        <FaCalendar className="text-gray-400" />
                        <strong>Schedule:</strong> {scheduleText}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={deliveryInfo.color}>{deliveryInfo.icon}</span>
                        <strong>Delivery:</strong> {deliveryInfo.text}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={courseTypeInfo.color}>{courseTypeInfo.icon}</span>
                        <strong>Course Type:</strong> {courseTypeInfo.text}
                      </div>
                      <div className="flex items-center gap-1">
                        <FaUsers className="text-gray-400" />
                        <strong>Students:</strong> {cls.currentStudents || 0}/{cls.maxStudents || 50}
                      </div>
                      {cls.zoomLink && (cls.deliveryMethod === 'online' || cls.deliveryMethod === 'hybrid') && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <FaVideo />
                          <span className="text-xs">Zoom Available</span>
                        </div>
                      )}
                      {(cls.paymentTracking && (cls.paymentTracking.enabled || cls.paymentTracking === true)) && (
                        <div className="flex items-center gap-1 text-green-600">
                          <FaMoneyBill />
                          <span className="text-xs">
                            Payment Tracking 
                            {cls.paymentTracking.enabled && cls.paymentTracking.freeDays && (
                              <span> ({cls.paymentTracking.freeDays} days free)</span>
                            )}
                            {cls.paymentTracking === true && (
                              <span> (7 days free)</span>
                            )}
                          </span>
                        </div>
                      )}
                      {/* Purchase Status */}
                      <div className="flex items-center gap-1 mt-2 p-2 bg-gray-50 rounded">
                        <span className={purchaseStatus.color}>{purchaseStatus.icon}</span>
                        <span className={`text-xs font-semibold ${purchaseStatus.color}`}>
                          {purchaseStatus.text}
                        </span>
                      </div>
                      {cls.description && (
                        <div className="text-xs text-gray-500 mt-2 italic">
                          "{cls.description}"
                        </div>
                      )}
                    </div>
                  }
                  buttonText={purchaseStatus.buttonText}
                  onButtonClick={() => handleButtonAction(cls, purchaseStatus.buttonAction)}
                  buttonClassName={
                    purchaseStatus.status === 'owned' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : purchaseStatus.status === 'discount_available'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-[#1a365d] hover:bg-[#13294b]'
                  }
                />
              );
            } catch (err) {
              console.error('Error rendering class card:', cls, err);
              return null; // Skip this class if there's an error
            }
          })}
        </div>
        
        {filteredClasses.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            {selectedTab === 'all' ? 'No classes available for purchase.' : `No ${selectedTab} classes found.`}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PurchaseClasses; 