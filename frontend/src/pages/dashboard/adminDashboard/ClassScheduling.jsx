import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import BasicAlertBox from '../../../components/BasicAlertBox';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicForm from '../../../components/BasicForm';
import CustomTextField from '../../../components/CustomTextField';
import CustomButton from '../../../components/CustomButton';
import CustomSelectField from '../../../components/CustomSelectField';
import { FaEdit, FaTrash, FaPlus, FaCalendar, FaBook, FaUser, FaClock, FaDoorOpen } from 'react-icons/fa';
import * as Yup from 'yup';
import BasicTable from '../../../components/BasicTable';

const initialSchedules = [
  {
    id: 1,
    subject: 'Physics',
    className: '11B',
    teacher: 'Mr. Silva',
    teacherId: 'T001',
    date: '2025-07-23',
    startTime: '09:00',
    endTime: '10:30',
    classType: 'Online',
    hall: '101',
  },
  {
    id: 2,
    subject: 'Mathematics',
    className: '10A',
    teacher: 'Ms. Perera',
    teacherId: 'T002',
    date: '2025-07-23',
    startTime: '11:00',
    endTime: '12:30',
    classType: 'Physical',
    hall: '203',
  },
];

const deliveryMethodOptions = [
  { value: 'online', label: 'Online' },
  { value: 'physical', label: 'Physical' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'other', label: 'Other' },
];

const validationSchema = Yup.object().shape({
  subject: Yup.string().required('Subject is required'),
  className: Yup.string().required('Class Name is required'),
  teacher: Yup.string().required('Teacher is required'),
  teacherId: Yup.string().required('Teacher ID is required'),
  date: Yup.string().required('Date is required'),
  startTime: Yup.string().required('Start Time is required'),
  endTime: Yup.string().required('End Time is required'),
  deliveryMethod: Yup.string().oneOf(['online', 'physical', 'hybrid', 'other'], 'Invalid delivery method').required('Delivery Method is required'),
  deliveryOther: Yup.string().when('deliveryMethod', {
    is: (val) => val === 'other',
    then: (schema) => schema.required('Please specify delivery method'),
    otherwise: (schema) => schema.notRequired(),
  }),
  zoomLink: Yup.string().when('deliveryMethod', {
    is: (val) => val === 'online' || val === 'hybrid',
    then: (schema) => schema.required('Zoom Link is required'),
    otherwise: (schema) => schema.notRequired(), // Optional for 'other' and 'physical'
  }),
  hall: Yup.string(),
});

const initialValues = {
  subject: '',
  className: '',
  teacher: '',
  teacherId: '',
  date: '',
  startTime: '',
  endTime: '',
  deliveryMethod: 'online',
  deliveryOther: '',
  zoomLink: '',
  hall: '',
};


function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hour, minute] = timeStr.split(':');
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
}


