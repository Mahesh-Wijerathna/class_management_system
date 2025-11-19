import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BasicCard from '../../../components/BasicCard';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import { getStudentCard, getCardTypeInfo, getCardStatus, isCardValid, calculateFeeWithCard } from '../../../utils/cardUtils';
import { FaCalendar, FaClock, FaMoneyBill, FaUser, FaBook, FaVideo, FaMapMarkerAlt, FaUsers, FaGraduationCap, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaSync, FaTicketAlt } from 'react-icons/fa';
import { getActiveClasses } from '../../../api/classes';
import { getStudentEnrollments, convertEnrollmentToMyClass } from '../../../api/enrollments';
import { getUserData } from '../../../api/apiUtils';
import axios from 'axios';

const PurchaseClasses = ({ onLogout }) => {
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [classes, setClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const navigate = useNavigate();
  // Language (en / si) support - per-file translations and helper
  const [appLang, setAppLang] = useState(localStorage.getItem('appLang') || 'en');

  const translations = {
    en: {
      loadingClasses: 'Loading classes...',
      refresh: 'Refresh',
      refreshing: 'Refreshing...',
      purchasedClassesTitle: 'Purchased Classes',
      availableClassesTitle: 'Available Classes',
      tab_all: 'All Classes',
      tab_purchased: 'Purchased Classes',
      tab_online: 'Online',
      tab_physical: 'Physical',
      tab_hybrid: 'Hybrid',
      tab_theory: 'Theory',
      tab_revision: 'Revision',
      searchPlaceholder_all: 'Search by class name, teacher, subject, or stream...',
      searchPlaceholder_purchased: 'Search your purchased classes...',
      errorLoadingClasses: '⚠️ Error Loading Classes',
      noClassesAvailable: 'No classes available for purchase.',
      noClassesFound: 'No {tab} classes found.',
      zoomAvailable: 'Zoom Available',
      recordedVideoAvailable: 'Recorded Video Available',
      paymentTrackingInfo: 'Payment Tracking',
      studentCardLabel: 'Student Card',
      cardValidPrefix: '✓',
      cardNotValidPrefix: '✗',
      purchase_owned_text: 'Already Purchased',
      purchase_discount_text: 'Discount Available (Theory Student)',
      purchase_available_text: 'Available for Purchase',
  noScheduleText: 'No Schedule',
  scheduleNotSet: 'Schedule not set',
      btn_view: 'View in My Classes',
      btn_buy_with_discount: 'Buy with Discount',
      btn_buy_now: 'Buy Now'
    },
    si: {
      loadingClasses: 'පන්ති පූරණය වෙමින් පවති...',
      refresh: 'නැවත පූරණය කරන්න',
      refreshing: 'පිටු නැවත පූරණය...',
      purchasedClassesTitle: 'මිලදීගත් පන්ති',
      availableClassesTitle: 'ලබාගත හැකි පන්ති',
      tab_all: 'සියලු පන්ති',
      tab_purchased: 'මිලදීගත් පන්ති',
      tab_online: 'ඔන්ලයින්',
      tab_physical: 'භෞතික',
      tab_hybrid: 'සන්‍යෝජිත',
      tab_theory: 'තර්ක',
      tab_revision: 'සංශෝධන',
      searchPlaceholder_all: 'පන්ති නාමය, ගුරුවරයා, විෂය හෝ ප්‍රවාහය අනුව සෙවීම...',
      searchPlaceholder_purchased: 'ඔබ මිලදීගත් පන්ති සෙවීම...',
      errorLoadingClasses: '⚠️ පන්ති උඩුගත කිරීමේ දෝෂයක්',
      noClassesAvailable: 'මිලදී ගැනීමට පන්ති නොමැත.',
      noClassesFound: '{tab} පන්තියන් සොයා ගත නොහැකි විය.',
      zoomAvailable: 'Zoom ලබා ගත හැක',
      recordedVideoAvailable: 'සටහන් වීඩියෝ ලබා ගත හැක',
      paymentTrackingInfo: 'ගෙවීම් නිරීක්ෂණය',
      studentCardLabel: 'ශිෂ්‍ය කාඩ්',
      cardValidPrefix: '✓',
      cardNotValidPrefix: '✗',
      purchase_owned_text: 'දැනටමත් මිලදීගෙන ඇත',
      purchase_discount_text: 'වට්ටම් ඇත (තර්ක ශිෂ්‍යයින් සඳහා)',
      purchase_available_text: 'මිලදී ගැනීමට ලබා ගත හැක',
  noScheduleText: 'කාල සටහන නොමැත',
  scheduleNotSet: 'කාලසටහන සකසා නැත',
      btn_view: 'මගේ පන්ති බලන්න',
      btn_buy_with_discount: 'වට්ටම සමඟ මිලදී ගන්න',
      btn_buy_now: 'දැන් මිලදී ගන්න'
    }
  };

  const t = (key, vars = {}) => {
    const text = (translations[appLang] && translations[appLang][key]) || (translations.en && translations.en[key]) || key;
    return Object.keys(vars).reduce((acc, k) => acc.replace(new RegExp(`\{${k}\}`, 'g'), vars[k]), text);
  };

  useEffect(() => {
    localStorage.setItem('appLang', appLang);
    // allow other tabs to react
    window.dispatchEvent(new CustomEvent('appLangChanged', { detail: appLang }));
  }, [appLang]);

  // Listen for language changes from Navbar or other tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (!e) return;
      if (e.key === 'appLang') setAppLang(e.newValue || 'en');
    };

    const onAppLangChanged = (e) => {
      const newLang = e?.detail || localStorage.getItem('appLang');
      if (newLang) setAppLang(newLang);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('appLangChanged', onAppLangChanged);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('appLangChanged', onAppLangChanged);
    };
  }, []);

  // Helper function to fetch student profile from backend
  const fetchStudentProfile = async (userid) => {
    try {
      const response = await axios.get(`http://localhost:8086/routes.php/get_with_id/${userid}`, {
        timeout: 5000
      });
      if (response.data && !response.data.error) {
        return response.data;
      } else {
        console.error('Error fetching student profile:', response.data);
        return null;
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
      return null;
    }
  };

  // Load classes from backend API
  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getActiveClasses();
      
      if (response.success) {
        // Get student's stream from complete profile data
        const userData = getUserData();
        let studentStream = null;
        
        // Try to get stream from complete profile first
        if (userData?.userid && !studentProfile) {
          const profile = await fetchStudentProfile(userData.userid);
          if (profile) {
            setStudentProfile(profile);
            studentStream = profile.stream;
          }
        } else if (studentProfile) {
          studentStream = studentProfile.stream;
        }
        
        // Fallback to auth data if profile not available
        if (!studentStream) {
          studentStream = userData?.stream;
        }
        
        console.log('Student stream for filtering:', studentStream);
        console.log('Available classes before filtering:', response.data?.length || 0);
        
        // Process classes with student card information and filter by stream
        const currentStudent = JSON.parse(localStorage.getItem('currentStudent') || '{}');
        
        const processedClasses = (response.data || [])
          .filter(cls => {
            // If student has no stream set, show all classes
            if (!studentStream) return true;
            
            // If student has "Other" stream, show only Other stream classes
            if (studentStream === 'Other') {
              return cls.stream === 'Other';
            }
            
            // If student has specific stream, show only classes that match their stream
            // Handle both formats: "A/L-Science" and "AL-Science"
            const classStream = cls.stream || '';
            const normalizedStudentStream = studentStream.replace('/', '');
            const normalizedClassStream = classStream.replace('/', '');
            
            const matches = normalizedClassStream === normalizedStudentStream || classStream === studentStream;
            console.log(`Class: ${cls.className}, Class Stream: ${classStream}, Student Stream: ${studentStream}, Matches: ${matches}`);
            return matches;
          })
          .map(cls => {
          // Get student's card for this class
          const studentCard = getStudentCard(currentStudent.studentId || 'STUDENT_001', cls.id);
          const cardInfo = studentCard ? getCardTypeInfo(studentCard.cardType) : null;
          const cardStatus = studentCard ? getCardStatus(studentCard) : null;
          const cardValidity = studentCard ? isCardValid(studentCard) : null;
          
          // Calculate fee with card discount
          const originalFee = cls.fee || 0;
          const discountedFee = studentCard && cardValidity?.isValid ? 
            calculateFeeWithCard(originalFee, studentCard.cardType) : originalFee;
          
          return {
            ...cls,
            schedule: cls.schedule || { day: '', startTime: '', endTime: '', frequency: 'weekly' },
            fee: originalFee,
            discountedFee: discountedFee,
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
            }),
            // Add card information
            studentCard,
            cardInfo,
            cardStatus,
            cardValidity
          };
        });
        
        console.log('Filtered classes count:', processedClasses.length);
        setClasses(processedClasses);
      } else {
        setError('Failed to load classes from server');
        setClasses([]);
      }
    } catch (err) {
      setError('Failed to load classes. Please check your connection and try again.');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Load student enrollments from database
  const loadEnrollments = async () => {
    try {
      const userData = getUserData();
      if (!userData || !userData.userid) {
        console.error('No logged-in user found');
        setMyClasses([]);
        return;
      }

      const response = await getStudentEnrollments(userData.userid);
      if (response.success) {
        const enrollments = response.data || [];
        const myClassesData = enrollments.map(enrollment => convertEnrollmentToMyClass(enrollment));
        setMyClasses(myClassesData);
      } else {
        console.error('Failed to load enrollments:', response.message);
        setMyClasses([]);
      }
    } catch (err) {
      console.error('Error loading enrollments:', err);
      setMyClasses([]);
    }
  };

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
    loadEnrollments();

    // Listen for payment completion events
    const handlePaymentComplete = () => {
      console.log('Payment completed, refreshing enrollments...');
      loadEnrollments();
    };

    window.addEventListener('refreshMyClasses', handlePaymentComplete);

    // Cleanup event listener
    return () => {
      window.removeEventListener('refreshMyClasses', handlePaymentComplete);
    };
  }, []);

  // Refresh classes
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadClasses(), loadEnrollments()]);
    setRefreshing(false);
  };

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
      const isPurchased = checkStudentOwnership(cls.id);
      
      // For purchased tab, only show purchased classes
      if (selectedTab === 'purchased') {
        const searchTerm = search.toLowerCase();
        const matchesSearch = 
          (cls.className || '').toLowerCase().includes(searchTerm) ||
          (cls.teacher || '').toLowerCase().includes(searchTerm) ||
          (cls.subject || '').toLowerCase().includes(searchTerm) ||
          (cls.stream || '').toLowerCase().includes(searchTerm);
        
        return isPurchased && matchesSearch;
      }
      
      // For all other tabs, exclude purchased classes
      const matchesTab = selectedTab === 'all' || 
                        (selectedTab === 'online' && cls.deliveryMethod === 'online') ||
                        (selectedTab === 'physical' && cls.deliveryMethod === 'physical') ||
                        (selectedTab === 'hybrid' && (cls.deliveryMethod === 'hybrid' || cls.deliveryMethod === 'hybrid1' || cls.deliveryMethod === 'hybrid2' || cls.deliveryMethod === 'hybrid3' || cls.deliveryMethod === 'hybrid4')) ||
                        (selectedTab === 'theory' && cls.courseType === 'theory') ||
                        (selectedTab === 'revision' && cls.courseType === 'revision');
      
      // Exclude purchased classes from all other tabs
      if (isPurchased) {
        return false;
      }
      
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
        return { color: 'text-purple-600', icon: <FaVideo />, text: 'Online Only' };
      case 'physical':
        return { color: 'text-orange-600', icon: <FaMapMarkerAlt />, text: 'Physical Only' };
      case 'hybrid1':
        return { color: 'text-indigo-600', icon: <FaUsers />, text: 'Hybrid (Physical + Online)' };
      case 'hybrid2':
        return { color: 'text-green-600', icon: <FaVideo />, text: 'Hybrid (Physical + Recorded)' };
      case 'hybrid3':
        return { color: 'text-blue-600', icon: <FaVideo />, text: 'Hybrid (Online + Recorded)' };
      case 'hybrid4':
        return { color: 'text-teal-600', icon: <FaUsers />, text: 'Hybrid (Physical + Online + Recorded)' };
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
    { key: 'purchased', label: 'Purchased Classes' },
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
        <div className="p-2 sm:p-4 lg:p-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-500 text-sm sm:text-base">{t('loadingClasses')}</div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
        <div className="p-2 sm:p-4 lg:p-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="text-red-500 text-sm sm:text-base mb-2">{t('errorLoadingClasses')}</div>
              <div className="text-gray-600 text-xs sm:text-sm">{error}</div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userRole="Student"
      sidebarItems={studentSidebarSections}
      onLogout={onLogout}
    >
      <div className="p-2 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            {selectedTab === 'purchased' ? t('purchasedClassesTitle') : t('availableClassesTitle')}
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
          >
            <FaSync className={`${refreshing ? 'animate-spin' : ''} h-4 w-4`} />
            <span className="hidden sm:inline">{refreshing ? t('refreshing') : t('refresh')}</span>
            <span className="sm:hidden">{refreshing ? '...' : '↻'}</span>
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center gap-1 sm:gap-2 mb-4 sm:mb-6 flex-wrap">
          {tabOptions.map(tab => (
            <button
              key={tab.key}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-150 border-2
                ${selectedTab === tab.key
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                  : 'bg-white text-cyan-700 border-cyan-200 hover:bg-cyan-50'}
              `}
              onClick={() => setSelectedTab(tab.key)}
            >
              {t('tab_' + tab.key) || tab.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-4 sm:mb-6">
          <input
            type="text"
            placeholder={selectedTab === 'purchased' ? t('searchPlaceholder_purchased') : t('searchPlaceholder_all')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2 w-full max-w-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {filteredClasses.map((cls) => {
            try {
              const deliveryInfo = getDeliveryMethodInfo(cls.deliveryMethod);
              const courseTypeInfo = getCourseTypeInfo(cls.courseType);
              const purchaseStatus = getPurchaseStatus(cls);
              const scheduleText = cls.schedule && cls.schedule.frequency === 'no-schedule' ? 
                t('noScheduleText') :
                cls.schedule && cls.schedule.day && cls.schedule.startTime && cls.schedule.endTime ?
                `${formatDay(cls.schedule.day)} ${formatTime(cls.schedule.startTime)}-${formatTime(cls.schedule.endTime)}` : 
                t('scheduleNotSet') || 'Schedule not set';

              // Calculate fee with discount for revision classes
              let displayFee = Number(cls.fee) || 0;
              let discountInfo = null;
              let finalFee = displayFee;
              
              if (cls.courseType === 'revision' && cls.revisionDiscountPrice && checkRelatedTheoryOwnership(cls)) {
                const discount = Number(cls.revisionDiscountPrice) || 0;
                finalFee = Math.max(0, displayFee - discount);
                discountInfo = `(Theory student: Rs. ${finalFee.toLocaleString()})`;
              }
              
              // Apply card discount if available
              if (cls.studentCard && cls.cardValidity && cls.cardValidity.isValid) {
                finalFee = cls.discountedFee;
                if (cls.discountedFee < cls.fee) {
                  discountInfo = `(Card discount: Rs. ${finalFee.toLocaleString()})`;
                }
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
                      {cls.zoomLink && (cls.deliveryMethod === 'online' || cls.deliveryMethod === 'hybrid1' || cls.deliveryMethod === 'hybrid3' || cls.deliveryMethod === 'hybrid4') && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <FaVideo />
                          <span className="text-xs">{t('zoomAvailable')}</span>
                        </div>
                      )}
                      {cls.videoUrl && (cls.deliveryMethod === 'hybrid2' || cls.deliveryMethod === 'hybrid3' || cls.deliveryMethod === 'hybrid4') && (
                        <div className="flex items-center gap-1 text-green-600">
                          <FaVideo />
                          <span className="text-xs">{t('recordedVideoAvailable')}</span>
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
                      
                      {/* Student Card Information */}
                      {cls.studentCard && cls.cardInfo && cls.cardStatus && (
                        <div className="mt-2 p-2 rounded border">
                          <div className="flex items-center gap-2 mb-1">
                            <FaTicketAlt className="text-blue-500" />
                            <span className="text-xs font-semibold">{t('studentCardLabel')}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls.cardInfo.color}`}>
                              {cls.cardInfo.label}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls.cardStatus.color}`}>
                              {cls.cardStatus.label}
                            </span>
                          </div>
                          {cls.cardValidity && cls.cardValidity.isValid ? (
                            <div className="text-xs text-green-600">
                              {t('cardValidPrefix')} {cls.cardValidity.reason}
                            </div>
                          ) : (
                            <div className="text-xs text-red-600">
                              {t('cardNotValidPrefix')} {cls.cardValidity?.reason || 'Card not valid'}
                            </div>
                          )}
                          {cls.studentCard.reason && (
                            <div className="text-xs text-gray-600 mt-1">
                              <strong>Reason:</strong> {cls.studentCard.reason}
                            </div>
                          )}
                          <div className="text-xs text-gray-600">
                            <strong>Valid:</strong> {new Date(cls.studentCard.validFrom).toLocaleDateString()} - {new Date(cls.studentCard.validUntil).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      
                      {/* Purchase Status */}
                      <div className="flex items-center gap-1 mt-2 p-2 bg-gray-50 rounded">
                        <span className={purchaseStatus.color}>{purchaseStatus.icon}</span>
                        <span className={`text-xs font-semibold ${purchaseStatus.color}`}>
                          {purchaseStatus.status === 'owned' ? t('purchase_owned_text') : purchaseStatus.status === 'discount_available' ? t('purchase_discount_text') : t('purchase_available_text')}
                        </span>
                      </div>
                      {cls.description && (
                        <div className="text-xs text-gray-500 mt-2 italic">
                          "{cls.description}"
                        </div>
                      )}
                    </div>
                  }
                  buttonText={purchaseStatus.status === 'owned' ? t('btn_view') : purchaseStatus.status === 'discount_available' ? t('btn_buy_with_discount') : t('btn_buy_now')}
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
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-4">📚</div>
              <div className="text-gray-500 text-sm sm:text-base">
                {selectedTab === 'all' ? 'No classes available for purchase.' : `No ${selectedTab} classes found.`}
              </div>
              <div className="text-gray-400 text-xs mt-2">
                Try changing your search terms or selecting a different tab.
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PurchaseClasses; 