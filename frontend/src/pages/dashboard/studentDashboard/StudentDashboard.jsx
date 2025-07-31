import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from '././StudentDashboardSidebar';
import Barcode from 'react-barcode';
import ClockProps from '../../../components/ClockProps';
import DateCalendarFormProps from '../../../components/DateCalendarFormProps';
import BasicCard from '../../../components/BasicCard';
import { useNavigate } from 'react-router-dom';
import { LuMonitorSmartphone, LuCreditCard, LuMonitorPlay, LuBookOpen } from 'react-icons/lu';

function DashboardNavButtons() {
  const navigate = useNavigate();
  return (
    <BasicCard>
      <div className="flex flex-col gap-20 w-full items-center">
        <button
          onClick={() => navigate('/student/my-classes')}
          className="flex flex-col items-center justify-center rounded-3xl bg-blue-50 shadow px-6 py-4 w-full max-w-xs h-24 transition duration-200 hover:bg-blue-100 active:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-200"
        >
          <LuMonitorPlay size={32} className="mb-1 text-[#1a365d]" />
          <span className="font-bold text-base text-[#1a365d]">MY CLASSES</span>
        </button>
        <button
          onClick={() => navigate('/student/purchase-classes')}
          className="flex flex-col items-center justify-center rounded-3xl bg-blue-50 shadow px-6 py-4 w-full max-w-xs h-24 transition duration-200 hover:bg-blue-100 active:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-200"
        >
          <LuMonitorSmartphone size={32} className="mb-1 text-[#1a365d]" />
          <span className="font-bold text-base text-[#1a365d]">PURCHASE</span>
          <span className="text-xs text-gray-500">CLASSES</span>
        </button>
        <button
          onClick={() => navigate('/student/my-payments')}
          className="flex flex-col items-center justify-center rounded-3xl bg-blue-50 shadow px-6 py-4 w-full max-w-xs h-24 transition duration-200 hover:bg-blue-100 active:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-200"
        >
          <LuCreditCard size={32} className="mb-1 text-[#1a365d]" />
          <span className="font-bold text-base text-[#1a365d]">MY PAYMENTS</span>
        </button>
        <button
          onClick={() => navigate('/student/lesson-packs')}
          className="flex flex-col items-center justify-center rounded-3xl bg-blue-50 shadow px-6 py-4 w-full max-w-xs h-24 transition duration-200 hover:bg-blue-100 active:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-200"
        >
          <LuBookOpen size={32} className="mb-1 text-[#1a365d]" />
          <span className="font-bold text-base text-[#1a365d]">LESSON PACKS</span>
        </button>
      </div>
    </BasicCard>
  );
}

const StudentDashboard = ({ onLogout }) => {
  const [currentStudent, setCurrentStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load authenticated user data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        
        // Check if user is a student
        if (user.role === 'student') {
          setCurrentStudent(user);
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

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show loading or redirect if no student data
  if (!currentStudent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    );
  }

  // Get initials for avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
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
      <div className="p-4 min-h-screen ">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 gap-y-6">
          {/* First Column: Greeting, Clock, Date (stacked) */}
          <div className="flex flex-col gap-2 w-full items-center">
            <BasicCard>
              <div className="flex items-center gap-4">
                <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=student" alt="avatar" className="w-14 h-14 md:w-20 md:h-20 rounded-full" />
                <div>
                  <div className="text-base md:text-lg font-semibold">{getGreeting()} {currentStudent.firstName} !</div>
                  <div className="text-gray-500 text-xs md:text-sm">Let's Start Learning</div>
                </div>
              </div>
            </BasicCard>
            <BasicCard>
              <ClockProps />
            </BasicCard>
            <BasicCard>
              <DateCalendarFormProps />
            </BasicCard>
          </div>

          {/* Second Column: My Details (organized, modern look) */}
          <div className="w-full flex flex-col items-center h-full lg:row-span-1">
            <BasicCard>
              <div className="flex flex-col items-center md:items-center h-full min-h-[540px] lg:min-h-[540px] lg:h-full justify-between w-full">
                {/* Avatar and Name */}
                <div className="flex flex-col items-center w-full">
                  <div className="bg-red-500 w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-6">
                    {getInitials(currentStudent.firstName, currentStudent.lastName)}
                  </div>
                  <div className="text-xl font-semibold mb-1 text-center">{currentStudent.firstName} {currentStudent.lastName}</div>
                  <div className="text-md text-blue-700 font-semibold mb-2 text-center">
                    Student ID <span className="text-black">#<span className="underline">{currentStudent.userid}</span></span>
                  </div>
                  
                </div>
                {/* Details Section */}
                <div className="w-full bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-xs text-gray-500 font-semibold mb-2">DETAILS</div>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="flex items-center">
                      <span className="mr-2 text-green-600">✔</span>Mobile: {currentStudent.mobile}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="flex items-center">
                      <span className="mr-2 text-green-600">✔</span>School: {currentStudent.school}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="flex items-center">
                      <span className="mr-2 text-green-600">✔</span>Stream: {currentStudent.stream}
                    </span>
                  </div>
                </div>
                {/* Barcode and Verification Button */}
                <div className="w-full flex flex-col items-center">
                  <div className="my-2">
                    <Barcode value={currentStudent.userid} width={1.5} height={50} fontSize={12} displayValue={true} background="#fff" lineColor="#000" />
                  </div>
                  
                </div>
              </div>
            </BasicCard>
          </div>

          {/* Third Column: Nav Buttons only, stacked vertically */}
          <div className="flex flex-col gap-6 w-full items-center">
            <DashboardNavButtons />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;