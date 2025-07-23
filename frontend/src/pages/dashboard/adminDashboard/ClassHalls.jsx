import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import CustomButton from '../../../components/CustomButton';
import { FaTrash, FaEdit, FaChalkboardTeacher, FaBook, FaUserGraduate, FaCalendarAlt, FaClock } from 'react-icons/fa';
import BasicForm from '../../../components/BasicForm';
import CustomTextField from '../../../components/CustomTextField';
import CustomSelectField from '../../../components/CustomSelectField';
import { date } from 'yup';
import BasicTable from '../../../components/BasicTable';

// Updated dummy initial data for halls and requests
const initialHalls = [
  { id: 1, name: '101', isFree: true, subject: '', className: '', teacher: '', date: '', time: '' },
  { id: 2, name: '203', isFree: false, subject: 'Mathematics', className: '10A', teacher: 'Ms. Perera', date: '2025-07-24', time: '11:00 AM - 12:30 PM' },
  { id: 3, name: '305', isFree: true, subject: '', className: '', teacher: '', date: '', time: '' },
]

const initialRequests = [
  { id: 1, hallId: 2, teacher: 'Ms. Perera', subject: 'Mathematics', className: '10A', time: '11:00 AM - 12:30 PM', status: 'approved' },
  { id: 2, hallId: 1, teacher: 'Mr. Silva', subject: 'Physics', className: '11B', time: '09:00 AM - 10:30 AM', status: 'pending' },
  { id: 3, hallId: 3, teacher: 'Ms. Perera', subject: 'English', className: '12C', time: '08:00 AM - 09:00 AM', status: 'rejected' },
];

