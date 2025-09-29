import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BasicCard from '../../../components/BasicCard';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import SecureZoomMeeting from '../../../components/SecureZoomMeeting';
import { getStudentCard, getCardTypeInfo, getCardStatus, isCardValid } from '../../../utils/cardUtils';
import { getStudentEnrollments, markAttendance, requestForgetCard, requestLatePayment, convertEnrollmentToMyClass, getPaymentHistoryForClass } from '../../../api/enrollments';
import { getUserData } from '../../../api/apiUtils';
import { FaCalendar, FaClock, FaMoneyBill, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaEye, FaCreditCard, FaMapMarkerAlt, FaVideo, FaUsers, FaFileAlt, FaDownload, FaPlay, FaHistory, FaQrcode, FaBarcode, FaBell, FaBook, FaGraduationCap, FaUserClock, FaExclamationCircle, FaInfoCircle, FaStar, FaCalendarAlt, FaUserGraduate, FaChartLine, FaShieldAlt, FaSearch, FaCog, FaSync, FaTicketAlt, FaCalendarWeek, FaTasks, FaFilePdf, FaFileWord, FaFilePowerpoint, FaUpload, FaRedo, FaPauseCircle } from 'react-icons/fa';




const MyClasses = ({ onLogout }) => {
  const [myClasses, setMyClasses] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('status');
  const [selectedClassForDetails, setSelectedClassForDetails] = useState(null);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [forgetCardRequest, setForgetCardRequest] = useState('');
  const [latePaymentRequest, setLatePaymentRequest] = useState('');
  const [showForgetCardModal, setShowForgetCardModal] = useState(false);
  const [showLatePaymentModal, setShowLatePaymentModal] = useState(false);
  const [selectedClassForRequest, setSelectedClassForRequest] = useState(null);
  const [showSecureZoomModal, setShowSecureZoomModal] = useState(false);
  const [selectedClassForZoom, setSelectedClassForZoom] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedClassForVideo, setSelectedClassForVideo] = useState(null);
  const [videoTimeRemaining, setVideoTimeRemaining] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsActiveTab, setDetailsActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  


  useEffect(() => {
  loadMyClasses();
  createEnrollmentRecords();
}, []);

  // Timer effect for video access
  useEffect(() => {
    if (showVideoModal && selectedClassForVideo) {
      const timer = setInterval(() => {
        if (!isClassCurrentlyScheduled(selectedClassForVideo)) {
          // Class time has ended, close video
          setShowVideoModal(false);
          setSelectedClassForVideo(null);
          setVideoTimeRemaining(null);
          alert('Class time has ended. Video access has been closed.');
        } else {
          // Update remaining time
          const now = new Date();
          const [endHours, endMinutes] = selectedClassForVideo.schedule.endTime.split(':').map(Number);
          const classEndTime = new Date();
          classEndTime.setHours(endHours, endMinutes, 0, 0);
          const remaining = Math.max(0, Math.floor((classEndTime - now) / (1000 * 60)));
          setVideoTimeRemaining(remaining);
        }
      }, 1000); // Check every second

      return () => clearInterval(timer);
    }
  }, [showVideoModal, selectedClassForVideo]);

const loadMyClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get logged-in user data
      const userData = getUserData();
      if (!userData || !userData.userid) {
        setError('No logged-in user found. Please login again.');
        setMyClasses([]);
        return;
      }
      
      const studentId = userData.userid;
      
      // Get student's stream from user data
      const studentStream = userData.stream;
      
      // Fetch enrollments from backend API
      const response = await getStudentEnrollments(studentId);
      
      if (response.success && response.data) {

        // Convert enrollments to MyClasses format and filter by stream
        const convertedClasses = response.data
          .filter(enrollment => {
            // If student has no stream set, show all classes
            if (!studentStream) return true;
            
            // If student has "Other" stream, show only Other stream classes
            if (studentStream === 'Other') {
              return enrollment.stream === 'Other';
            }
            
            // If student has specific stream, show only classes that match their stream
            return enrollment.stream === studentStream;
          })
          .map(enrollment => {
          const myClass = convertEnrollmentToMyClass(enrollment);
          
          // Get student's card for this class
          const studentCard = getStudentCard(studentId, myClass.id);
          const cardInfo = studentCard ? getCardTypeInfo(studentCard.cardType) : null;
          const cardStatus = getCardStatus(studentCard);
          const cardValidity = isCardValid(studentCard);
          
            // Add card information
          myClass.studentCard = studentCard;
          myClass.cardInfo = cardInfo;
          myClass.cardStatus = cardStatus;
          myClass.cardValidity = cardValidity;
          
          // Add missing fields with defaults
          myClass.schedule = myClass.schedule || { day: '', startTime: '', endTime: '', frequency: 'weekly' };
          myClass.fee = myClass.fee || 0;
          myClass.maxStudents = myClass.maxStudents || 50;
          // Don't override status - let it come from the enrollment data
          // myClass.status = myClass.status || 'active';
          myClass.currentStudents = myClass.currentStudents || 0;
          myClass.className = myClass.className || 'Unnamed Class';
          myClass.subject = myClass.subject || 'Unknown Subject';
          myClass.teacher = myClass.teacher || 'Unknown Teacher';
          myClass.stream = myClass.stream || 'Unknown Stream';
          myClass.deliveryMethod = myClass.deliveryMethod || 'online';
          myClass.courseType = myClass.courseType || 'theory';
          myClass.paymentStatus = myClass.paymentStatus || 'pending';

          // Use actual payment tracking data from database (already set by convertEnrollmentToMyClass)
          // The paymentTracking object is now properly populated from the database
          // No need to override it here

          myClass.attendance = myClass.attendance || [];
          myClass.paymentHistory = myClass.paymentHistory || [];
          
          return myClass;
        });
        
        
        setMyClasses(convertedClasses);
      } else {
        setError(response.message || 'Failed to load classes from server');
        setMyClasses([]);
      }
    } catch (err) {
      setError('Failed to load classes. Please refresh the page.');
      setMyClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Create enrollment records for each class (now handled by backend)
  const createEnrollmentRecords = async () => {
    try {
      // Get logged-in user data
      const userData = getUserData();
      if (!userData || !userData.userid) {
        return;
      }
      
      const studentId = userData.userid;
      
      // Get existing enrollments from backend
      const response = await getStudentEnrollments(studentId);
      
      if (response.success && response.data) {
        // Enrollments are already created in backend when payment is processed
        // This function is kept for backward compatibility but doesn't need to do anything
        return;
      }
    } catch (err) {
      // Silent fail - enrollments are created automatically during payment
    }
  };

  // Listen for payment updates
  useEffect(() => {
    const handlePaymentUpdate = () => {
      console.log('🔄 MyClasses: Received refreshMyClasses event');
      loadMyClasses();
    };

    const handlePaymentCompleted = (event) => {
      console.log('🔄 MyClasses: Received paymentCompleted event', event.detail);
      loadMyClasses();
    };

    const handleStorageChange = () => {
      console.log('🔄 MyClasses: Received storage change event');
      loadMyClasses();
    };

    window.addEventListener('refreshMyClasses', handlePaymentUpdate);
    window.addEventListener('paymentCompleted', handlePaymentCompleted);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('refreshMyClasses', handlePaymentUpdate);
      window.removeEventListener('paymentCompleted', handlePaymentCompleted);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showDetailsModal) {
        setShowDetailsModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDetailsModal]);

  // Payment Tracking Utility Functions
  const getPaymentTrackingStatus = (cls) => {
    // Check if payment tracking is enabled for this class
    const hasPaymentTracking = cls.paymentTracking || cls.paymentTracking === true || cls.paymentTracking?.enabled;
    
    // Both enabled and disabled payment tracking have monthly payments, but different grace periods
    const today = new Date(); // Use current date
    
    // If payment status is 'paid' but no payment history, create a basic payment record
    if (cls.paymentStatus === 'paid' && (!cls.paymentHistory || cls.paymentHistory.length === 0)) {
      // Get free days from class configuration
      const freeDays = cls.paymentTrackingFreeDays || 7;
      
      // INDUSTRY STANDARD: Next payment is always 1st of next month, regardless of when class was purchased
      // This ensures consistent billing cycles and proper grace period calculation
      const nextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      
      if (hasPaymentTracking) {
        // Payment tracking enabled: has grace period
        const gracePeriodEndDate = new Date(nextPaymentDate);
        gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + freeDays);
        
        if (today <= gracePeriodEndDate) {
          const daysRemaining = Math.ceil((gracePeriodEndDate - today) / (1000 * 60 * 60 * 24));
          return { 
            canAccess: true, 
            status: 'paid', 
            message: `Payment completed (${daysRemaining} days remaining in grace period)`,
            daysRemaining: daysRemaining,
            nextPaymentDate: nextPaymentDate,
            gracePeriodEndDate: gracePeriodEndDate,
            freeDays: freeDays,
            paymentTrackingEnabled: true
          };
        }
      } else {
        // Payment tracking disabled: no grace period, payment due immediately on next payment date
        if (today < nextPaymentDate) {
          const daysRemaining = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));
          return { 
            canAccess: true, 
            status: 'paid', 
            message: `Payment completed (${daysRemaining} days until next payment)`,
            daysRemaining: daysRemaining,
            nextPaymentDate: nextPaymentDate,
            gracePeriodEndDate: nextPaymentDate,
            freeDays: 0,
            paymentTrackingEnabled: false
          };
        }
      }
    }
    
    // Check if there's a payment history
    if (!cls.paymentHistory || cls.paymentHistory.length === 0) {
      return { 
        canAccess: false, 
        status: 'no-payment', 
        message: 'No payment history - payment required',
        paymentTrackingEnabled: hasPaymentTracking
      };
    }

    // Get the latest payment
    const latestPayment = cls.paymentHistory[cls.paymentHistory.length - 1];
    const paymentDate = new Date(latestPayment.date);
    
    // Check if payment tracking is enabled in the payment record
    const paymentTrackingEnabled = latestPayment.paymentTrackingEnabled !== undefined ? latestPayment.paymentTrackingEnabled : hasPaymentTracking;
    
    // Get free days from payment history or class configuration
    const freeDays = latestPayment.freeDays || cls.paymentTrackingFreeDays || 7;
    
    // Use next payment date from payment history or calculate it
    let nextPaymentDate;
    if (latestPayment.nextPaymentDate) {
      nextPaymentDate = new Date(latestPayment.nextPaymentDate);
    } else {
      // INDUSTRY STANDARD: Next payment is always 1st of next month, regardless of payment date
      // This ensures consistent billing cycles and proper grace period calculation
      nextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    }
    
    // Calculate grace period end date based on payment tracking setting
    let gracePeriodEndDate;
    if (paymentTrackingEnabled) {
      // Payment tracking enabled: next payment date + free days
      gracePeriodEndDate = new Date(nextPaymentDate);
      gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + freeDays);
    } else {
      // Payment tracking disabled: no grace period (payment due immediately on next payment date)
      gracePeriodEndDate = new Date(nextPaymentDate);
    }
    
    // Check if today is within the grace period
    if (today <= gracePeriodEndDate) {
      const daysRemaining = Math.ceil((gracePeriodEndDate - today) / (1000 * 60 * 60 * 24));
      const nextPaymentDay = nextPaymentDate.getDate();
      const nextPaymentMonth = nextPaymentDate.toLocaleDateString('en-US', { month: 'long' });
      
      if (paymentTrackingEnabled) {
      return { 
        canAccess: true, 
        status: 'paid', 
          message: `Payment completed (${daysRemaining} days remaining in grace period)`,
        daysRemaining: daysRemaining,
        nextPaymentDate: nextPaymentDate,
          gracePeriodEndDate: gracePeriodEndDate,
          freeDays: freeDays,
          paymentTrackingEnabled: true
        };
      } else {
        return { 
          canAccess: true, 
          status: 'paid', 
          message: `Payment completed (${daysRemaining} days until next payment)`,
          daysRemaining: daysRemaining,
          nextPaymentDate: nextPaymentDate,
          gracePeriodEndDate: gracePeriodEndDate,
          freeDays: 0,
          paymentTrackingEnabled: false
        };
      }
    }

    // If we're past the grace period, payment is required
    return { 
      canAccess: false, 
      status: 'payment-required', 
      message: 'Payment required - grace period expired',
      paymentTrackingEnabled: paymentTrackingEnabled
    };
  };

  const getPaymentTrackingInfo = (cls) => {
    const trackingStatus = getPaymentTrackingStatus(cls);
    const freeDays = trackingStatus.freeDays || cls.paymentTrackingFreeDays || 7;
    const today = new Date(); // Use current date
    const currentDay = today.getDate();
    
    // If payment tracking is disabled, return simplified info
    if (!trackingStatus.paymentTrackingEnabled) {
      return {
        ...trackingStatus,
        freeDays: 0,
        currentDay,
        isFreePeriod: true,
        daysRemaining: 0,
        nextPaymentDate: null,
        lastPaymentDate: cls.paymentHistory && cls.paymentHistory.length > 0 
          ? new Date(cls.paymentHistory[cls.paymentHistory.length - 1].date) 
          : null,
        testDate: null
      };
    }
    
    return {
      ...trackingStatus,
      freeDays,
      currentDay,
      isFreePeriod: currentDay <= freeDays,
      daysRemaining: Math.max(0, freeDays - currentDay + 1),
      nextPaymentDate: cls.nextPaymentDate ? new Date(cls.nextPaymentDate) : trackingStatus.nextPaymentDate,
      lastPaymentDate: cls.paymentHistory && cls.paymentHistory.length > 0 
        ? new Date(cls.paymentHistory[cls.paymentHistory.length - 1].date) 
        : null,
      testDate: null
    };
  };

  // Debug function to log payment tracking info
  const debugPaymentTracking = (cls) => {
    console.log('=== PAYMENT TRACKING DEBUG ===');
    console.log('Class:', cls.className);
    console.log('Payment Status:', cls.paymentStatus);
    console.log('Next Payment Date:', cls.nextPaymentDate);
    console.log('Payment History:', cls.paymentHistory);
    console.log('Payment Tracking:', cls.paymentTracking);
    
    const result = getPaymentTrackingStatus(cls);
    console.log('Result:', result);
    
    // Test grace period logic
    const today = new Date();
    const currentDay = today.getDate();
    const freeDays = cls.paymentTrackingFreeDays || 7;
    const isFreePeriod = currentDay <= freeDays;
    
    console.log('=== GRACE PERIOD TEST ===');
    console.log('Current Date:', today.toDateString());
    console.log('Current Day of Month:', currentDay);
    console.log('Free Days:', freeDays);
    console.log('Is Free Period:', isFreePeriod);
    console.log('Grace Period Logic:', `Day ${currentDay} <= ${freeDays} = ${isFreePeriod}`);
  };

  // Test function to simulate different dates for payment tracking
  const testPaymentTrackingWithDate = (cls, testDate) => {
    const hasPaymentTracking = cls.paymentTracking || cls.paymentTracking === true || cls.paymentTracking?.enabled;
    
    if (!hasPaymentTracking) {
      return { canAccess: true, status: 'no-tracking', message: 'No payment tracking enabled' };
    }

    const freeDays = cls.paymentTracking?.freeDays || 7;
    const currentDay = testDate.getDate();
    
    // Check if within free days period (first 7 days of the month)
    if (currentDay <= freeDays) {
      return { 
        canAccess: true, 
        status: 'free-period', 
        message: `Free access (${freeDays - currentDay + 1} days remaining) - TEST DATE: ${testDate.toDateString()}`,
        daysRemaining: freeDays - currentDay + 1,
        testDate: testDate.toDateString()
      };
    }

    // Check payment status
    if (cls.paymentStatus === 'paid') {
      return { canAccess: true, status: 'paid', message: 'Payment completed' };
    }

    if (cls.paymentStatus === 'pending') {
      return { canAccess: false, status: 'pending', message: 'Payment pending - access restricted' };
    }

    if (cls.paymentStatus === 'overdue') {
      return { canAccess: false, status: 'overdue', message: 'Payment overdue - access restricted' };
    }

    return { canAccess: false, status: 'unpaid', message: 'Payment required - access restricted' };
  };



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
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  };

  const getTimeUntilClass = (cls) => {
    if (!cls.schedule || !cls.schedule.startTime) return null;
    
    const now = new Date();
    const [hours, minutes] = cls.schedule.startTime.split(':').map(Number);
    const classStartTime = new Date();
    classStartTime.setHours(hours, minutes, 0, 0);
    
    const timeDiff = (classStartTime - now) / (1000 * 60); // minutes
    
    if (timeDiff < -15) return null; // Class already started more than 15 minutes ago
    if (timeDiff > 15) return null; // Class starts more than 15 minutes from now
    
    if (timeDiff < 0) {
      return `Started ${Math.abs(Math.round(timeDiff))} minutes ago`;
    } else if (timeDiff === 0) {
      return 'Starting now';
    } else {
      return `Starts in ${Math.round(timeDiff)} minutes`;
    }
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
      case 'suspended':
        return { color: 'text-orange-600', icon: <FaPauseCircle />, text: 'Suspended', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
      case 'completed':
        return { color: 'text-blue-600', icon: <FaGraduationCap />, text: 'Completed', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
      case 'dropped':
        return { color: 'text-red-600', icon: <FaTimesCircle />, text: 'Dropped', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
      default:
        return { color: 'text-gray-600', icon: <FaClock />, text: 'Unknown', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    }
  };

  // Get class priority/urgency for display
  const getClassPriority = (cls) => {
    // If class is inactive, it should be high priority
    if (cls.deliveryMethod === 'online' || cls.deliveryMethod === 'hybrid1' || cls.deliveryMethod === 'hybrid3' || cls.deliveryMethod === 'hybrid4') return { priority: 'high', text: 'Online', color: 'text-red-600', bgColor: 'bg-red-50' };
    
    const nextPayment = new Date(cls.nextPaymentDate);
    const today = new Date();
    const daysUntilPayment = Math.ceil((nextPayment - today) / (1000 * 60 * 60 * 24));
    
    if (cls.paymentStatus === 'overdue') return { priority: 'high', text: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (cls.paymentStatus === 'pending' && daysUntilPayment <= 3) return { priority: 'medium', text: 'Due Soon', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    if (cls.paymentStatus === 'paid') return { priority: 'low', text: 'Active', color: 'text-green-600', bgColor: 'bg-green-50' };
    return { priority: 'normal', text: 'Normal', color: 'text-gray-600', bgColor: 'bg-gray-50' };
  };

  // Get numeric priority for sorting
  const getClassPriorityValue = (cls) => {
    const priority = getClassPriority(cls);
    switch (priority.priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  // Debug function to log sorting information
  const debugSorting = (classes, sortBy) => {
    console.log(`🔍 Sorting ${classes.length} classes by: ${sortBy}`);
    classes.slice(0, 3).forEach((cls, index) => {
      console.log(`  ${index + 1}. ${cls.className} - Priority: ${getClassPriorityValue(cls)}, Status: ${cls.paymentStatus}, Due: ${cls.nextPaymentDate}`);
    });
  };

  // Debug function to log live tab filtering
  const debugLiveTabFiltering = () => {
    console.log('🔍 DEBUG: Live Tab Filtering');
    console.log('Total classes:', myClasses.length);
    console.log('Current time:', new Date().toLocaleString());
    
    const now = new Date();
    const today = now.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today];
    
    console.log(`Today is: ${todayName}`);
    console.log('---');
    
    myClasses.forEach((cls, index) => {
      const hasSchedule = cls.schedule && cls.schedule.frequency !== 'no-schedule';
      const hasOnlineDelivery = ['online', 'hybrid1', 'hybrid3', 'hybrid4'].includes(cls.deliveryMethod);
      const hasDayAndTime = cls.schedule && cls.schedule.day && cls.schedule.startTime;
      
      const isToday = cls.schedule && cls.schedule.day === todayName;
      
      const [hours, minutes] = cls.schedule?.startTime?.split(':').map(Number) || [0, 0];
      const classStartTime = new Date();
      classStartTime.setHours(hours, minutes, 0, 0);
      const timeDiff = (classStartTime - now) / (1000 * 60);
      const isWithinTimeWindow = timeDiff >= -30 && timeDiff <= 30;
      
      const wouldShowInLiveTab = hasSchedule && hasOnlineDelivery && hasDayAndTime && isToday && isWithinTimeWindow;
      
      console.log(`  ${index + 1}. ${cls.className}:`);
      console.log(`     - Delivery Method: ${cls.deliveryMethod} (supports online: ${hasOnlineDelivery})`);
      console.log(`     - Has Schedule: ${hasSchedule} (frequency: ${cls.schedule?.frequency})`);
      console.log(`     - Has Day & Time: ${hasDayAndTime} (${cls.schedule?.day} ${cls.schedule?.startTime})`);
      console.log(`     - Is Today: ${isToday} (${cls.schedule?.day} vs ${todayName})`);
      console.log(`     - Time Diff: ${timeDiff.toFixed(1)} minutes (within window: ${isWithinTimeWindow})`);
      console.log(`     - Would Show in Live Tab: ${wouldShowInLiveTab}`);
      
      if (!wouldShowInLiveTab) {
        console.log(`     - REASON: ${!hasSchedule ? 'No schedule' : !hasOnlineDelivery ? 'Not online delivery' : !hasDayAndTime ? 'No day/time' : !isToday ? 'Not today' : !isWithinTimeWindow ? 'Outside time window' : 'Unknown'}`);
      }
      console.log('');
    });
    
    // Show summary
    const liveClasses = myClasses.filter(cls => {
      if (!cls.schedule || cls.schedule.frequency === 'no-schedule') return false;
      if (!['online', 'hybrid1', 'hybrid3', 'hybrid4'].includes(cls.deliveryMethod)) return false;
      if (!cls.schedule.day || !cls.schedule.startTime) return false;
      
      const isToday = cls.schedule.day === todayName;
      if (!isToday) return false;
      
      const [hours, minutes] = cls.schedule.startTime.split(':').map(Number);
      const classStartTime = new Date();
      classStartTime.setHours(hours, minutes, 0, 0);
      const timeDiff = (classStartTime - now) / (1000 * 60);
      
      return timeDiff >= -30 && timeDiff <= 30;
    });
    
    console.log(`📊 SUMMARY: ${liveClasses.length} classes would show in Live Tab`);
    liveClasses.forEach((cls, index) => {
      console.log(`  ${index + 1}. ${cls.className} (${cls.deliveryMethod}) - ${cls.schedule.day} ${cls.schedule.startTime}`);
    });
  };

  // Filter and sort classes
  const filteredAndSortedClasses = myClasses
        .filter(cls => {
      // Tab filtering
    if (selectedTab === 'all') return true;
    if (selectedTab === 'live') {
      if (!cls.schedule || cls.schedule.frequency === 'no-schedule') return false;
      // Check if delivery method supports online classes
      if (!['online', 'hybrid1', 'hybrid3', 'hybrid4'].includes(cls.deliveryMethod)) return false;
      if (!cls.schedule.day || !cls.schedule.startTime) return false;
      
      // Check if class is starting within 15 minutes
      const now = new Date();
      const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[today];
      
      // Only show classes scheduled for today
      if (cls.schedule.day !== todayName) return false;
      
      // Parse class start time
      const [hours, minutes] = cls.schedule.startTime.split(':').map(Number);
      const classStartTime = new Date();
      classStartTime.setHours(hours, minutes, 0, 0);
      
      // Calculate time difference in minutes
      const timeDiff = (classStartTime - now) / (1000 * 60);
      
      // Show if class starts within 30 minutes before or is currently running (within 30 minutes of start)
      return timeDiff >= -30 && timeDiff <= 30;
    }
    if (selectedTab === 'today') {
      if (!cls.schedule || cls.schedule.frequency === 'no-schedule') return false;
      const today = new Date();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[today.getDay()];
      return cls.schedule.day === todayName;
    }
    if (selectedTab === 'tomorrow') {
      if (!cls.schedule || cls.schedule.frequency === 'no-schedule') return false;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const tomorrowName = dayNames[tomorrow.getDay()];
      return cls.schedule.day === tomorrowName;
    }
    if (selectedTab === 'this-week') {
      if (!cls.schedule || cls.schedule.frequency === 'no-schedule') return false;
      const today = new Date();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[today.getDay()];
      return cls.schedule.day === todayName || cls.schedule.frequency === 'weekly';
    }
    if (selectedTab === 'this-month') {
      if (!cls.schedule || cls.schedule.frequency === 'no-schedule') return false;
      return cls.schedule.frequency === 'weekly' || cls.schedule.frequency === 'bi-weekly' || cls.schedule.frequency === 'monthly';
    }
    if (selectedTab === 'no-schedule') {
      return cls.schedule && cls.schedule.frequency === 'no-schedule';
    }
    if (selectedTab === 'payment-due') {
      // Check if payment is due from month start to paid day
      if (!cls.nextPaymentDate) return false;
      
      const nextPayment = new Date(cls.nextPaymentDate);
      const today = new Date();
      
      // Check if payment is overdue
      if (nextPayment <= today && cls.paymentStatus !== 'paid') return true;
      
      // Check if it's a monthly payment and we're in the payment period
      if (cls.paymentTracking && (cls.paymentTracking.enabled || cls.paymentTracking === true)) {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const paymentDay = new Date(cls.nextPaymentDate);
        
        // If we're between month start and payment day, and payment status is not paid
        if (today >= monthStart && today <= paymentDay && cls.paymentStatus !== 'paid') {
          return true;
        }
      }
      
      return false;
    }
    return false;
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
      switch (sortBy) {
        case 'name':
          const nameA = a.className || '';
          const nameB = b.className || '';
          return nameA.localeCompare(nameB);
        case 'purchased-date':
          // Sort by enrollment date (assuming we have this data)
          const dateA = a.enrollmentDate ? new Date(a.enrollmentDate) : new Date(0);
          const dateB = b.enrollmentDate ? new Date(b.enrollmentDate) : new Date(0);
          // Handle invalid dates
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          return dateB - dateA; // Most recent first
        case 'payment-due':
          // Sort by payment due date
          const dueA = a.nextPaymentDate ? new Date(a.nextPaymentDate) : new Date(9999, 11, 31);
          const dueB = b.nextPaymentDate ? new Date(b.nextPaymentDate) : new Date(9999, 11, 31);
          // Handle invalid dates
          if (isNaN(dueA.getTime()) && isNaN(dueB.getTime())) return 0;
          if (isNaN(dueA.getTime())) return 1;
          if (isNaN(dueB.getTime())) return -1;
          return dueA - dueB; // Earliest due date first
        case 'status':
        default:
          return getClassPriorityValue(b) - getClassPriorityValue(a);
      }
  });

  // Debug sorting results
  if (filteredAndSortedClasses.length > 0) {
    debugSorting(filteredAndSortedClasses, sortBy);
  }

  // Handle make payment
  const handleMakePayment = (cls) => {
    const paymentTrackingInfo = getPaymentTrackingInfo(cls);
    const gracePeriodExpired = !paymentTrackingInfo.canAccess;
    
    navigate(`/student/checkout/${cls.id}`, { 
      state: { 
        type: 'renewal',
        gracePeriodExpired: gracePeriodExpired,
        daysRemaining: paymentTrackingInfo.daysRemaining || 0
      } 
    });
  };

  // Handle view details - modern modal approach
  const handleViewDetails = async (cls) => {
    // Check enrollment status first
    if (cls.status === 'suspended') {
      alert('Access to this class has been suspended. Please contact the administrator for more information.');
      return;
    }
    
    if (cls.status === 'dropped') {
      alert('You have dropped this course. No access is available.');
      return;
    }
    
    // Check payment tracking and grace period
    const paymentTrackingInfo = getPaymentTrackingInfo(cls);
    if (!paymentTrackingInfo.canAccess) {
      if (paymentTrackingInfo.status === 'payment-required') {
        alert('Payment required - grace period has expired. Please make payment to restore access to this class.');
      } else if (paymentTrackingInfo.status === 'no-payment') {
        alert('No payment history found. Please make payment to access this class.');
      } else {
        alert('Access restricted due to payment issues. Please contact the administrator.');
      }
      return;
    }
    
    // Fetch payment history for this class
    try {
      const userData = getUserData();
      const paymentHistory = await getPaymentHistoryForClass(userData.userid, cls.id);
      
      // Update the class with payment history
      const updatedClass = {
        ...cls,
        paymentHistory: paymentHistory
      };
      
      setSelectedClassForDetails(updatedClass);
      setDetailsActiveTab('overview');
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      // Still show the class details even if payment history fails to load
    setSelectedClassForDetails(cls);
    setDetailsActiveTab('overview');
    setShowDetailsModal(true);
    }
  };

  // Handle join class
  const handleJoinClass = (cls) => {
    // Check enrollment status first
    if (cls.status === 'suspended') {
      alert('Access to this class has been suspended. Please contact the administrator for more information.');
      return;
    }
    
    if (cls.status === 'completed') {
      alert('This course has been completed. No further access is available.');
      return;
    }
    
    if (cls.status === 'dropped') {
      alert('You have dropped this course. No access is available.');
      return;
    }
    
    // Check payment tracking and grace period
    const paymentTrackingInfo = getPaymentTrackingInfo(cls);
    if (!paymentTrackingInfo.canAccess) {
      if (paymentTrackingInfo.status === 'payment-required') {
        alert('Payment required - grace period has expired. Please make payment to restore access to this class.');
      } else if (paymentTrackingInfo.status === 'no-payment') {
        alert('No payment history found. Please make payment to access this class.');
      } else {
        alert('Access restricted due to payment issues. Please contact the administrator.');
      }
      return;
    }
    
    if (cls.deliveryMethod === 'online' || cls.deliveryMethod === 'hybrid1' || cls.deliveryMethod === 'hybrid3' || cls.deliveryMethod === 'hybrid4') {
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

  // Check if class is currently scheduled (within class time window)
  const isClassCurrentlyScheduled = (cls) => {
    if (!cls.schedule || !cls.schedule.day || !cls.schedule.startTime || !cls.schedule.endTime) return false;
    
    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today];
    
    // Check if today matches the class day
    if (cls.schedule.day !== todayName) return false;
    
    // Parse class start and end times
    const [startHours, startMinutes] = cls.schedule.startTime.split(':').map(Number);
    const [endHours, endMinutes] = cls.schedule.endTime.split(':').map(Number);
    
    const classStartTime = new Date();
    classStartTime.setHours(startHours, startMinutes, 0, 0);
    
    const classEndTime = new Date();
    classEndTime.setHours(endHours, endMinutes, 0, 0);
    
    // Return true if current time is within class time window
    return now >= classStartTime && now <= classEndTime;
  };

  // Calculate video start time based on when student joins
  const getVideoStartTime = (cls) => {
    if (!cls.schedule || !cls.schedule.startTime) return 0;
    
    const now = new Date();
    const [startHours, startMinutes] = cls.schedule.startTime.split(':').map(Number);
    const classStartTime = new Date();
    classStartTime.setHours(startHours, startMinutes, 0, 0);
    
    // Calculate how many seconds have passed since class started
    const secondsPassed = Math.max(0, (now - classStartTime) / 1000);
    
    return Math.floor(secondsPassed);
  };

  // Format time in MM:SS format
  const formatTimeMMSS = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get time until class starts or ends
  const getClassTimeStatus = (cls) => {
    if (!cls.schedule || !cls.schedule.day || !cls.schedule.startTime || !cls.schedule.endTime) return null;
    
    const now = new Date();
    const today = now.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today];
    
    if (cls.schedule.day !== todayName) return null;
    
    const [startHours, startMinutes] = cls.schedule.startTime.split(':').map(Number);
    const [endHours, endMinutes] = cls.schedule.endTime.split(':').map(Number);
    
    const classStartTime = new Date();
    classStartTime.setHours(startHours, startMinutes, 0, 0);
    
    const classEndTime = new Date();
    classEndTime.setHours(endHours, endMinutes, 0, 0);
    
    const timeToStart = (classStartTime - now) / (1000 * 60); // minutes
    const timeToEnd = (classEndTime - now) / (1000 * 60); // minutes
    
    if (timeToStart > 0) {
      if (timeToStart < 60) {
        return `Class starts in ${Math.round(timeToStart)} minutes`;
      } else {
        return `Class starts in ${Math.floor(timeToStart / 60)}h ${Math.round(timeToStart % 60)}m`;
      }
    } else if (timeToEnd > 0) {
      if (timeToEnd < 60) {
        return `Class ends in ${Math.round(timeToEnd)} minutes`;
      } else {
        return `Class ends in ${Math.floor(timeToEnd / 60)}h ${Math.round(timeToEnd % 60)}m`;
      }
    } else {
      return 'Class has ended for today';
    }
  };

  // Handle video viewing
  const handleVideoView = (cls) => {
    // Check enrollment status first
    if (cls.status === 'suspended') {
      alert('Access to this class has been suspended. Please contact the administrator for more information.');
      return;
    }
    
    if (cls.status === 'completed') {
      alert('This course has been completed. No further access is available.');
      return;
    }
    
    if (cls.status === 'dropped') {
      alert('You have dropped this course. No access is available.');
      return;
    }
    
    // Check payment tracking and grace period
    const paymentTrackingInfo = getPaymentTrackingInfo(cls);
    if (!paymentTrackingInfo.canAccess) {
      if (paymentTrackingInfo.status === 'payment-required') {
        alert('Payment required - grace period has expired. Please make payment to restore access to this class.');
      } else if (paymentTrackingInfo.status === 'no-payment') {
        alert('No payment history found. Please make payment to access this class.');
      } else {
        alert('Access restricted due to payment issues. Please contact the administrator.');
      }
      return;
    }
    
    // Check if class has video URL
    if (!cls.videoUrl) {
      alert('No video available for this class.');
      return;
    }
    
    // Check if delivery method supports video
    if (!['hybrid2', 'hybrid3', 'hybrid4'].includes(cls.deliveryMethod)) {
      alert('This class does not support recorded video content.');
      return;
    }
    
    // Check if class is currently scheduled
    if (!isClassCurrentlyScheduled(cls)) {
      const timeStatus = getClassTimeStatus(cls);
      if (timeStatus) {
        alert(`Video access is only available during class time. ${timeStatus}`);
      } else {
        alert('Video access is only available during scheduled class time.');
      }
      return;
    }
    
    // Open video modal
    setSelectedClassForVideo(cls);
    setShowVideoModal(true);
  };

  // Handle attendance marking
  const handleMarkAttendance = async (cls) => {
    try {
      // Get logged-in user data
      const userData = getUserData();
      if (!userData || !userData.userid) {
        alert('No logged-in user found. Please login again.');
      return;
    }

      const studentId = userData.userid;
      const today = new Date().toISOString().split('T')[0];
      
      // Create attendance data
      const attendanceData = {
      date: today,
      time: new Date().toISOString(),
      status: 'present',
      method: 'manual',
        deliveryMethod: cls.deliveryMethod || 'online',
        studentId: studentId,
        studentName: userData.firstName || userData.fullName || 'Unknown Student'
      };
      
      // Mark attendance using backend API
      const response = await markAttendance(cls.id, studentId, attendanceData);
      
      if (response.success) {
        // Refresh the classes data to show updated attendance
        await loadMyClasses();
        alert('Attendance marked successfully!');
      } else {
        alert(response.message || 'Failed to mark attendance');
      }
    } catch (error) {
      alert('Error marking attendance. Please try again.');
    }
  };

  // Handle forget card request
  const handleForgetCardRequest = (cls) => {
    setSelectedClassForRequest(cls);
    setShowForgetCardModal(true);
  };

  // Submit forget card request
  const submitForgetCardRequest = async () => {
    if (selectedClassForRequest) {
      try {
        // Get logged-in user data
        const userData = getUserData();
        if (!userData || !userData.userid) {
          alert('No logged-in user found. Please login again.');
          return;
        }
        
        const studentId = userData.userid;
        
        // Request forget card using backend API
        const response = await requestForgetCard(selectedClassForRequest.id, studentId);
        
        if (response.success) {
          // Refresh the classes data to show updated status
          await loadMyClasses();
      setShowForgetCardModal(false);
          setSelectedClassForRequest(null);
      alert('Forget card request submitted successfully!');
        } else {
          alert(response.message || 'Failed to submit forget card request');
        }
      } catch (error) {
        alert('Error submitting forget card request. Please try again.');
      }
    }
  };

  // Handle late payment request
  const handleLatePaymentRequest = (cls) => {
    setSelectedClassForRequest(cls);
    setShowLatePaymentModal(true);
  };

  // Submit late payment request
  const submitLatePaymentRequest = async () => {
    if (selectedClassForRequest) {
      try {
        // Get logged-in user data
        const userData = getUserData();
        if (!userData || !userData.userid) {
          alert('No logged-in user found. Please login again.');
          return;
        }
        
        const studentId = userData.userid;
        
        // Request late payment using backend API
        const response = await requestLatePayment(selectedClassForRequest.id, studentId);
        
        if (response.success) {
          // Refresh the classes data to show updated status
          await loadMyClasses();
      setShowLatePaymentModal(false);
          setSelectedClassForRequest(null);
      alert('Late payment request submitted successfully! You can attend today\'s class.');
        } else {
          alert(response.message || 'Failed to submit late payment request');
        }
      } catch (error) {
        alert('Error submitting late payment request. Please try again.');
      }
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
    { key: 'live', label: 'Live Classes', icon: <FaVideo />, count: myClasses.filter(cls => {
      if (!cls.schedule || cls.schedule.frequency === 'no-schedule') return false;
      // Check if delivery method supports online classes
      if (!['online', 'hybrid1', 'hybrid3', 'hybrid4'].includes(cls.deliveryMethod)) return false;
      if (!cls.schedule.day || !cls.schedule.startTime) return false;
      
      // Check if class is starting within 15 minutes
      const now = new Date();
      const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[today];
      
      // Only show classes scheduled for today
      if (cls.schedule.day !== todayName) return false;
      
      // Parse class start time
      const [hours, minutes] = cls.schedule.startTime.split(':').map(Number);
      const classStartTime = new Date();
      classStartTime.setHours(hours, minutes, 0, 0);
      
      // Calculate time difference in minutes
      const timeDiff = (classStartTime - now) / (1000 * 60);
      
      // Show if class starts within 30 minutes before or is currently running (within 30 minutes of start)
      return timeDiff >= -30 && timeDiff <= 30;
    }).length },
    { key: 'today', label: "Today's Classes", icon: <FaCalendar />, count: myClasses.filter(cls => {
      if (!cls.schedule || cls.schedule.frequency === 'no-schedule') return false;
      const today = new Date();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[today.getDay()];
      return cls.schedule.day === todayName;
    }).length },
    { key: 'tomorrow', label: "Tomorrow's Classes", icon: <FaCalendarAlt />, count: myClasses.filter(cls => {
      if (!cls.schedule || cls.schedule.frequency === 'no-schedule') return false;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const tomorrowName = dayNames[tomorrow.getDay()];
      return cls.schedule.day === tomorrowName;
    }).length },
    { key: 'this-week', label: 'This Week Classes', icon: <FaCalendarWeek />, count: myClasses.filter(cls => {
      if (!cls.schedule || cls.schedule.frequency === 'no-schedule') return false;
      const today = new Date();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[today.getDay()];
      return cls.schedule.day === todayName || cls.schedule.frequency === 'weekly';
    }).length },
    { key: 'this-month', label: 'This Month Classes', icon: <FaCalendarAlt />, count: myClasses.filter(cls => {
      if (!cls.schedule || cls.schedule.frequency === 'no-schedule') return false;
      return cls.schedule.frequency === 'weekly' || cls.schedule.frequency === 'bi-weekly' || cls.schedule.frequency === 'monthly';
    }).length },
    { key: 'no-schedule', label: 'No Schedule Classes', icon: <FaClock />, count: myClasses.filter(cls => {
      return cls.schedule && cls.schedule.frequency === 'no-schedule';
    }).length },
    { key: 'payment-due', label: 'Payment Due Classes', icon: <FaExclamationTriangle />, count: myClasses.filter(cls => {
      // Check if payment is due from month start to paid day
      if (!cls.nextPaymentDate) return false;
      
      const nextPayment = new Date(cls.nextPaymentDate);
      const today = new Date();
      
      // Check if payment is overdue
      if (nextPayment <= today && cls.paymentStatus !== 'paid') return true;
      
      // Check if it's a monthly payment and we're in the payment period
      if (cls.paymentTracking && (cls.paymentTracking.enabled || cls.paymentTracking === true)) {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const paymentDay = new Date(cls.nextPaymentDate);
        
        // If we're between month start and payment day, and payment status is not paid
        if (today >= monthStart && today <= paymentDay && cls.paymentStatus !== 'paid') {
          return true;
        }
      }
      
      return false;
    }).length }
  ];

  const handleRefresh = async () => {
    await loadMyClasses();
  };

  if (loading) {
    return (
      <DashboardLayout
        userRole="Student"
        sidebarItems={studentSidebarSections}
        onLogout={onLogout}
      >
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your classes...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        userRole="Student"
        sidebarItems={studentSidebarSections}
        onLogout={onLogout}
      >
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
    <DashboardLayout
      userRole="Student"
      sidebarItems={studentSidebarSections}
      onLogout={onLogout}
    >
      <div className="p-2 sm:p-4 md:p-6">
        {/* Header with Stats */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 text-center">
            {selectedTab === 'live' ? (
              <>
                Live Classes - Starting Soon
              </>
            ) : selectedTab === 'today' ? (
              <>
                Today's Classes - {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </>
            ) : selectedTab === 'tomorrow' ? (
              <>
                Tomorrow's Classes - {(() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return tomorrow.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                })()}
              </>
            ) : selectedTab === 'this-week' ? (
              'This Week\'s Classes'
            ) : selectedTab === 'this-month' ? (
              'This Month\'s Classes'
            ) : selectedTab === 'no-schedule' ? (
              'No Schedule Classes'
            ) : selectedTab === 'payment-due' ? (
              'Payment Due Classes'
            ) : (
              'My Classes'
            )}
          </h1>
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
                {myClasses.filter(c => {
                  const paymentInfo = getPaymentTrackingInfo(c);
                  return paymentInfo.status !== 'no-tracking';
                }).length}
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
              <option value="purchased-date">Sort by Purchased Date</option>
              <option value="payment-due">Sort by Payment Due</option>
              <option value="status">Sort by Priority</option>
            </select>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              title="Refresh My Classes Data"
            >
              <FaSync /> Refresh Data
            </button>
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={debugLiveTabFiltering}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                title="Debug Live Tab Filtering (Development Only)"
              >
                <FaCog /> Debug Live Tab
              </button>
            )}
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
              const paymentTrackingInfo = getPaymentTrackingInfo(cls);
              const nextPaymentDate = cls.nextPaymentDate ? new Date(cls.nextPaymentDate) : null;
              const today = new Date();
              const isPaymentDue = nextPaymentDate && nextPaymentDate <= today && cls.paymentStatus !== 'paid';
              const canAttendToday = paymentTrackingInfo.canAccess && cls.status === 'active';
              const isInactive = cls.status === 'inactive';
              const isSuspended = cls.status === 'suspended';
              const isCompleted = cls.status === 'completed';
              const isDropped = cls.status === 'dropped';
              
              const scheduleText = cls.schedule && cls.schedule.frequency === 'no-schedule' ? 
                'No Schedule' :
                cls.schedule && cls.schedule.day && cls.schedule.startTime && cls.schedule.endTime ?
                `${formatDay(cls.schedule.day)} ${formatTime(cls.schedule.startTime)}-${formatTime(cls.schedule.endTime)}` : 
                'Schedule not set';

              // Get time until class starts for live classes
              const timeUntilClass = selectedTab === 'live' ? getTimeUntilClass(cls) : null;

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
                  price={
                    <span className="text-xs">
                      {cls.basePrice && cls.purchasePrice && cls.basePrice !== cls.purchasePrice ? (
                        <>
                          <span className="line-through text-gray-400 mr-1">LKR {parseInt(cls.basePrice).toLocaleString()}</span>
                          <span className="text-green-700 font-bold">LKR {parseInt(cls.purchasePrice).toLocaleString()}</span>
                        </>
                      ) : (
                        <>LKR {parseInt(cls.fee).toLocaleString()}</>
                      )}
                    </span>
                  }
                  image={getClassImage(cls.subject)}
                  className={selectedTab === 'live' ? 'border-2 border-red-500 bg-red-50' : ''}
                  description={
                    <div className="text-xs text-gray-600 space-y-2">
                      <div className="flex items-center justify-between">
                        <span><strong>Subject:</strong> {cls.subject}</span>
                        <span><strong>Stream:</strong> {cls.stream}</span>
                      </div>
                      <div><strong>Schedule:</strong> {scheduleText}</div>
                      {timeUntilClass && (
                        <div className="bg-red-50 p-2 rounded border border-red-200">
                          <div className="flex items-center gap-1 text-red-700">
                            <FaClock className="text-sm" />
                            <span className="font-semibold text-sm">{timeUntilClass}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className={deliveryInfo.color}>{deliveryInfo.icon}</span>
                        <span>{deliveryInfo.text}</span>
                      </div>
                      {cls.zoomLink && (cls.deliveryMethod === 'online' || cls.deliveryMethod === 'hybrid1' || cls.deliveryMethod === 'hybrid3' || cls.deliveryMethod === 'hybrid4') && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <FaVideo />
                          <span className="text-xs">Zoom Available</span>
                        </div>
                      )}
                      {cls.videoUrl && (cls.deliveryMethod === 'hybrid2' || cls.deliveryMethod === 'hybrid3' || cls.deliveryMethod === 'hybrid4') && (
                        <div className="flex items-center gap-1 text-green-600">
                          <FaVideo />
                          <span className="text-xs">
                            {isClassCurrentlyScheduled(cls) ? '🕐 Video Access Now!' : 'Video Available During Class Time'}
                          </span>
                        </div>
                      )}
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
                      
                      {/* Suspended Enrollment Warning */}
                      {isSuspended && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                          <div className="flex items-center gap-2">
                            <FaExclamationTriangle className="text-orange-600 text-sm" />
                            <div>
                              <div className="font-semibold text-orange-700 text-sm">Enrollment Suspended</div>
                              <div className="text-orange-600 text-xs">Access to this class has been temporarily suspended. Contact admin for details.</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Grace Period Warning */}
                      {!paymentTrackingInfo.canAccess && paymentTrackingInfo.status === 'payment-required' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                          <div className="flex items-center gap-2">
                            <FaExclamationTriangle className="text-red-600 text-sm" />
                            <div>
                              <div className="font-semibold text-red-700 text-sm">Grace Period Expired</div>
                              <div className="text-red-600 text-xs">Payment required - grace period has expired. Please make payment to restore access.</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Grace Period Warning (Almost Expired) */}
                      {paymentTrackingInfo.canAccess && paymentTrackingInfo.daysRemaining <= 3 && paymentTrackingInfo.daysRemaining > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                          <div className="flex items-center gap-2">
                            <FaExclamationTriangle className="text-yellow-600 text-sm" />
                            <div>
                              <div className="font-semibold text-yellow-700 text-sm">Grace Period Ending Soon</div>
                              <div className="text-yellow-600 text-xs">Only {paymentTrackingInfo.daysRemaining} days remaining in grace period. Make payment to avoid access restriction.</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Next Payment Due Warning */}
                      {paymentTrackingInfo.canAccess && paymentTrackingInfo.nextPaymentDate && new Date() >= paymentTrackingInfo.nextPaymentDate && paymentTrackingInfo.daysRemaining > 3 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                          <div className="flex items-center gap-2">
                            <FaCalendar className="text-blue-600 text-sm" />
                            <div>
                              <div className="font-semibold text-blue-700 text-sm">Next Payment Due</div>
                              <div className="text-blue-600 text-xs">Next payment due on {paymentTrackingInfo.nextPaymentDate?.toLocaleDateString()}. You can renew anytime during the grace period.</div>
                            </div>
                          </div>
                        </div>
                      )}
                      

                      
                      {/* Completed Enrollment Info */}
                      {isCompleted && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                          <div className="flex items-center gap-2">
                            <FaGraduationCap className="text-blue-600 text-sm" />
                            <div>
                              <div className="font-semibold text-blue-700 text-sm">Course Completed</div>
                              <div className="text-blue-600 text-xs">You have successfully completed this course.</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Dropped Enrollment Info */}
                      {isDropped && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                          <div className="flex items-center gap-2">
                            <FaTimesCircle className="text-red-600 text-sm" />
                            <div>
                              <div className="font-semibold text-red-700 text-sm">Enrollment Dropped</div>
                              <div className="text-red-600 text-xs">You have dropped this course. No further access available.</div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div><strong>Next Payment:</strong> {paymentTrackingInfo.nextPaymentDate ? paymentTrackingInfo.nextPaymentDate.toLocaleDateString() : 'Not set'}</div>
                      <div><strong>Students:</strong> {cls.currentStudents || 0}/{cls.maxStudents}</div>
                      {cls.attendance && cls.attendance.length > 0 && (
                        <div><strong>Attendance:</strong> {cls.attendance.filter(a => a.status === 'present').length}/{cls.attendance.length}</div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {cls.hasExams && <span className="text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded"><FaGraduationCap className="inline mr-1" />Exams</span>}
                        {cls.hasTutes && <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded"><FaBook className="inline mr-1" />Tutes</span>}
                        {cls.forgetCardRequested && <span className="text-orange-600 text-xs bg-orange-50 px-2 py-1 rounded"><FaQrcode className="inline mr-1" />Forget Card</span>}
                                              {paymentTrackingInfo.status !== 'no-tracking' && (
                        <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                          paymentTrackingInfo.canAccess 
                            ? 'text-green-600 bg-green-50' 
                            : 'text-red-600 bg-red-50'
                        }`}>
                          <FaMoneyBill className="inline" />
                          {paymentTrackingInfo.status === 'free-period' && (
                            <span>Free Access ({paymentTrackingInfo.daysRemaining}d left)</span>
                          )}
                          {paymentTrackingInfo.status === 'paid' && (
                            <span>Paid</span>
                          )}
                          {paymentTrackingInfo.status === 'payment-required' && (
                            <span>Payment Required</span>
                          )}
                          {paymentTrackingInfo.status === 'no-payment' && (
                            <span>No Payment</span>
                          )}
                          {paymentTrackingInfo.status === 'unknown' && (
                            <span>Status Unclear</span>
                          )}
                        </span>
                      )}
                      {paymentTrackingInfo.status === 'no-tracking' && (
                        <span className="text-xs px-2 py-1 rounded flex items-center gap-1 text-gray-600 bg-gray-50">
                          <FaMoneyBill className="inline" />
                          <span>No Payment Tracking</span>
                        </span>
                      )}
                        {cls.theoryRevisionDiscount && cls.courseType === 'both' && <span className="text-purple-600 text-xs bg-purple-50 px-2 py-1 rounded"><FaMoneyBill className="inline mr-1" />Discount</span>}
                      
                      {/* Student Card Information */}
                      {cls.studentCard && (
                        <div className="mt-2 p-2 rounded border">
                          <div className="flex items-center gap-2 mb-1">
                            <FaTicketAlt className="text-blue-500" />
                            <span className="text-xs font-semibold">Student Card</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls.cardInfo.color}`}>
                              {cls.cardInfo.label}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls.cardStatus.color}`}>
                              {cls.cardStatus.label}
                            </span>
                          </div>
                          {cls.cardValidity.isValid ? (
                            <div className="text-xs text-green-600">
                              ✓ {cls.cardValidity.reason}
                            </div>
                          ) : (
                            <div className="text-xs text-red-600">
                              ✗ {cls.cardValidity.reason}
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
                      </div>
                      {!paymentTrackingInfo.canAccess && paymentTrackingInfo.status !== 'no-tracking' && (
                        <div className="text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-200">
                          ⚠️ {paymentTrackingInfo.message}
                        </div>
                      )}
                      {paymentTrackingInfo.status === 'free-period' && (
                        <div className="text-green-600 font-semibold bg-green-50 p-2 rounded border border-green-200">
                          🎉 {paymentTrackingInfo.message}
                          <div className="text-xs text-green-600 mt-1">
                            (Day {paymentTrackingInfo.currentDay} of month, {paymentTrackingInfo.freeDays} days free)
                          </div>
                        </div>
                      )}
                      {isInactive && (
                        <div className="text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-200">⚠️ This class has been deactivated by the admin.</div>
                      )}
                      {cls.basePrice && cls.purchasePrice && (
                        <div className="bg-gray-50 rounded p-2 mt-2 text-xs">
                          <div><strong>Price Breakdown:</strong></div>
                          <div>Base Price: <span className="line-through text-gray-400">LKR {parseInt(cls.basePrice).toLocaleString()}</span></div>
                          {cls.theoryStudentDiscount > 0 && (
                            <div>Theory Student Discount: <span className="text-green-700">- LKR {parseInt(cls.theoryStudentDiscount).toLocaleString()}</span></div>
                          )}
                          {cls.speedPostFee > 0 && (
                            <div>Speed Post Fee: <span className="text-blue-700">+ LKR {parseInt(cls.speedPostFee).toLocaleString()}</span></div>
                          )}
                          {cls.promoDiscount > 0 && (
                            <div>Promo Discount: <span className="text-green-700">- LKR {parseInt(cls.promoDiscount).toLocaleString()}</span></div>
                          )}
                          <div className="font-bold">Final Paid: <span className="text-green-700">LKR {parseInt(cls.purchasePrice).toLocaleString()}</span></div>
                        </div>
                      )}
                    </div>
                  }
                  buttonText="View Details"
                  onButtonClick={() => handleViewDetails(cls)}
                  buttonDisabled={isSuspended || isDropped || !paymentTrackingInfo.canAccess}
                >
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4">
                      {/* Disable Join button for suspended, completed, dropped enrollments, or grace period expired */}
                      <button
                        onClick={() => handleJoinClass(cls)}
                        disabled={isSuspended || isCompleted || isDropped || !paymentTrackingInfo.canAccess}
                        className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                          isSuspended || isCompleted || isDropped || !paymentTrackingInfo.canAccess
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        title={
                          isSuspended ? 'Access suspended - contact admin' :
                          isCompleted ? 'Course completed' :
                          isDropped ? 'Course dropped' :
                          !paymentTrackingInfo.canAccess ? 'Payment required - grace period expired' :
                          'Join class'
                        }
                      >
                        <FaPlay /> 
                        {isSuspended ? 'Suspended' : 
                         isCompleted ? 'Completed' : 
                         isDropped ? 'Dropped' : 
                         !paymentTrackingInfo.canAccess ? 'Payment Required' :
                         'Join'}
                      </button>
                      
                      {/* Payment Button - Show when grace period expired OR payment is due */}
                      {((!paymentTrackingInfo.canAccess && (paymentTrackingInfo.status === 'payment-required' || paymentTrackingInfo.status === 'no-payment')) || 
                        (paymentTrackingInfo.canAccess && paymentTrackingInfo.nextPaymentDate && new Date() >= paymentTrackingInfo.nextPaymentDate)) && (
                        <button
                          onClick={() => handleMakePayment(cls)}
                          className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                            !paymentTrackingInfo.canAccess 
                              ? 'bg-red-600 text-white hover:bg-red-700' 
                              : paymentTrackingInfo.daysRemaining <= 3
                              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          title={
                            !paymentTrackingInfo.canAccess 
                              ? 'Make payment to restore access' 
                              : paymentTrackingInfo.daysRemaining <= 3
                              ? 'Make payment to extend grace period'
                              : 'Make payment to renew for next month'
                          }
                        >
                          <FaMoneyBill /> 
                          {!paymentTrackingInfo.canAccess 
                            ? 'Make Payment' 
                            : paymentTrackingInfo.daysRemaining <= 3 
                            ? 'Pay Early' 
                            : 'Renew Payment'
                          }
                        </button>
                      )}
                      
                      {/* Watch Video Button - Show for classes with video URLs */}
                      {cls.videoUrl && (cls.deliveryMethod === 'hybrid2' || cls.deliveryMethod === 'hybrid3' || cls.deliveryMethod === 'hybrid4') && (
                        <button
                          onClick={() => handleVideoView(cls)}
                          disabled={isSuspended || isCompleted || isDropped || !paymentTrackingInfo.canAccess || !isClassCurrentlyScheduled(cls)}
                          className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                            isSuspended || isCompleted || isDropped || !paymentTrackingInfo.canAccess || !isClassCurrentlyScheduled(cls)
                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              : isClassCurrentlyScheduled(cls)
                              ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                          title={
                            isSuspended ? 'Access suspended - contact admin' :
                            isCompleted ? 'Course completed' :
                            isDropped ? 'Course dropped' :
                            !paymentTrackingInfo.canAccess ? 'Payment required - grace period expired' :
                            !isClassCurrentlyScheduled(cls) ? `Video access only during class time. ${getClassTimeStatus(cls) || 'Not scheduled for today'}` :
                            'Watch live video now!'
                          }
                        >
                          <FaVideo /> 
                          {isSuspended ? 'Suspended' : 
                           isCompleted ? 'Completed' : 
                           isDropped ? 'Dropped' : 
                           !paymentTrackingInfo.canAccess ? 'Payment Required' :
                           !isClassCurrentlyScheduled(cls) ? 'Not Available' :
                           '🕐 Watch Now'}
                        </button>
                      )}
                      
                      {/* Debug Button - Only show in development */}
                      {process.env.NODE_ENV === 'development' && (
                        <button
                          onClick={() => debugPaymentTracking(cls)}
                          className="px-3 py-1 rounded-lg text-sm flex items-center gap-1 bg-purple-600 text-white hover:bg-purple-700"
                          title="Debug payment tracking (development only)"
                        >
                          <FaCog /> Debug
                        </button>
                      )}
                  </div>
                </BasicCard>
              );
            })
          ) : (
            <div className="text-center text-gray-500 col-span-full mt-8">
              {selectedTab === 'all' && !searchTerm ? 'You have not purchased any classes yet.' : 
               selectedTab === 'live' ? 'No live classes starting soon.' :
               selectedTab === 'today' ? 'No classes scheduled for today.' :
               selectedTab === 'tomorrow' ? 'No classes scheduled for tomorrow.' :
               selectedTab === 'this-week' ? 'No classes scheduled for this week.' :
               selectedTab === 'this-month' ? 'No classes scheduled for this month.' :
               selectedTab === 'no-schedule' ? 'No classes without schedule.' :
               selectedTab === 'payment-due' ? 'No payment due classes.' :
               `No ${selectedTab} classes found.`}
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
                You are requesting a forget card for: <strong>{selectedClassForRequest?.className}</strong>
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
                You are requesting late payment for: <strong>{selectedClassForRequest?.className}</strong>
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
            enableNewWindowJoin={(() => {
              const value = Boolean(selectedClassForZoom.enableNewWindowJoin);
              console.log('MyClasses - enableNewWindowJoin:', selectedClassForZoom.enableNewWindowJoin, '->', value);
              return value;
            })()}
            enableOverlayJoin={(() => {
              const value = Boolean(selectedClassForZoom.enableOverlayJoin);
              console.log('MyClasses - enableOverlayJoin:', selectedClassForZoom.enableOverlayJoin, '->', value);
              return value;
            })()}
          />
        )}

        {/* Video Player Modal */}
        {showVideoModal && selectedClassForVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FaVideo className="text-2xl" />
                    <div>
                      <h2 className="text-2xl font-bold">Live Class Video</h2>
                      <p className="text-green-100">{selectedClassForVideo.className} • {selectedClassForVideo.subject}</p>
                      <div className="text-yellow-200 text-sm mt-1">
                        🕐 Currently Scheduled: {selectedClassForVideo.schedule?.day} {selectedClassForVideo.schedule?.startTime}-{selectedClassForVideo.schedule?.endTime}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowVideoModal(false);
                      setSelectedClassForVideo(null);
                    }}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <FaTimesCircle size={24} />
                  </button>
                </div>
              </div>

              {/* Security Warning */}
              <div className="bg-red-50 border border-red-200 p-4 mx-6 mt-4 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <FaExclamationTriangle className="text-lg" />
                  <div>
                    <div className="font-semibold">Security Notice</div>
                    <div className="text-sm">
                      This video is protected. Recording, downloading, or screen capture is prohibited and may result in disciplinary action.
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Player with Student Overlay */}
              <div className="p-6">
                <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
                  {/* Student Identification Overlay */}
                  <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm font-mono">
                    <div>Student ID: {getUserData()?.userid || 'Unknown'}</div>
                    <div>Name: {getUserData()?.firstName || 'Unknown'} {getUserData()?.lastName || ''}</div>
                    <div>Class: {selectedClassForVideo.className}</div>
                    <div>Time: {new Date().toLocaleString()}</div>
                    <div>Video Start: {formatTimeMMSS(getVideoStartTime(selectedClassForVideo))}</div>
                  </div>
                  
                  {/* Anti-Cheat Overlay */}
                  <div className="absolute top-4 right-4 z-10 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                    TCMS SECURED
                  </div>
                  
                  {/* Countdown Timer */}
                  {videoTimeRemaining !== null && (
                    <div className="absolute bottom-4 right-4 z-10 bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-bold">
                      ⏰ {Math.floor(videoTimeRemaining / 60)}:{(videoTimeRemaining % 60).toString().padStart(2, '0')} remaining
                    </div>
                  )}
                  
                  <video
                    controls
                    className="w-full h-full"
                    src={selectedClassForVideo.videoUrl}
                    poster="/assets/video-poster.jpg"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      pointerEvents: 'auto'
                    }}
                    onLoadedMetadata={(e) => {
                      // Set video to start from the appropriate time
                      const startTime = getVideoStartTime(selectedClassForVideo);
                      if (startTime > 0) {
                        e.target.currentTime = startTime;
                      }
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                {/* Video Information */}
                <div className="mt-6 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Class Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><strong>Class:</strong> {selectedClassForVideo.className}</div>
                      <div><strong>Subject:</strong> {selectedClassForVideo.subject}</div>
                      <div><strong>Teacher:</strong> {selectedClassForVideo.teacher}</div>
                      <div><strong>Stream:</strong> {selectedClassForVideo.stream}</div>
                      <div><strong>Schedule:</strong> {selectedClassForVideo.schedule?.day} {selectedClassForVideo.schedule?.startTime}-{selectedClassForVideo.schedule?.endTime}</div>
                      <div><strong>Delivery Method:</strong> {getDeliveryMethodInfo(selectedClassForVideo.deliveryMethod).text}</div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Security & Access Information</h3>
                    <ul className="text-sm space-y-2 text-gray-700">
                      <li>• Video access is restricted to scheduled class time only</li>
                      <li>• Your student ID and name are displayed on the video for security</li>
                      <li>• Recording, downloading, or screen capture is strictly prohibited</li>
                      <li>• Violations may result in immediate suspension of video access</li>
                      <li>• Video will automatically stop when class time ends</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Video Timing Information</h3>
                    <div className="text-sm space-y-2 text-gray-700">
                      <div className="flex items-center gap-2">
                        <FaClock className="text-green-600" />
                        <span><strong>Class Schedule:</strong> {selectedClassForVideo.schedule?.day} {selectedClassForVideo.schedule?.startTime}-{selectedClassForVideo.schedule?.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaVideo className="text-green-600" />
                        <span><strong>Video Start Time:</strong> {formatTimeMMSS(getVideoStartTime(selectedClassForVideo))} (based on when you joined)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaInfoCircle className="text-blue-600" />
                        <span><strong>Note:</strong> Video will start from the point in time when you joined the class session</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Class Details Modal */}
        {showDetailsModal && selectedClassForDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img 
                      src={getClassImage(selectedClassForDetails.subject)} 
                      alt={selectedClassForDetails.subject}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h2 className="text-2xl font-bold">{selectedClassForDetails.className}</h2>
                      <p className="text-blue-100">{selectedClassForDetails.subject} • {selectedClassForDetails.teacher}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <FaTimesCircle size={24} />
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <div className="flex space-x-8 px-6 overflow-x-auto" style={{
                  scrollbarWidth: 'none', /* Firefox */
                  msOverflowStyle: 'none', /* Internet Explorer 10+ */
                  WebkitScrollbar: { display: 'none' } /* Safari and Chrome */
                }}>
                  {[
                    { id: 'overview', label: 'Overview', icon: <FaInfoCircle /> },
                    { id: 'schedule', label: 'Schedule', icon: <FaCalendar /> },
                    { id: 'payments', label: 'Payments', icon: <FaMoneyBill /> },
                    { id: 'payment-tracking', label: 'Payment Tracking', icon: <FaShieldAlt /> },
                    { id: 'attendance', label: 'Attendance', icon: <FaCheckCircle /> },
                    { id: 'materials', label: 'Materials', icon: <FaFileAlt /> },
                    { id: 'assignments', label: 'Assignments', icon: <FaTasks /> },
                    { id: 'exams', label: 'Exams', icon: <FaGraduationCap /> },
                    { id: 'recordings', label: 'Recordings', icon: <FaVideo /> }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailsActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                        detailsActiveTab === tab.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {detailsActiveTab === 'overview' && (
                  <div className="space-y-6">
                                         {/* Payment Status Alert */}
                     {(() => {
                       const paymentInfo = getPaymentTrackingInfo(selectedClassForDetails);
                       return (
                         <>
                           {!paymentInfo.canAccess && (
                             <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                               <div className="flex items-center gap-3">
                                 <FaExclamationTriangle className="text-red-600 text-xl" />
                                 <div>
                                   <div className="font-semibold text-red-700 text-lg">Access Restricted</div>
                                   <div className="text-red-600">{paymentInfo.message}</div>
                                   <div className="text-sm text-red-500 mt-1">
                                     Please make payment to restore access to this class.
                                   </div>
                                 </div>
                               </div>
                             </div>
                           )}
                           
                           {paymentInfo.status === 'free-period' && (
                             <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                               <div className="flex items-center gap-3">
                                 <FaCheckCircle className="text-green-600 text-xl" />
                                 <div>
                                   <div className="font-semibold text-green-700 text-lg">Free Access Granted</div>
                                   <div className="text-green-600">{paymentInfo.message}</div>
                                   <div className="text-sm text-green-500 mt-1">
                                     You can access this class during the free period.
                                   </div>
                                 </div>
                               </div>
                             </div>
                           )}
                         </>
                       );
                     })()}

                     {/* Quick Stats */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-blue-50 p-4 rounded-lg">
                         <div className="flex items-center gap-2 text-blue-600 mb-2">
                           <FaCalendar /> <span className="font-semibold">Next Class</span>
                         </div>
                         <p className="text-lg font-bold">
                           {selectedClassForDetails.schedule?.frequency === 'no-schedule' ? 
                             'No Schedule' :
                             `${formatDay(selectedClassForDetails.schedule?.day)} ${formatTime(selectedClassForDetails.schedule?.startTime)}`
                           }
                         </p>
                       </div>
                       <div className="bg-green-50 p-4 rounded-lg">
                         <div className="flex items-center gap-2 text-green-600 mb-2">
                           <FaMoneyBill /> <span className="font-semibold">Payment Status</span>
                         </div>
                         <p className="text-lg font-bold">{getPaymentTrackingInfo(selectedClassForDetails).message}</p>
                       </div>
                       <div className="bg-purple-50 p-4 rounded-lg">
                         <div className="flex items-center gap-2 text-purple-600 mb-2">
                           <FaUsers /> <span className="font-semibold">Class Status</span>
                         </div>
                         <p className="text-lg font-bold">{getClassStatusInfo(selectedClassForDetails.status).text}</p>
                       </div>
                     </div>

                    {/* Class Information */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaBook /> Class Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><strong>Stream:</strong> {selectedClassForDetails.stream}</div>
                        <div><strong>Course Type:</strong> {getCourseTypeInfo(selectedClassForDetails.courseType).text}</div>
                        <div><strong>Delivery Method:</strong> {getDeliveryMethodInfo(selectedClassForDetails.deliveryMethod).text}</div>
                        {selectedClassForDetails.zoomLink && (selectedClassForDetails.deliveryMethod === 'online' || selectedClassForDetails.deliveryMethod === 'hybrid1' || selectedClassForDetails.deliveryMethod === 'hybrid3' || selectedClassForDetails.deliveryMethod === 'hybrid4') && (
                          <div><strong>Zoom Link:</strong> <span className="text-blue-600">Available</span></div>
                        )}
                        {selectedClassForDetails.videoUrl && (selectedClassForDetails.deliveryMethod === 'hybrid2' || selectedClassForDetails.deliveryMethod === 'hybrid3' || selectedClassForDetails.deliveryMethod === 'hybrid4') && (
                          <div><strong>Recorded Video:</strong> <span className="text-green-600">Available</span></div>
                        )}
                        <div><strong>Students:</strong> {selectedClassForDetails.currentStudents || 0}/{selectedClassForDetails.maxStudents}</div>
                        <div><strong>Fee:</strong> LKR {selectedClassForDetails.fee?.toLocaleString()}</div>
                        <div><strong>Purchase Date:</strong> {new Date(selectedClassForDetails.purchaseDate).toLocaleDateString()}</div>
                      </div>
                    </div>

                                         {/* Quick Actions */}
                     <div className="bg-blue-50 p-6 rounded-lg">
                       <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                         <FaPlay /> Quick Actions
                       </h3>
                       <div className="flex flex-wrap gap-2">
                         {(() => {
                           const paymentInfo = getPaymentTrackingInfo(selectedClassForDetails);
                           return (
                             <>
                               {/* Payment Status Alert */}
                               {!paymentInfo.canAccess && (
                                 <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                   <div className="flex items-center gap-2 text-red-700">
                                     <FaExclamationTriangle />
                                     <span className="font-semibold">Access Restricted</span>
                                   </div>
                                   <p className="text-sm text-red-600 mt-1">{paymentInfo.message}</p>
                                 </div>
                               )}
                               
                               {/* Join Class Button - Only if access is granted */}
                               {(selectedClassForDetails.deliveryMethod === 'online' || selectedClassForDetails.deliveryMethod === 'hybrid1' || selectedClassForDetails.deliveryMethod === 'hybrid3' || selectedClassForDetails.deliveryMethod === 'hybrid4') && selectedClassForDetails.zoomLink && paymentInfo.canAccess && (
                                 <button
                                   onClick={() => {
                                     setShowDetailsModal(false);
                                     setSelectedClassForZoom(selectedClassForDetails);
                                     setShowSecureZoomModal(true);
                                   }}
                                   className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                 >
                                   <FaVideo /> Join Class
                                 </button>
                               )}
                               
                               {/* Watch Video Button - Only if access is granted and video is available */}
                               {selectedClassForDetails.videoUrl && (selectedClassForDetails.deliveryMethod === 'hybrid2' || selectedClassForDetails.deliveryMethod === 'hybrid3' || selectedClassForDetails.deliveryMethod === 'hybrid4') && paymentInfo.canAccess && (
                                 <button
                                   onClick={() => {
                                     setShowDetailsModal(false);
                                     setSelectedClassForVideo(selectedClassForDetails);
                                     setShowVideoModal(true);
                                   }}
                                   disabled={!isClassCurrentlyScheduled(selectedClassForDetails)}
                                   className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                     !isClassCurrentlyScheduled(selectedClassForDetails)
                                       ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                       : 'bg-green-600 text-white hover:bg-green-700'
                                   }`}
                                   title={
                                     !isClassCurrentlyScheduled(selectedClassForDetails) 
                                       ? `Video access only during class time. ${getClassTimeStatus(selectedClassForDetails) || 'Not scheduled for today'}`
                                       : 'Watch live video now!'
                                   }
                                 >
                                   <FaVideo /> 
                                   {!isClassCurrentlyScheduled(selectedClassForDetails) ? 'Not Available' : '🕐 Watch Now'}
                                 </button>
                               )}
                               
                               {/* Make Payment Button - Only if access is restricted */}
                               {!paymentInfo.canAccess && (
                                 <button
                                   onClick={() => handleMakePayment(selectedClassForDetails)}
                                   className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                                 >
                                   <FaMoneyBill /> Make Payment
                                 </button>
                               )}
                               
                               {/* Always Available Actions */}
                               <button
                                 onClick={() => setDetailsActiveTab('schedule')}
                                 className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                               >
                                 <FaCalendar /> View Schedule
                               </button>
                               <button
                                 onClick={() => setDetailsActiveTab('payments')}
                                 className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                               >
                                 <FaMoneyBill /> Payment Details
                               </button>
                               <button
                                 onClick={() => setDetailsActiveTab('payment-tracking')}
                                 className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                               >
                                 <FaShieldAlt /> Payment Tracking
                               </button>
                               
                               {/* Additional Actions */}
                               {selectedClassForDetails.hasTutes && (
                                 <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                                   <FaBook /> Access Tutes
                                 </button>
                               )}
                               {selectedClassForDetails.hasExams && (
                                 <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2">
                                   <FaGraduationCap /> Access Exams
                                 </button>
                               )}
                             </>
                           );
                         })()}
                       </div>
                     </div>
                  </div>
                )}

                {detailsActiveTab === 'schedule' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaCalendar /> Class Schedule
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><strong>Day:</strong> {formatDay(selectedClassForDetails.schedule?.day)}</div>
                        <div><strong>Time:</strong> {formatTime(selectedClassForDetails.schedule?.startTime)} - {formatTime(selectedClassForDetails.schedule?.endTime)}</div>
                        <div><strong>Frequency:</strong> {selectedClassForDetails.schedule?.frequency}</div>
                        <div><strong>Duration:</strong> {selectedClassForDetails.startDate && selectedClassForDetails.endDate ? 
                          `${new Date(selectedClassForDetails.startDate).toLocaleDateString()} to ${new Date(selectedClassForDetails.endDate).toLocaleDateString()}` : 'Not specified'}</div>                 
                      </div>
                    </div>
                  </div>
                )}

                {detailsActiveTab === 'payments' && (
                  <div className="space-y-6">
                    {/* Price Breakdown Section */}
                    {selectedClassForDetails.basePrice && selectedClassForDetails.purchasePrice && (
                      <div className="bg-blue-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <FaMoneyBill /> Price Breakdown
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span>Base Price:</span>
                            <span className="line-through text-gray-500">LKR {parseInt(selectedClassForDetails.basePrice).toLocaleString()}</span>
                          </div>
                          {selectedClassForDetails.theoryStudentDiscount > 0 && (
                            <div className="flex justify-between items-center text-green-700">
                              <span>Theory Student Discount:</span>
                              <span>- LKR {parseInt(selectedClassForDetails.theoryStudentDiscount).toLocaleString()}</span>
                            </div>
                          )}
                          {selectedClassForDetails.speedPostFee > 0 && (
                            <div className="flex justify-between items-center text-blue-700">
                              <span>Speed Post Fee:</span>
                              <span>+ LKR {parseInt(selectedClassForDetails.speedPostFee).toLocaleString()}</span>
                            </div>
                          )}
                          {selectedClassForDetails.promoDiscount > 0 && (
                            <div className="flex justify-between items-center text-green-700">
                              <span>Promo Discount:</span>
                              <span>- LKR {parseInt(selectedClassForDetails.promoDiscount).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center font-bold text-lg">
                              <span>Final Paid:</span>
                              <span className="text-green-700">LKR {parseInt(selectedClassForDetails.purchasePrice).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Information Section */}
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaMoneyBill /> Payment Information
                      </h3>
                      {(() => {
                        const paymentInfo = getPaymentTrackingInfo(selectedClassForDetails);
                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><strong>Status:</strong> {paymentInfo.message}</div>
                              <div><strong>Method:</strong> {selectedClassForDetails.paymentMethod}</div>
                              <div><strong>Next Payment:</strong> {paymentInfo.nextPaymentDate?.toLocaleDateString() || 'Not set'}</div>
                              <div><strong>Amount:</strong> LKR {selectedClassForDetails.purchasePrice ? parseInt(selectedClassForDetails.purchasePrice).toLocaleString() : selectedClassForDetails.fee?.toLocaleString()}</div>
                              {paymentInfo.status !== 'no-tracking' && (
                                <>
                                  <div><strong>Free Days:</strong> {paymentInfo.freeDays} days</div>
                                  <div><strong>Current Day:</strong> {paymentInfo.currentDay} of month</div>
                                </>
                              )}
                            </div>
                            
                            {paymentInfo.status !== 'no-tracking' && (
                              <div className={`mt-4 p-4 rounded-lg ${
                                paymentInfo.canAccess ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                <div className={`flex items-center gap-2 ${
                                  paymentInfo.canAccess ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {paymentInfo.canAccess ? <FaCheckCircle /> : <FaExclamationTriangle />}
                                  <div>
                                    <div className="font-semibold">
                                      {paymentInfo.canAccess ? 'Access Granted' : 'Access Restricted'}
                                    </div>
                                    <div className="text-sm">
                                      {paymentInfo.status === 'free-period' && (
                                        <span>You have {paymentInfo.daysRemaining} days of free access remaining this month.</span>
                                      )}
                                      {paymentInfo.status === 'paid' && (
                                        <span>Payment completed. Full access granted.</span>
                                      )}
                                      {paymentInfo.status === 'pending' && (
                                        <span>Payment is pending. Please complete payment to access class.</span>
                                      )}
                                      {paymentInfo.status === 'overdue' && (
                                        <span>Payment is overdue. Please make payment immediately to restore access.</span>
                                      )}
                                      {paymentInfo.status === 'unpaid' && (
                                        <span>Payment required. Please make payment to access class.</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Payment History Section */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaHistory /> Payment History
                      </h3>
                      {selectedClassForDetails.paymentHistory && selectedClassForDetails.paymentHistory.length > 0 ? (
                        <div className="space-y-3">
                          {selectedClassForDetails.paymentHistory.map((payment, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-semibold">Payment #{index + 1}</div>
                                  <div className="text-sm text-gray-600">
                                    {payment.date ? new Date(payment.date).toLocaleDateString() : 'No date'} 
                                  </div>
                                  {payment.invoiceId && (
                                    <div className="text-xs text-gray-500">Invoice: {payment.invoiceId}</div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-lg">LKR {payment.amount ? parseInt(payment.amount).toLocaleString() : '0'}</div>
                                  <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                                    payment.status === 'paid' ? 'bg-green-100 text-green-700' : 
                                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'Unknown'}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 text-sm text-gray-600">
                                Method: {payment.payment_method ? (
                                  payment.payment_method === 'online' ? 'Online Payment' : 
                                         payment.payment_method === 'cash' ? 'Cash Payment' : 
                                         payment.payment_method === 'test' ? 'Test Payment' :
                                  payment.payment_method
                                ) : 'Not specified'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FaHistory className="text-4xl mx-auto mb-4 text-gray-300" />
                          <p>No payment history available.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {detailsActiveTab === 'payment-tracking' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaShieldAlt /> Payment Tracking System
                      </h3>
                      {(() => {
                        const paymentInfo = getPaymentTrackingInfo(selectedClassForDetails);
                        return (
                          <>
                            {paymentInfo.status === 'no-tracking' ? (
                              <div className="text-center py-8">
                                <FaShieldAlt className="text-4xl mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600">No payment tracking enabled for this class.</p>
                                <p className="text-sm text-gray-500 mt-2">You have unlimited access to this class.</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {/* Current Status */}
                                <div className={`p-4 rounded-lg ${
                                  paymentInfo.canAccess ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'
                                }`}>
                                  <div className={`flex items-center gap-3 ${
                                    paymentInfo.canAccess ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    {paymentInfo.canAccess ? <FaCheckCircle size={24} /> : <FaExclamationTriangle size={24} />}
                                    <div>
                                      <div className="font-bold text-lg">
                                        {paymentInfo.canAccess ? 'Access Granted' : 'Access Restricted'}
                                      </div>
                                      <div className="text-sm">{paymentInfo.message}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Free Days Progress */}
                                {paymentInfo.status === 'free-period' && (
                                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <div className="flex items-center gap-2 text-yellow-700 mb-2">
                                      <FaCalendar /> <span className="font-semibold">Free Days Progress</span>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span>Current Day: {paymentInfo.currentDay}</span>
                                        <span>Free Days: {paymentInfo.freeDays}</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${Math.min(100, (paymentInfo.currentDay / paymentInfo.freeDays) * 100)}%` }}
                                        ></div>
                                      </div>
                                      <div className="text-xs text-yellow-600">
                                        {paymentInfo.daysRemaining} days of free access remaining
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Payment Tracking Rules */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <div className="font-semibold mb-2">Payment Tracking Rules:</div>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• First {paymentInfo.freeDays} days of each month: Free access</li>
                                    <li>• After {paymentInfo.freeDays} days: Payment required for access</li>
                                    <li>• Payment status determines ongoing access</li>
                                    <li>• Access is automatically restored upon payment</li>
                                  </ul>
                                </div>

                                {/* Next Actions */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <div className="font-semibold mb-2 text-blue-700">Next Actions:</div>
                                  {paymentInfo.canAccess ? (
                                    <div className="text-sm text-blue-600">
                                      ✅ You can currently access this class. Continue learning!
                                    </div>
                                  ) : (
                                    <div className="text-sm text-blue-600">
                                      💳 Please make payment to restore access to this class.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {detailsActiveTab === 'attendance' && (
                  <div className="space-y-6">
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaCheckCircle /> Attendance Record
                      </h3>
                      {selectedClassForDetails.attendance && selectedClassForDetails.attendance.length > 0 ? (
                        <div className="space-y-2">
                          {selectedClassForDetails.attendance.map((record, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                              <span>{new Date(record.date).toLocaleDateString()}</span>
                              <span className={`px-2 py-1 rounded text-sm ${
                                record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {record.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No attendance records available.</p>
                      )}
                    </div>
                  </div>
                )}

                {detailsActiveTab === 'materials' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaFileAlt /> Course Materials
                      </h3>
                      <div className="space-y-4">
                        {/* Sample materials - in real app, this would come from teacher */}
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FaFilePdf className="text-red-500 text-xl" />
                              <div>
                                <div className="font-semibold">Physics Chapter 1 Notes</div>
                                <div className="text-sm text-gray-500">PDF • 2.5 MB • Uploaded 2 days ago</div>
                              </div>
                            </div>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                              <FaDownload /> Download
                          </button>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FaFileWord className="text-blue-500 text-xl" />
                              <div>
                                <div className="font-semibold">Practice Problems Set 1</div>
                                <div className="text-sm text-gray-500">DOCX • 1.8 MB • Uploaded 1 week ago</div>
                              </div>
                            </div>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                              <FaDownload /> Download
                          </button>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FaFilePowerpoint className="text-orange-500 text-xl" />
                              <div>
                                <div className="font-semibold">Chapter 1 Presentation</div>
                                <div className="text-sm text-gray-500">PPTX • 5.2 MB • Uploaded 3 days ago</div>
                              </div>
                            </div>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                              <FaDownload /> Download
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {detailsActiveTab === 'assignments' && (
                  <div className="space-y-6">
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaTasks /> Course Assignments
                      </h3>
                      <div className="space-y-4">
                        {/* Sample assignments - in real app, this would come from teacher */}
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">Active</span>
                                <span className="text-sm text-gray-500">Due: Dec 15, 2025</span>
                              </div>
                              <h4 className="font-semibold text-lg mb-2">Assignment 1: Mechanics Problems</h4>
                              <p className="text-gray-600 mb-3">Solve problems 1-10 from Chapter 2. Show all your work and submit as PDF.</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>📄 PDF Required</span>
                                <span>⏰ 2 hours estimated</span>
                                <span>📊 15% of grade</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                                <FaDownload /> Download
                          </button>
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                <FaUpload /> Submit
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium">Upcoming</span>
                                <span className="text-sm text-gray-500">Due: Dec 20, 2025</span>
                              </div>
                              <h4 className="font-semibold text-lg mb-2">Assignment 2: Lab Report</h4>
                              <p className="text-gray-600 mb-3">Write a detailed lab report on the pendulum experiment. Include graphs and analysis.</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>📝 Word/PDF</span>
                                <span>⏰ 4 hours estimated</span>
                                <span>📊 20% of grade</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                                <FaDownload /> Download
                              </button>
                              <button className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center gap-2">
                                <FaClock /> Not Available Yet
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">Submitted</span>
                                <span className="text-sm text-gray-500">Submitted: Dec 10, 2025</span>
                              </div>
                              <h4 className="font-semibold text-lg mb-2">Assignment 0: Introduction</h4>
                              <p className="text-gray-600 mb-3">Brief introduction assignment to get familiar with the course.</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>✅ Submitted</span>
                                <span>📊 5% of grade</span>
                                <span>⏳ Grading in progress</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                                <FaEye /> View Submission
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {detailsActiveTab === 'exams' && (
                  <div className="space-y-6">
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaGraduationCap /> Course Exams
                      </h3>
                      <div className="space-y-4">
                        {/* Sample exams - in real app, this would come from teacher */}
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">Available</span>
                                <span className="text-sm text-gray-500">Duration: 2 hours</span>
                              </div>
                              <h4 className="font-semibold text-lg mb-2">Midterm Exam - Mechanics</h4>
                              <p className="text-gray-600 mb-3">Comprehensive exam covering chapters 1-5. Multiple choice and problem solving.</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>📝 50 questions</span>
                                <span>⏰ 120 minutes</span>
                                <span>📊 30% of grade</span>
                                <span>🔄 2 attempts allowed</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                                <FaPlay /> Start Exam
                          </button>
                              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                                <FaEye /> View Instructions
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium">Upcoming</span>
                                <span className="text-sm text-gray-500">Available: Dec 25, 2025</span>
                              </div>
                              <h4 className="font-semibold text-lg mb-2">Final Exam - Complete Course</h4>
                              <p className="text-gray-600 mb-3">Final comprehensive exam covering all course material.</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>📝 100 questions</span>
                                <span>⏰ 180 minutes</span>
                                <span>📊 40% of grade</span>
                                <span>🔄 1 attempt only</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <button className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center gap-2">
                                <FaClock /> Not Available Yet
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">Completed</span>
                                <span className="text-sm text-gray-500">Completed: Dec 5, 2025</span>
                              </div>
                              <h4 className="font-semibold text-lg mb-2">Quiz 1 - Introduction</h4>
                              <p className="text-gray-600 mb-3">Short quiz to test basic understanding of course concepts.</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>✅ Completed</span>
                                <span>📊 Score: 85/100</span>
                                <span>📊 10% of grade</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                <FaEye /> View Results
                              </button>
                              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                                <FaRedo /> Review Answers
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {detailsActiveTab === 'recordings' && (
                  <div className="space-y-6">
                    <div className="bg-red-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaVideo /> Class Recordings
                      </h3>
                      <div className="space-y-4">
                        {/* Sample recordings - in real app, this would come from teacher */}
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <FaPlay className="text-gray-500" />
                              </div>
                              <div>
                                <h4 className="font-semibold">Class 1: Introduction to Mechanics</h4>
                                <div className="text-sm text-gray-500">Duration: 1h 25m • Recorded: Dec 1, 2025</div>
                                <div className="text-xs text-gray-400 mt-1">Topics: Newton's Laws, Force, Motion</div>
                              </div>
                            </div>
                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                              <FaPlay /> Watch
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <FaPlay className="text-gray-500" />
                              </div>
                              <div>
                                <h4 className="font-semibold">Class 2: Kinematics and Dynamics</h4>
                                <div className="text-sm text-gray-500">Duration: 1h 42m • Recorded: Dec 3, 2025</div>
                                <div className="text-xs text-gray-400 mt-1">Topics: Velocity, Acceleration, Free Fall</div>
                              </div>
                            </div>
                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                              <FaPlay /> Watch
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <FaPlay className="text-gray-500" />
                              </div>
                              <div>
                                <h4 className="font-semibold">Class 3: Energy and Work</h4>
                                <div className="text-sm text-gray-500">Duration: 1h 18m • Recorded: Dec 5, 2025</div>
                                <div className="text-xs text-gray-400 mt-1">Topics: Kinetic Energy, Potential Energy, Conservation</div>
                              </div>
                            </div>
                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                              <FaPlay /> Watch
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <FaPlay className="text-gray-500" />
                              </div>
                              <div>
                                <h4 className="font-semibold">Review Session: Exam Preparation</h4>
                                <div className="text-sm text-gray-500">Duration: 2h 15m • Recorded: Dec 7, 2025</div>
                                <div className="text-xs text-gray-400 mt-1">Topics: Practice Problems, Q&A, Tips</div>
                              </div>
                            </div>
                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                              <FaPlay /> Watch
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Recording Features:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• HD quality video recordings</li>
                          <li>• Playback speed control (0.5x to 2x)</li>
                          <li>• Searchable transcripts</li>
                          <li>• Bookmark important moments</li>
                          <li>• Download for offline viewing</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyClasses; 