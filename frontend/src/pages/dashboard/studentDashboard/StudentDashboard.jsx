import React from 'react';
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
                  <div className="text-base md:text-lg font-semibold">Good Morning Bawantha !</div>
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
                  <div className="bg-red-500 w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-6">BR</div>
                  <div className="text-xl font-semibold mb-1 text-center">Bawantha Rathnayake</div>
                  <div className="text-md text-blue-700 font-semibold mb-2 text-center">
                    Student ID <span className="text-black">#<span className="underline">20576340</span></span>
                  </div>
                  <div className="flex items-center text-xs text-gray-700 mb-4 text-center">
                    <span className="mr-1">❗</span>
                    Student ID එක verify කර නැත. කරුණාකර verify කරන්න.
                  </div>
                </div>
                {/* Details Section */}
                <div className="w-full bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-xs text-gray-500 font-semibold mb-2">DETAILS</div>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="flex items-center">
                      <span className="mr-2 text-green-600">✔</span>Mobile: 0740901827
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="flex items-center">
                      <span className="mr-2 text-green-600">✔</span>Email: bawa...ke25@gmail.com
                    </span>
                    <button className="ml-2 px-2 py-1 bg-blue-900 text-white rounded text-xs">Verify</button>
                  </div>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="flex items-center">
                      <span className="mr-2 text-red-600">✘</span>Profile Image
                    </span>
                    <button className="ml-2 px-2 py-1 bg-blue-900 text-white rounded text-xs">Verify</button>
                  </div>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="flex items-center">
                      <span className="mr-2 text-red-600">✘</span>NIC
                    </span>
                    <button className="ml-2 px-2 py-1 bg-blue-900 text-white rounded text-xs">Verify</button>
                  </div>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="flex items-center">
                      <span className="mr-2 text-red-600">✘</span>Location
                    </span>
                    <button className="ml-2 px-2 py-1 bg-blue-900 text-white rounded text-xs">Verify</button>
                  </div>
                </div>
                {/* Barcode and Verification Button */}
                <div className="w-full flex flex-col items-center">
                  <div className="my-2">
                    <Barcode value="20576340" width={1.5} height={50} fontSize={12} displayValue={true} background="#fff" lineColor="#000" />
                  </div>
                  <button className="mt-2 px-6 py-2 bg-white border border-red-300 text-red-500 rounded-full shadow text-sm flex items-center gap-2">
                    <span>Verification Center</span>
                  </button>
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