const ClassHalls = () => {
  const [halls, setHalls] = useState(initialHalls);
  const [requests, setRequests] = useState(initialRequests);
  const [newHall, setNewHall] = useState({
    name: '',
    status: 'Select Status',
    subject: '',
    className: '',
    teacher: '',
    date: '',
    startTime: '',
    endTime: '',
  });
  const [editingHall, setEditingHall] = useState(null); // hall object or null

  // Dummy teacher list for select field
  const teacherList = [
    { id: 'T001', name: 'Mr. Silva' },
    { id: 'T002', name: 'Ms. Perera' },
    // Add more as needed
  ];
  const teacherOptions = [
    { value: '', label: 'Select Teacher' },
    ...teacherList.map(t => ({ value: t.name, label: t.name }))
  ];

  // Create a new hall
  const handleAddHall = (values, { resetForm }) => {
    if (values.name.trim()) {
      let time = '';
      if (values.status === 'Booked' && values.startTime && values.endTime) {
        // Format time as 09:00 AM - 10:30 AM
        const formatAMPM = t => {
          if (!t) return '';
          let [h, m] = t.split(':');
          h = parseInt(h, 10);
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          return `${h}:${m} ${ampm}`;
        };
        time = `${formatAMPM(values.startTime)} - ${formatAMPM(values.endTime)}`;
      }
      setHalls(prev => [
        ...prev,
        {
          id: Date.now(),
          name: values.name.trim(),
          isFree: values.status === 'Free',
          subject: values.status === 'Booked' ? (values.subject || '') : '',
          className: values.status === 'Booked' ? (values.className || '') : '',
          teacher: values.status === 'Booked' ? (values.teacher || '') : '',
          date: values.status === 'Booked' ? (values.date || '') : '',
          time: values.status === 'Booked' ? time : '',
        },
      ]);
      resetForm();
    }
  };


  // Edit a hall
  const handleEditHall = (hall) => {
    setEditingHall(hall);
  };

  // Save edited hall
  const handleEditHallSubmit = (values, { resetForm }) => {
    setHalls(prev => prev.map(h => h.id === editingHall.id ? {
      ...h,
      ...values,
      isFree: values.status === 'Free',
      subject: values.status === 'Booked' ? (values.subject || '') : '',
      className: values.status === 'Booked' ? (values.className || '') : '',
      teacher: values.status === 'Booked' ? (values.teacher || '') : '',
      date: values.status === 'Booked' ? (values.date || '') : '',
      time: values.status === 'Booked' && values.startTime && values.endTime
        ? `${formatAMPM(values.startTime)} - ${formatAMPM(values.endTime)}`
        : '',
    } : h));
    setEditingHall(null);
    resetForm();
  };

  // Delete a hall
  const handleDeleteHall = (id) => {
    setHalls(prev => prev.filter(h => h.id !== id));
    setRequests(prev => prev.filter(r => r.hallId !== id));
  };

  // Helper for time formatting (for edit form)
  function formatAMPM(t) {
    if (!t) return '';
    let [h, m] = t.split(':');
    h = parseInt(h, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

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
        <div className="mb-8 max-w-5xl mx-auto">
          <div className="w-full flex flex-col items-center">
            <BasicForm
              initialValues={{ name: '', status: 'Select Status', subject: '', className: '', teacher: '', date: '', startTime: '', endTime: '' }}
              validationSchema={null}
              onSubmit={handleAddHall}
            >
              {({ values, handleChange }) => (
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <CustomTextField
                    id="name"
                    name="name"
                    type="text"
                    label="Hall Name *"
                    value={values.name}
                    onChange={handleChange}
                    required
                    icon={FaChalkboardTeacher}
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
                      <option value="Select Status">Select Status</option>
                      <option value="Free">Free</option>
                      <option value="Booked">Booked</option>
                    </select>
                  </div>
                  {values.status === 'Booked' && (
                    <>
                      <CustomTextField
                        id="subject"
                        name="subject"
                        type="text"
                        label="Subject"
                        value={values.subject}
                        onChange={handleChange}
                        icon={FaBook}
                      />
                      <CustomTextField
                        id="className"
                        name="className"
                        type="text"
                        label="Class Name"
                        value={values.className}
                        onChange={handleChange}
                        icon={FaUserGraduate}
                      />
                      <CustomSelectField
                        id="teacher"
                        name="teacher"
                        label="Teacher Name"
                        value={values.teacher}
                        onChange={handleChange}
                        options={teacherOptions}
                        required
                      />
                      <CustomTextField
                        id="date"
                        name="date"
                        type="date"
                        label="Date"
                        value={values.date}
                        onChange={handleChange}
                        required
                        icon={FaCalendarAlt}
                      />
                      <div className="flex mt-3 mb-3 gap-4 items-end ">
                        <CustomTextField
                          id="startTime"
                          name="startTime"
                          type="time"
                          label="Start Time"
                          value={values.startTime}
                          onChange={handleChange}
                          required
                          style={{ minWidth: '180px', width: '505px' }}
                          icon={FaClock}
                        />
                        <CustomTextField
                          id="endTime"
                          name="endTime"
                          type="time"
                          label="End Time"
                          value={values.endTime}
                          onChange={handleChange}
                          required
                          style={{ minWidth: '180px', width: '505px' }}
                          icon={FaClock}
                        />
                      </div>
                    </>
                  )}
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
        </div>

        {/* Halls List */}
        <div className="border-t-2 pt-4">
        <h2 className="text-lg font-semibold mb-2">Hall List</h2>
        <BasicTable
          className="w-full text-left border mb-6"
          columns={[
            { key: 'name', label: 'Hall Name' },
            { key: 'isFree', label: 'Status', render: row => row.isFree ? 'Free' : 'Booked' },
            { key: 'subject', label: 'Subject', render: row => row.isFree ? '' : row.subject },
            { key: 'className', label: 'Class Name', render: row => row.isFree ? '' : row.className },
            { key: 'teacher', label: 'Teacher', render: row => row.isFree ? '' : row.teacher },
            { key: 'date', label: 'Date', render: row => row.isFree ? '' : row.date },
            { key: 'time', label: 'Time Period', render: row => row.isFree ? '' : row.time },
          ]}
          data={halls}
          actions={row => (
            <div className="flex gap-2">
              <button className="text-blue-600 hover:underline" onClick={() => handleEditHall(row)} title="Edit"><FaEdit /></button>
              <button className="text-red-600 hover:underline" onClick={() => handleDeleteHall(row.id)} title="Delete"><FaTrash /></button>
            </div>
          )}
        />

        {/* Edit Hall Modal */}
        {editingHall && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
                onClick={() => setEditingHall(null)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-semibold mb-4">Edit Hall: {editingHall.name}</h2>
              <BasicForm
                initialValues={{
                  name: editingHall.name,
                  status: editingHall.isFree ? 'Free' : 'Booked',
                  subject: editingHall.subject,
                  className: editingHall.className,
                  teacher: editingHall.teacher,
                  date: editingHall.date,
                  startTime: editingHall.time ? (editingHall.time.split(' - ')[0] ? editingHall.time.split(' - ')[0].replace(/ (AM|PM)/, '') : '') : '',
                  endTime: editingHall.time ? (editingHall.time.split(' - ')[1] ? editingHall.time.split(' - ')[1].replace(/ (AM|PM)/, '') : '') : '',
                }}
                validationSchema={null}
                onSubmit={handleEditHallSubmit}
              >
                {({ values, handleChange }) => (
                  <div className="grid grid-cols-1 gap-4 items-end">
                    <CustomTextField
                      id="name"
                      name="name"
                      type="text"
                      label="Hall Name *"
                      value={values.name}
                      onChange={handleChange}
                      required
                      icon={FaChalkboardTeacher}
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
                        <option value="Select Status">Select Status</option>
                        <option value="Free">Free</option>
                        <option value="Booked">Booked</option>
                      </select>
                    </div>
                    {values.status === 'Booked' && (
                      <>
                        <CustomTextField
                          id="subject"
                          name="subject"
                          type="text"
                          label="Subject"
                          value={values.subject}
                          onChange={handleChange}
                          icon={FaBook}
                        />
                        <CustomTextField
                          id="className"
                          name="className"
                          type="text"
                          label="Class Name"
                          value={values.className}
                          onChange={handleChange}
                          icon={FaUserGraduate}
                        />
                        <CustomSelectField
                          id="teacher"
                          name="teacher"
                          label="Teacher Name"
                          value={values.teacher}
                          onChange={handleChange}
                          options={teacherOptions}
                          required
                        />
                        <CustomTextField
                          id="date" 
                          name="date"
                          type="date"
                          label="Date"
                          value={values.date}
                          onChange={handleChange}
                          required
                          icon={FaCalendarAlt}
                        />
                        <CustomTextField
                          id="startTime"
                          name="startTime"
                          type="time"
                          label="Start Time"
                          value={values.startTime}
                          onChange={handleChange}
                          required
                          icon={FaClock}
                        />
                        <CustomTextField
                          id="endTime"
                          name="endTime"
                          type="time"
                          label="End Time"
                          value={values.endTime}
                          onChange={handleChange}
                          required
                          icon={FaClock}
                        />
                      </>
                    )}
                    <CustomButton
                      type="submit"
                      className="w-full py-2 px-4 bg-[#1a365d] text-white rounded hover:bg-[#13294b] active:bg-[#0f2038] mt-2"
                    >
                      Save Changes
                    </CustomButton>
                  </div>
                )}
              </BasicForm>
            </div>
          </div>
        )}
        </div>

        {/* Hall Requests */}
        <div className="border-t-2 pt-4 mt-16">
        <h2 className="text-lg mt-6 font-semibold mb-2">Hall Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-500">No hall requests at the moment.</p>
        ) : (
          <BasicTable
            className="w-full text-left border mb-6"
            columns={[
              { key: 'teacher', label: 'Teacher' },
              { key: 'hall', label: 'Hall', render: row => halls.find(h => h.id === row.hallId)?.name || 'Unknown' },
              { key: 'subject', label: 'Subject', render: row => row.subject || '-' },
              { key: 'className', label: 'Class Name', render: row => row.className || '-' },
              { key: 'time', label: 'Time Period', render: row => row.time || '-' },
              { key: 'status', label: 'Status' },
            ]}
            data={requests}
            actions={row => (
              <div className="flex gap-2">
                {row.status === 'pending' && (
                  <>
                    <CustomButton
                      className="bg-[#1a365d] text-white px-3 py-1 rounded hover:bg-[#13294b] active:bg-[#0f2038]"
                      onClick={() => handleRespondRequest(row.id, 'approved')}
                    >
                      Approve
                    </CustomButton>
                    <CustomButton
                      className="bg-[#881c1c] text-white px-3 py-1 rounded hover:bg-[#622f2f] active:bg-[#622f2f]"
                      onClick={() => handleRespondRequest(row.id, 'rejected')}
                    >
                      Reject
                    </CustomButton>
                  </>
                )}
                {row.status === 'approved' && <span className="text-green-600">Approved</span>}
                {row.status === 'rejected' && <span className="text-red-600">Rejected</span>}
              </div>
            )}
          />
        )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ClassHalls;