function ClassScheduling() {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(initialValues);
  const [submitKey, setSubmitKey] = useState(0);
  const [alertBox, setAlertBox] = useState({ open: false, message: '', onConfirm: null, onCancel: null, confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' });
  const [zoomLoading, setZoomLoading] = useState(false);
  const [zoomError, setZoomError] = useState('');

  // Dummy teacher list for select fields
  const teacherList = [
    { id: 'T001', name: 'Mr. Silva' },
    { id: 'T002', name: 'Ms. Perera' },
    // Add more as needed
  ];
  const teacherOptions = [
    { value: '', label: 'Select Teacher' },
    ...teacherList.map(t => ({ value: t.name, label: t.name }))
  ];
  const teacherIdOptions = [
    { value: '', label: 'Select Teacher ID' },
    ...teacherList.map(t => ({ value: t.id, label: t.id }))
  ];

  const handleSubmit = (values, { resetForm }) => {
    if (editingId) {
      setSchedules(schedules.map(sch => sch.id === editingId ? { ...values, id: editingId } : sch));
      setEditingId(null);
      setAlertBox({
        open: true,
        message: 'Schedule updated successfully!',
        onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
        onCancel: null,
        confirmText: 'OK',
        cancelText: '',
        type: 'success',
      });
    } else {
      setSchedules([...schedules, { ...values, id: Date.now() }]);
      setAlertBox({
        open: true,
        message: 'Schedule added successfully!',
        onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
        onCancel: null,
        confirmText: 'OK',
        cancelText: '',
        type: 'success',
      });
    }
    resetForm();
    setFormValues(initialValues);
    setSubmitKey(prev => prev + 1);
  };

  const handleEdit = (id) => {
    const sch = schedules.find(s => s.id === id);
    if (sch) {
      setFormValues(sch);
      setEditingId(id);
      setSubmitKey(prev => prev + 1);
    }
  };

  const handleDelete = (id) => {
    setAlertBox({
      open: true,
      message: 'Are you sure you want to delete this schedule?',
      onConfirm: () => {
        setSchedules(schedules.filter(s => s.id !== id));
        if (editingId === id) {
          setEditingId(null);
          setFormValues(initialValues);
          setSubmitKey(prev => prev + 1);
        }
        setAlertBox(a => ({ ...a, open: false }));
      },
      onCancel: () => setAlertBox(a => ({ ...a, open: false })),
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
  };

  return (
    <>
      <BasicAlertBox
        open={alertBox.open}
        message={alertBox.message}
        onConfirm={alertBox.onConfirm}
        onCancel={alertBox.onCancel}
        confirmText={alertBox.confirmText}
        cancelText={alertBox.cancelText}
        type={alertBox.type}
      />
        <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Class Schedules</h1>
        <p className="mb-6 text-gray-700">Create, update, and delete class schedules for all teachers.</p>

      <BasicForm
        key={submitKey}
        initialValues={formValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {(props) => {
          const { errors, touched, handleChange, values, setFieldValue } = props;
          // Auto-fill Teacher ID when teacher is selected
          const handleTeacherChange = (e) => {
            const selectedName = e.target.value;
            handleChange(e);
            const found = teacherList.find(t => t.name === selectedName);
            if (found && setFieldValue) setFieldValue('teacherId', found.id);
          };
          // Auto-fill Teacher when Teacher ID is selected
          const handleTeacherIdChange = (e) => {
            const selectedId = e.target.value;
            handleChange(e);
            const found = teacherList.find(t => t.id === selectedId);
            if (found && setFieldValue) setFieldValue('teacher', found.name);
          };
          // Move handleGenerateZoomLink here so setFieldValue is in scope
          const handleGenerateZoomLink = async () => {
            setZoomLoading(true);
            setZoomError('');
            try {
              await new Promise(res => setTimeout(res, 1000));
              const randomId = Math.floor(100000000 + Math.random() * 900000000);
              const zoomUrl = `https://zoom.us/j/${randomId}`;
              setFieldValue('zoomLink', zoomUrl);
            } catch (err) {
              setZoomError('Failed to generate Zoom link. Please try again.');
            } finally {
              setZoomLoading(false);
            }
          };

          return (
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
              <CustomSelectField
                id="teacher"
                name="teacher"
                label="Teacher *"
                value={values.teacher}
                onChange={handleTeacherChange}
                options={teacherOptions}
                error={errors.teacher}
                touched={touched.teacher}
                required
              />
              <CustomSelectField
                id="teacherId"
                name="teacherId"
                label="Teacher ID *"
                value={values.teacherId}
                onChange={handleTeacherIdChange}
                options={teacherIdOptions}
                error={errors.teacherId}
                touched={touched.teacherId}
                required
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
                id="deliveryMethod"
                name="deliveryMethod"
                label="Delivery Method *"
                value={values.deliveryMethod}
                onChange={handleChange}
                options={deliveryMethodOptions}
                error={errors.deliveryMethod}
                touched={touched.deliveryMethod}
                required
              />
              {values.deliveryMethod === 'other' && (
                <CustomTextField
                  id="deliveryOther"
                  name="deliveryOther"
                  type="text"
                  label="Describe Delivery Method *"
                  value={values.deliveryOther}
                  onChange={handleChange}
                  error={errors.deliveryOther}
                  touched={touched.deliveryOther}
                />
              )}
              {(values.deliveryMethod === 'online' || values.deliveryMethod === 'hybrid' || values.deliveryMethod === 'other') && (
                <div className="flex items-center gap-2 col-span-2">
                  <CustomTextField
                    id="zoomLink"
                    name="zoomLink"
                    type="url"
                    label={values.deliveryMethod === 'other' ? "Zoom Link (Optional)" : "Zoom Link"}
                    value={values.zoomLink}
                    onChange={handleChange}
                    error={errors.zoomLink}
                    touched={touched.zoomLink}
                    icon={FaCalendar}
                    placeholder="https://zoom.us/j/..."
                  />
                  <CustomButton
                    type="button"
                    onClick={handleGenerateZoomLink}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                    disabled={zoomLoading}
                  >
                    {zoomLoading ? 'Generating...' : 'Create Zoom Link'}
                  </CustomButton>
                  {zoomError && <div className="text-red-600 text-sm mt-1">{zoomError}</div>}
                </div>
              )}
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
          );
        }}
      </BasicForm>
      

      {/* Schedule List */}
      <div className="border-t-2 pt-4">
        <h2 className="text-lg font-semibold mb-2">All Class Schedules</h2>
        <BasicTable
          columns={[
            { key: 'subject', label: 'Subject' },
            { key: 'className', label: 'Class' },
            { key: 'teacher', label: 'Teacher' },
            { key: 'teacherId', label: 'Teacher ID' },
            { key: 'date', label: 'Date' },
            { key: 'startTime', label: 'Start Time', render: row => formatTime(row.startTime) },
            { key: 'endTime', label: 'End Time', render: row => formatTime(row.endTime) },
            { key: 'classType', label: 'Type' },
            { key: 'hall', label: 'Hall' },
          ]}
          data={schedules}
          actions={row => (
            <div className="flex gap-2">
              <button
                className="text-blue-600 hover:underline"
                onClick={() => handleEdit(row.id)}
                title="Edit"
              >
                <FaEdit />
              </button>
              <button
                className="text-red-600 hover:underline"
                onClick={() => handleDelete(row.id)}
                title="Delete"
              >
                <FaTrash />
              </button>
            </div>
          )}
        />
      </div>

      </div>  
    </>
  );
}

export default ClassScheduling;
