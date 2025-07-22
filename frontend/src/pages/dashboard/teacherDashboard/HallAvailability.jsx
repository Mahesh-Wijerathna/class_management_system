import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import teacherSidebarSections from './TeacherDashboardSidebar';
import CustomButton from '../../../components/CustomButton';

// Dummy data for halls
const initialHalls = [
  { id: 1, name: '101', isFree: true },
  { id: 2, name: '203', isFree: false },
  { id: 3, name: '305', isFree: true },
  { id: 4, name: '402', isFree: true },
];

const HallAvailability = () => {
  const [halls, setHalls] = useState(initialHalls);
  // Replace with actual user context in production
  const teacher = { id: 'T001', name: 'Mr. Silva' };
  const [requests, setRequests] = useState([]); // {id, hallId, teacher, status}
  const [bookingStatus, setBookingStatus] = useState('');

  // Request a free hall
  const handleRequest = (hallId) => {
    const newRequest = {
      id: Date.now(),
      hallId,
      teacher: teacher.name,
      teacherId: teacher.id,
      status: 'pending',
    };
    setRequests(prev => [...prev, newRequest]);
    setBookingStatus('Request sent to admin. Awaiting confirmation...');
    // Simulate admin response after 2 seconds
    setTimeout(() => {
      // For demo, randomly approve or reject
      const approved = Math.random() > 0.3;
      setRequests(prev => prev.map(r => r.id === newRequest.id ? { ...r, status: approved ? 'approved' : 'rejected' } : r));
      setBookingStatus(approved ? 'Booking confirmed! Hall is now reserved for you.' : 'Request rejected by admin.');
      if (approved) {
        setHalls(prev => prev.map(h => h.id === hallId ? { ...h, isFree: false } : h));
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
                        onClick={() => handleRequest(hall.id)}
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
