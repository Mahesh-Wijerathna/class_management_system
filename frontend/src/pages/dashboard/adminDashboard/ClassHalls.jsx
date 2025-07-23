import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import CustomButton from '../../../components/CustomButton';
import BasicForm from '../../../components/BasicForm';
import CustomTextField from '../../../components/CustomTextField';

// Dummy initial data for halls and requests
const initialHalls = [
  { id: 1, name: '101', isFree: true },
  { id: 2, name: '203', isFree: false },
  { id: 3, name: '305', isFree: true },
  { id: 4, name: '402', isFree: true },
];

const initialRequests = [
  { id: 1, hallId: 1, teacher: 'Mr. Silva', status: 'pending' }
];

const ClassHalls = () => {
  const [halls, setHalls] = useState(initialHalls);
  const [requests, setRequests] = useState(initialRequests);
  const [newHall, setNewHall] = useState({ name: '', status: 'Free' });

  // Create a new hall
  const handleAddHall = (values, { resetForm }) => {
    if (values.name.trim()) {
      setHalls(prev => [
        ...prev,
        {
          id: Date.now(),
          name: values.name.trim(),
          isFree: values.status === 'Free',
        },
      ]);
      resetForm();
    }
  };

  // Delete a hall
  const handleDeleteHall = (id) => {
    setHalls(prev => prev.filter(h => h.id !== id));
    setRequests(prev => prev.filter(r => r.hallId !== id));
  };

  // Respond to a hall request
  const handleRespondRequest = (requestId, response) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: response } : r));
    if (response === 'approved') {
      const req = requests.find(r => r.id === requestId);
      if (req) {
        setHalls(prev => prev.map(h => h.id === req.hallId ? { ...h, isFree: false } : h));
      }
    }
  };

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Class Halls Management</h1>
        <p className="mb-6 text-gray-700">Create, delete, and manage hall availability. Respond to hall requests from teachers.</p>
        {/* Add Hall */}
        <div className="mb-6 max-w-2xl">
          <BasicForm
            initialValues={{ name: '', status: 'Free' }}
            validationSchema={null}
            onSubmit={handleAddHall}
          >
            {({ values, handleChange }) => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <CustomTextField
                  id="name"
                  name="name"
                  type="text"
                  label="Hall Name *"
                  value={values.name}
                  onChange={handleChange}
                  required
                />
                <div className="flex flex-col mb-2">
                  <label htmlFor="status" className="text-xs font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    id="status"
                    name="status"
                    value={values.status}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ borderColor: '#1a365d', borderWidth: '2px' }}
                    required
                  >
                    <option value="Free">Free</option>
                    <option value="Booked">Booked</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex justify-center items-center">
                  <CustomButton
                    type="submit"
                    className="w-2/3 max-w-xs py-2 px-4 bg-[#1a365d] text-white rounded hover:bg-[#13294b] active:bg-[#0f2038]"
                  >
                    Add Hall
                  </CustomButton>
                </div>
              </div>
            )}
          </BasicForm>
        </div>
        {/* Halls List */}
        <table className="w-full text-left border mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Hall Name</th>
              <th className="p-2">Status</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {halls.map(hall => (
              <tr key={hall.id} className="border-t">
                <td className="p-2">{hall.name}</td>
                <td className="p-2">{hall.isFree ? 'Free' : 'Booked'}</td>
                <td className="p-2">
                  <CustomButton
                    className="bg-[#29553d] text-white px-3 py-1 rounded hover:bg-[#622f2f] active:bg-[#622f2f]"
                    onClick={() => handleDeleteHall(hall.id)}
                  >
                    Delete
                  </CustomButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Hall Requests */}
        <h2 className="text-lg font-semibold mb-2">Hall Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-500">No hall requests at the moment.</p>
        ) : (
          <table className="w-full text-left border mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Teacher</th>
                <th className="p-2">Hall</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} className="border-t">
                  <td className="p-2">{req.teacher}</td>
                  <td className="p-2">{halls.find(h => h.id === req.hallId)?.name || 'Unknown'}</td>
                  <td className="p-2">{req.status}</td>
                  <td className="p-2 flex gap-2">
                    {req.status === 'pending' && (
                      <>
                        <CustomButton
                          className="bg-[#1a365d] text-white px-3 py-1 rounded hover:bg-[#13294b] active:bg-[#0f2038]"
                          onClick={() => handleRespondRequest(req.id, 'approved')}
                        >
                          Approve
                        </CustomButton>
                        <CustomButton
                          className="bg-[#881c1c] text-white px-3 py-1 rounded hover:bg-[#622f2f] active:bg-[#622f2f]"
                          onClick={() => handleRespondRequest(req.id, 'rejected')}
                        >
                          Reject
                        </CustomButton>
                      </>
                    )}
                    {req.status === 'approved' && <span className="text-green-600">Approved</span>}
                    {req.status === 'rejected' && <span className="text-red-600">Rejected</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClassHalls;
