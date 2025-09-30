import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from '././StudentDashboardSidebar';
import Barcode from 'react-barcode';
import ClockProps from '../../../components/ClockProps';
import DateCalendarFormProps from '../../../components/DateCalendarFormProps';
import BasicCard from '../../../components/BasicCard';
import { useNavigate } from 'react-router-dom';
import { LuMonitorSmartphone, LuCreditCard, LuMonitorPlay, LuBookOpen } from 'react-icons/lu';
import axios from 'axios';

// Helper function to get the appropriate storage
const getStorage = () => {
  const usePersistentStorage = sessionStorage.getItem('usePersistentStorage');
  return usePersistentStorage === 'true' ? localStorage : sessionStorage;
};

// Function to fetch complete student profile from student backend
const fetchStudentProfile = async (userid) => {
  try {
    console.log('Fetching student profile for:', userid);
    const response = await axios.get(`http://localhost:8086/routes.php/get_with_id/${userid}`, {
      timeout: 5000
    });
    
    console.log('Student profile response:', response.data);
    
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

function DashboardNavButtons() {
  const navigate = useNavigate();
  return (
    <BasicCard>
      <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 lg:gap-12 xl:gap-16 w-full items-center">
        <button
          onClick={() => navigate('/student/my-classes')}
          className="flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl bg-blue-50 shadow-sm hover:shadow-md px-4 sm:px-6 py-3 sm:py-4 w-full max-w-xs h-20 sm:h-24 transition duration-200 hover:bg-blue-100 active:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-200"
        >
          <LuMonitorPlay size={24} className="sm:text-2xl md:text-3xl mb-1 text-[#1a365d]" />
          <span className="font-bold text-sm sm:text-base text-[#1a365d]">MY CLASSES</span>
        </button>
        <button
          onClick={() => navigate('/student/purchase-classes')}
          className="flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl bg-blue-50 shadow-sm hover:shadow-md px-4 sm:px-6 py-3 sm:py-4 w-full max-w-xs h-20 sm:h-24 transition duration-200 hover:bg-blue-100 active:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-200"
        >
          <LuMonitorSmartphone size={24} className="sm:text-2xl md:text-3xl mb-1 text-[#1a365d]" />
          <span className="font-bold text-sm sm:text-base text-[#1a365d]">PURCHASE</span>
          <span className="text-xs text-gray-500">CLASSES</span>
        </button>
        <button
          onClick={() => navigate('/student/my-payments')}
          className="flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl bg-blue-50 shadow-sm hover:shadow-md px-4 sm:px-6 py-3 sm:py-4 w-full max-w-xs h-20 sm:h-24 transition duration-200 hover:bg-blue-100 active:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-200"
        >
          <LuCreditCard size={24} className="sm:text-2xl md:text-3xl mb-1 text-[#1a365d]" />
          <span className="font-bold text-sm sm:text-base text-[#1a365d]">MY PAYMENTS</span>
        </button>
        <button
          onClick={() => navigate('/student/lesson-packs')}
          className="flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl bg-blue-50 shadow-sm hover:shadow-md px-4 sm:px-6 py-3 sm:py-4 w-full max-w-xs h-20 sm:h-24 transition duration-200 hover:bg-blue-100 active:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-200"
        >
          <LuBookOpen size={24} className="sm:text-2xl md:text-3xl mb-1 text-[#1a365d]" />
          <span className="font-bold text-sm sm:text-base text-[#1a365d]">LESSON PACKS</span>
        </button>
      </div>
    </BasicCard>
  );
}

const StudentDashboard = ({ onLogout }) => {
  const [currentStudent, setCurrentStudent] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecking, setSessionChecking] = useState(false);
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load authenticated user data from appropriate storage
    const storage = getStorage();
    const userData = storage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        
        // Check if user is a student
        if (user.role === 'student') {
          console.log('Setting current student:', user);
          setCurrentStudent(user);
          
          // Fetch complete student profile from student backend
          const loadStudentProfile = async () => {
            try {
              console.log('Loading student profile for user:', user.userid);
              const profile = await fetchStudentProfile(user.userid);
              if (profile) {
                console.log('Setting student profile:', profile);
                console.log('Student name:', profile.first_name, profile.last_name);
                setStudentProfile(profile);
              } else {
                console.log('No profile data received');
              }
            } catch (error) {
              console.error('Error loading student profile:', error);
            } finally {
              setLoading(false);
            }
          };
          
          loadStudentProfile();
          
          // Check session validity every 30 seconds
          const checkSessionValidity = async () => {
            setSessionChecking(true);
            try {
              const response = await axios.get(`http://localhost:8081/routes.php/session-valid/${user.userid}`, {
                timeout: 5000 // 5 second timeout
              });
              if (response.data.success && !response.data.session_valid) {
                // Session is invalid (user is blocked)
                // Clear specific authentication data
                storage.removeItem('userData');
                storage.removeItem('authToken');
                storage.removeItem('refreshToken');
                localStorage.removeItem('userData');
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                sessionStorage.removeItem('userData');
                sessionStorage.removeItem('authToken');
                sessionStorage.removeItem('refreshToken');
                
                // Show logout message
                setShowLogoutMessage(true);
                
                // Force complete page reload to clear all cached data and redirect
                setTimeout(() => {
                  window.location.replace('/login');
                }, 2000);
              }
            } catch (error) {
              console.error('Error checking session validity:', error);
              // Don't block the UI if session check fails
            } finally {
              setSessionChecking(false);
            }
          };
          
          // Check immediately after a short delay to avoid blocking initial render
          setTimeout(checkSessionValidity, 100);
          
          // Set up periodic checking every 30 seconds
          const intervalId = setInterval(checkSessionValidity, 30000);
          
          // Cleanup interval on unmount
          return () => clearInterval(intervalId);
        } else {
          // If not a student, redirect to appropriate dashboard
          console.log("User is not a student, redirecting...");
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

  // Show loading while checking authentication or fetching profile
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-sm sm:text-lg text-gray-600">Loading student profile...</div>
        </div>
      </div>
    );
  }

  // Show loading or redirect if no student data
  if (!currentStudent) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="text-sm sm:text-lg text-gray-600">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  // Get initials for avatar
  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();
    return initials || 'S'; // Return 'S' for Student if no initials available
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <DashboardLayout
      userRole="Student"
      sidebarItems={studentSidebarSections}
      onLogout={onLogout}
    >
      <div className="p-2 sm:p-4 lg:p-6 min-h-screen">
        {/* Logout Message */}
        {showLogoutMessage && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-center text-red-600 text-xs sm:text-sm font-medium">
              <span className="mr-2">⚠️</span>
              Your account has been blocked by the administrator. Redirecting to login...
            </div>
          </div>
        )}
        
        {/* Session Status Indicator */}
        {sessionChecking && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center text-blue-600 text-xs sm:text-sm">
              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600 mr-2"></div>
              Checking session validity...
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* First Column: Greeting, Clock, Date (stacked) */}
          <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4 w-full items-center">
            <BasicCard>
              <div className="flex items-center gap-3 sm:gap-4">
                <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=student" alt="avatar" className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm sm:text-base md:text-lg font-semibold truncate">
                    {getGreeting()} {studentProfile?.first_name || currentStudent.firstName || 'Student'} !
                  </div>
                  <div className="text-gray-500 text-xs sm:text-sm">Let's Start Learning</div>
                </div>
              </div>
            </BasicCard>
            <BasicCard>
              <div className="flex justify-center">
              <ClockProps />
              </div>
            </BasicCard>
            <BasicCard>
              <div className="flex justify-center">
              <DateCalendarFormProps />
              </div>
            </BasicCard>
          </div>

          {/* Second Column: My Details (organized, modern look) */}
          <div className="w-full flex flex-col items-center">
            <BasicCard>
              <div className="flex flex-col items-center h-full min-h-[400px] sm:min-h-[450px] md:min-h-[500px] lg:min-h-[540px] justify-between w-full p-4 sm:p-6">
                {/* Avatar and Name */}
                <div className="flex flex-col items-center w-full mb-4 sm:mb-6">
                  <div className="bg-red-500 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                    {getInitials(studentProfile?.first_name || currentStudent.firstName, studentProfile?.last_name || currentStudent.lastName)}
                  </div>
                  <div className="text-lg sm:text-xl font-semibold mb-1 text-center px-2">
                    {studentProfile ? 
                      `${studentProfile.first_name} ${studentProfile.last_name}` : 
                      currentStudent.firstName ? 
                        `${currentStudent.firstName} ${currentStudent.lastName || ''}` : 
                        'Loading...'
                    }
                  </div>
                  <div className="text-sm sm:text-md text-blue-700 font-semibold mb-2 text-center">
                    Student ID <span className="text-black">#<span className="underline">{currentStudent.userid}</span></span>
                  </div>
                </div>
                
                {/* Details Section */}
                <div className="w-full bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 flex-1">
                  <div className="text-xs text-gray-500 font-semibold mb-3">DETAILS</div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="flex items-center">
                        <span className="mr-2 text-green-600">✔</span>Mobile:
                      </span>
                      <span className="text-gray-700 font-medium truncate ml-2">
                        {studentProfile?.mobile_number || 'Loading...'}
                    </span>
                  </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="flex items-center">
                        <span className="mr-2 text-green-600">✔</span>School:
                      </span>
                      <span className="text-gray-700 font-medium truncate ml-2">
                        {studentProfile?.school || 'Loading...'}
                    </span>
                  </div>
                    
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="flex items-center">
                        <span className="mr-2 text-green-600">✔</span>Stream:
                      </span>
                      <span className="text-gray-700 font-medium truncate ml-2">
                        {studentProfile?.stream || 'Loading...'}
                    </span>
                    </div>
                  </div>
                </div>
                
                {/* Barcode */}
                <div className="w-full flex flex-col items-center">
                  <div className="my-2 transform scale-75 sm:scale-90 md:scale-100">
                    <Barcode 
                      value={currentStudent.userid} 
                      width={1.2} 
                      height={40} 
                      fontSize={10} 
                      displayValue={true} 
                      background="#fff" 
                      lineColor="#000" 
                    />
                  </div>
                </div>
              </div>
            </BasicCard>
          </div>

          {/* Third Column: Nav Buttons only, stacked vertically */}
          <div className="flex flex-col gap-4 sm:gap-6 w-full items-center lg:col-span-2 xl:col-span-1">
            <DashboardNavButtons />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;