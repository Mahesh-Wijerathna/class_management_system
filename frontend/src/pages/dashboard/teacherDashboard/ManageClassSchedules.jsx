import React, { useState } from 'react';
import { FaEdit, FaTrash, FaPlus, FaCalendar, FaBook, FaUser, FaClock, FaDoorOpen } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import teacherSidebarSections from './TeacherDashboardSidebar';
import BasicForm from '../../../components/BasicForm';
import CustomTextField from '../../../components/CustomTextField';
import CustomButton from '../../../components/CustomButton';
import CustomSelectField from '../../../components/CustomSelectField';
import * as Yup from 'yup';

const initialSchedules = [
  {
    id: 1,
    subject: 'Physics',
    className: '11B',
    date: '2025-07-23',
    startTime: '09:00',
    endTime: '10:30',
    classType: 'Online',
    hall: '101',
  },
  {
    id: 2,
    subject: 'Physics',
    className: '11B',
    date: '2025-07-23',
    startTime: '11:00',
    endTime: '12:30',
    classType: 'Physical',
    hall: '203',
  },
];


const validationSchema = Yup.object().shape({
  subject: Yup.string().required('Subject is required'),
  className: Yup.string().required('Class Name is required'),
  date: Yup.string().required('Date is required'),
  startTime: Yup.string().required('Start Time is required'),
  endTime: Yup.string().required('End Time is required'),
  classType: Yup.string().oneOf(['Online', 'Physical', 'Hybrid'], 'Invalid class type').required('Class Type is required'),
  hall: Yup.string(), 
});

const initialValues = {
  subject: '',
  className: '',
  date: '',
  startTime: '',
  endTime: '',
  classType: '',
  hall: '',
};


// Helper to format time to 12-hour with AM/PM
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hour, minute] = timeStr.split(':');
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
}

const ManageClassSchedules = () => {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(initialValues);
  const [submitKey, setSubmitKey] = useState(0); // To force re-render of BasicForm on edit
  const navigate = useNavigate();

  // Add or update schedule
  const handleSubmit = (values, { resetForm }) => {
    if (editingId !== null) {
      setSchedules(prev => prev.map(sch => sch.id === editingId ? { ...values, id: editingId } : sch));
    } else {
      setSchedules(prev => [...prev, { ...values, id: Date.now() }]);
    }
    setEditingId(null);
    setFormValues(initialValues);
    setSubmitKey(prev => prev + 1);
    resetForm();
  };

  // Edit schedule
  const handleEdit = (id) => {
    const sch = schedules.find(s => s.id === id);
    if (sch) {
      setEditingId(id);
      setFormValues({
        subject: sch.subject,
        className: sch.className,
        date: sch.date,
        startTime: sch.startTime,
        endTime: sch.endTime,
        classType: sch.classType || '',
        hall: sch.hall || '',
      });
      setSubmitKey(prev => prev + 1);
    }
  };

  // Delete schedule
  const handleDelete = (id) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setFormValues(initialValues);
      setSubmitKey(prev => prev + 1);
    }
  };

  return (
    <DashboardLayout userRole="Teacher" sidebarItems={teacherSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Class Session Schedules</h1>
        <p className="mb-6 text-gray-700">Create, update, and delete class session schedules for your classes.</p>

        <BasicForm
          key={submitKey}
          initialValues={formValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, handleChange, values }) => (
            <>
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomTextField
                  id="subject"
                  name="subject"
                  type="text"
                  label="Subject *"
                  value={values.subject}
                  onChange={handleChange}
                  error={errors.subject}
                  touched={touched.subject}
                  icon={FaBook}
                />
                <CustomTextField
                  id="className"
                  name="className"
                  type="text"
                  label="Class Name *"
                  value={values.className}
                  onChange={handleChange}
                  error={errors.className}
                  touched={touched.className}
                  icon={FaUser}
                />
                <CustomTextField
                  id="date"
                  name="date"
                  type="date"
                  label="Date *"
                  value={values.date}
                  onChange={handleChange}
                  error={errors.date}
                  touched={touched.date}
                  icon={FaCalendar}
                />
                <CustomTextField
                  id="startTime"
                  name="startTime"
                  type="time"
                  label="Start Time *"
                  value={values.startTime}
                  onChange={handleChange}
                  error={errors.startTime}
                  touched={touched.startTime}
                  icon={FaClock}
                />
                <CustomTextField
                  id="endTime"
                  name="endTime"
                  type="time"
                  label="End Time *"
                  value={values.endTime}
                  onChange={handleChange}
                  error={errors.endTime}
                  touched={touched.endTime}
                  icon={FaClock}
                />
                
              <CustomSelectField
                id="classType"
                name="classType"
                label="Class Type"
                value={values.classType}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select Type' },
                  { value: 'Online', label: 'Online' },
                  { value: 'Physical', label: 'Physical' },
                  { value: 'Hybrid', label: 'Hybrid' },
                ]}
                error={errors.classType}
                touched={touched.classType}
                required
              />

              <CustomTextField
                id="hall"
                name="hall"
                type="text"
                label="Hall (optional)"
                value={values.hall}
                onChange={handleChange}
                error={errors.hall}
                touched={touched.hall}
                icon={FaDoorOpen}
              />
                <div className="col-span-1 md:col-span-2 flex justify-center">
                  <CustomButton
                    type="submit"
                    className="w-2/3 max-w-xs py-2 px-4 bg-[#1a365d] text-white hover:bg-[#13294b] active:bg-[#0f2038]  rounded flex items-center justify-center gap-2"
                  >
                    {editingId ? <FaEdit /> : <FaPlus />} {editingId ? 'Update Schedule' : 'Add Schedule'}
                  </CustomButton>
                </div>
              </div>
            </>
          )}
        </BasicForm>

        {/* Schedule List */}
        <div className="border-t-2 pt-4">
          <h2 className="text-lg font-semibold mb-2">Session Schedules</h2>
          {schedules.length === 0 ? (
            <p className="text-gray-500">No session schedules available.</p>
          ) : (
            <table className="w-full text-left border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Subject</th>
                  <th className="p-2">Class</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Start Time</th>
                  <th className="p-2">End Time</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Hall</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(sch => (
                  <tr key={sch.id} className="border-t">
                    <td className="p-2">{sch.subject}</td>
                    <td className="p-2">{sch.className}</td>
                    <td className="p-2">{sch.date}</td>
                    <td className="p-2">{formatTime(sch.startTime)}</td>
                    <td className="p-2">{formatTime(sch.endTime)}</td>
                    <td className="p-2">{sch.classType}</td>
                    <td className="p-2">{sch.hall}</td>
                    <td className="p-2 flex gap-2">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => handleEdit(sch.id)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => handleDelete(sch.id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageClassSchedules;
