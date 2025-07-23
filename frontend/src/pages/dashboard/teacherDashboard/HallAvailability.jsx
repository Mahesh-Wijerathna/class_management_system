import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import teacherSidebarSections from './TeacherDashboardSidebar';
import CustomButton from '../../../components/CustomButton';
import BasicForm from '../../../components/BasicForm';
import CustomTextField from '../../../components/CustomTextField';
import CustomSelectField from '../../../components/CustomSelectField';
import { FaBook, FaUserGraduate, FaCalendarAlt, FaClock } from 'react-icons/fa';

// New dummy data for halls
const initialHalls = [
  { id: 1, name: '101', isFree: true, subject: '', className: '', teacher: '', date: '', time: '' },
  { id: 2, name: '203', isFree: false, subject: 'Mathematics', className: '10A', teacher: 'Ms. Perera', date: '2025-07-26', time: '11:00 AM - 12:30 PM' },
  { id: 3, name: '305', isFree: true, subject: '', className: '', teacher: '', date: '', time: '' },
  { id: 4, name: '205', isFree: false, subject: 'Physics', className: '10A', teacher: 'Mr. Silva', date: '2025-07-29', time: '11:00 AM - 12:30 PM' },
  { id: 5, name: '402', isFree: true, subject: '', className: '', teacher: '', date: '', time: '' },
];

const HallAvailability = () => {
  const [halls, setHalls] = useState(initialHalls);
  // Replace with actual user context in production
  const teacher = { id: 'T001', name: 'Mr. Silva' };
  const [requests, setRequests] = useState([]); // {id, hallId, teacher, status, subject, className, date, time}
  const [bookingStatus, setBookingStatus] = useState('');
  const [requestingHall, setRequestingHall] = useState(null); // hall object or null


  // Format time as 09:00 AM - 10:30 AM
  const formatAMPM = t => {
    if (!t) return '';
    let [h, m] = t.split(':');
    h = parseInt(h, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  // Handle form submit for hall request
  const handleRequestSubmit = (values, { resetForm }) => {
    if (!requestingHall) return;
    const time = `${formatAMPM(values.startTime)} - ${formatAMPM(values.endTime)}`;
    const newRequest = {
      id: Date.now(),
      hallId: requestingHall.id,
      teacher: teacher.name,
      teacherId: teacher.id,
      subject: values.subject,
      className: values.className,
      date: values.date,
      time,
      status: 'pending',
    };
    setRequests(prev => [...prev, newRequest]);
    setBookingStatus('Request sent to admin. Awaiting confirmation...');
    setRequestingHall(null);
    resetForm();
    // Simulate admin response after 2 seconds
    setTimeout(() => {
      const approved = Math.random() > 0.3;
      setRequests(prev => prev.map(r => r.id === newRequest.id ? { ...r, status: approved ? 'approved' : 'rejected' } : r));
      setBookingStatus(approved ? 'Booking confirmed! Hall is now reserved for you.' : 'Request rejected by admin.');
      if (approved) {
        setHalls(prev => prev.map(h => h.id === newRequest.hallId ? {
          ...h,
          isFree: false,
          subject: values.subject,
          className: values.className,
          teacher: teacher.name,
          date: values.date,
          time,
        } : h));
      }
    }, 2000);
  };

  return (
    <DashboardLayout userRole="Teacher" sidebarItems={teacherSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Hall Availability</h1>
        <p className="mb-6 text-gray-700">View free halls and request booking from admin.</p>
        {/* Teacher info is automatically used for requests */}
        <table className="w-full text-left border mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Hall Name</th>
              <th className="p-2">Status</th>
              <th className="p-2">Subject</th>
              <th className="p-2">Class Name</th>
              <th className="p-2">Teacher</th>
              <th className="p-2">Date</th>
              <th className="p-2">Time Period</th>
              <th className="p-2">Request Status</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {halls.map(hall => {
              const myRequest = requests.find(r => r.hallId === hall.id && r.teacherId === teacher.id);
              return (
                <tr key={hall.id} className="border-t">
                  <td className="p-2">{hall.name}</td>
                  <td className="p-2">{hall.isFree ? 'Free' : 'Booked'}</td>
                  {hall.isFree ? (
                    <>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">{hall.subject}</td>
                      <td className="p-2">{hall.className}</td>
                      <td className="p-2">{hall.teacher}</td>
                      <td className="p-2">{hall.date}</td>
                      <td className="p-2">{hall.time}</td>
                    </>
                  )}
                  <td className="p-2">
                    {myRequest ? (
                      myRequest.status === 'pending' ? <span className="text-yellow-600">Pending</span>
                      : myRequest.status === 'approved' ? <span className="text-green-600">Approved</span>
                      : <span className="text-red-600">Rejected</span>
                    ) : <span className="text-gray-400">No Request</span>}
                  </td>
                  <td className="p-2">
                    {hall.isFree ? (
                      <CustomButton
                        className="bg-[#1a365d] text-white px-4 py-1 rounded hover:bg-[#13294b] active:bg-[#0f2038]"
                        onClick={() => setRequestingHall(hall)}
                        disabled={myRequest && myRequest.status === 'pending'}
                      >
                        {myRequest && myRequest.status === 'pending' ? 'Requesting...' : 'Request Hall'}
                      </CustomButton>
                    ) : (
                      <span className="text-gray-400">Not Available</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Request Hall Modal/Form */}
        {requestingHall && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
                onClick={() => setRequestingHall(null)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-semibold mb-4">Request Hall: {requestingHall.name}</h2>
              <BasicForm
                initialValues={{ subject: '', className: '', date: '', startTime: '', endTime: '' }}
                validationSchema={null}
                onSubmit={handleRequestSubmit}
              >
                {({ values, handleChange }) => (
                  <div className="flex flex-col gap-3">
                    <CustomTextField
                      id="subject"
                      name="subject"
                      type="text"
                      label="Subject *"
                      value={values.subject}
                      onChange={handleChange}
                      required
                      icon={FaBook}
                    />
                    <CustomTextField
                      id="className"
                      name="className"
                      type="text"
                      label="Class Name *"
                      value={values.className}
                      onChange={handleChange}
                      required
                      icon={FaUserGraduate}
                    />
                    <CustomTextField
                      id="date"
                      name="date"
                      type="date"
                      label="Date *"
                      value={values.date}
                      onChange={handleChange}
                      required
                      icon={FaCalendarAlt}
                    />
                    
                    <div className="flex gap-2 items-end">
                      <CustomTextField
                        id="startTime"
                        name="startTime"
                        type="time"
                        label="Start Time *"
                        value={values.startTime}
                        onChange={handleChange}
                        required
                        style={{ minWidth: '180px', width: '195px' }}
                        icon={FaClock}
                      />
                      <CustomTextField
                        id="endTime"
                        name="endTime"
                        type="time"
                        label="End Time *"
                        value={values.endTime}
                        onChange={handleChange}
                        required
                        style={{ minWidth: '180px', width: '195px' }}
                        icon={FaClock}
                      />
                    </div>

                    <CustomButton
                      type="submit"
                      className="w-full py-2 px-4 bg-[#1a365d] text-white rounded hover:bg-[#13294b] active:bg-[#0f2038] mt-2"
                    >
                      Send Request
                    </CustomButton>
                  </div>
                )}
              </BasicForm>
            </div>
          </div>
        )}
        {bookingStatus && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded text-sm font-semibold">
            {bookingStatus}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HallAvailability;
