import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import BasicAlertBox from '../../../components/BasicAlertBox';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicForm from '../../../components/BasicForm';
import CustomTextField from '../../../components/CustomTextField';
import CustomButton from '../../../components/CustomButton';
import CustomSelectField from '../../../components/CustomSelectField';
import { FaEdit, FaTrash, FaPlus, FaCalendar, FaBook, FaUser, FaClock, FaDoorOpen, FaMoneyBill, FaVideo, FaUsers, FaGraduationCap } from 'react-icons/fa';
import * as Yup from 'yup';
import BasicTable from '../../../components/BasicTable';


const streamOptions = [
    'O/L',
    'A/L-Art',
    'A/L-Maths',
    'A/L-Science',
    'A/L-Commerce',
    'A/L-Technology',
    'Primary',
  ];

const statusOptions = [
  { value: '', label: 'Select Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

const validationSchema = Yup.object().shape({
  className: Yup.string().required('Class Name is required'),
  subject: Yup.string().required('Subject is required'),
  teacher: Yup.string().required('Teacher is required'),
  teacherId: Yup.string().required('Teacher ID is required'),
  stream: Yup.string().oneOf(streamOptions, 'Invalid stream').required('Stream is required'),
  deliveryMethod: Yup.string().oneOf(['online', 'physical', 'hybrid', 'other'], 'Invalid delivery method').required('Delivery Method is required'),
  deliveryOther: Yup.string().when('deliveryMethod', {
    is: (val) => val === 'other',
    then: (schema) => schema.required('Please specify delivery method'),
    otherwise: (schema) => schema.notRequired(),
  }),
  schedule: Yup.object().shape({
    day: Yup.string().required('Day is required'),
    startTime: Yup.string().required('Start Time is required'),
    endTime: Yup.string().required('End Time is required'),
    frequency: Yup.string().oneOf(['weekly', 'bi-weekly', 'monthly'], 'Invalid frequency').required('Frequency is required'),
  }),
  startDate: Yup.string().required('Start Date is required'),
  endDate: Yup.string().required('End Date is required').test('endDate', 'End Date must be after Start Date', function(value) {
    const { startDate } = this.parent;
    return !startDate || !value || value >= startDate;
  }),
  hall: Yup.string(),
  maxStudents: Yup.number().min(1, 'Must be at least 1').required('Maximum Students is required'),
  fee: Yup.number().min(0, 'Must be 0 or greater').required('Fee is required'),
  zoomLink: Yup.string().when('deliveryMethod', {
    is: (val) => val === 'online' || val === 'hybrid',
    then: (schema) => schema.required('Zoom Link is required'),
    otherwise: (schema) => schema.notRequired(), // Optional for 'other' and 'physical'
  }),
  courseType: Yup.string().oneOf(['theory', 'revision', 'both'], 'Invalid course type').required('Course Type is required'),
  status: Yup.string().oneOf(['active', 'inactive', 'archived'], 'Invalid status').required('Status is required'),
});

const initialValues = {
  className: '',
  subject: '',
  teacher: '',
  teacherId: '',
  stream: '',
  deliveryMethod: 'online',
  deliveryOther: '',
  schedule: {
    day: '',
    startTime: '',
    endTime: '',
    frequency: 'weekly'
  },
  startDate: '',
  endDate: '',
  hall: '',
  maxStudents: 50,
  fee: '',
  paymentTracking: false,
  zoomLink: '',
  description: '',
  courseType: 'theory',
  theoryRevisionDiscount: false,
  status: ''
};

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hour, minute] = timeStr.split(':');
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
}

function formatDay(day) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

const CreateClass = () => {
  const [classes, setClasses] = useState(() => {
    const stored = localStorage.getItem('classes');
    return stored ? JSON.parse(stored) : [];
  });
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(initialValues);
  const [submitKey, setSubmitKey] = useState(0);
  const [alertBox, setAlertBox] = useState({ open: false, message: '', onConfirm: null, onCancel: null, confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' });
  const [zoomLoading, setZoomLoading] = useState(false);
  const [zoomError, setZoomError] = useState('');

  // Save to localStorage whenever classes changes
  useEffect(() => {
    localStorage.setItem('classes', JSON.stringify(classes));
  }, [classes]);

  // Dummy teacher list for select fields
  const teacherList = [
    { id: 'T001', name: 'Mr. Silva' },
    { id: 'T002', name: 'Ms. Perera' },
    { id: 'T003', name: 'Mr. Wilson' },
    { id: 'T004', name: 'Ms. Johnson' },
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
      setClasses(classes.map(cls => cls.id === editingId ? { ...values, id: editingId } : cls));
      setEditingId(null);
      setAlertBox({
        open: true,
        message: 'Class updated successfully!',
        onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
        onCancel: null,
        confirmText: 'OK',
        cancelText: '',
        type: 'success',
      });
    } else {
      setClasses([...classes, { ...values, id: Date.now(), status: 'active' }]);
      setAlertBox({
        open: true,
        message: 'Class created successfully!',
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
    const cls = classes.find(c => c.id === id);
    if (cls) {
      setFormValues(cls);
      setEditingId(id);
      setSubmitKey(prev => prev + 1);
    }
  };

  const handleDelete = (id) => {
    setAlertBox({
      open: true,
      message: 'Are you sure you want to delete this class?',
      onConfirm: () => {
        setClasses(classes.filter(c => c.id !== id));
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
        <h1 className="text-2xl font-bold mb-4">Class Management</h1>
        <p className="mb-6 text-gray-700">Create, update, and manage classes with different delivery methods and course types.</p>

        <BasicForm
          key={submitKey}
          initialValues={formValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {(props) => {
            const { errors, touched, handleChange, values, setFieldValue } = props;
            // Link teacher and teacherId
            const handleTeacherChange = (e) => {
              const selectedName = e.target.value;
              handleChange(e);
              const found = teacherList.find(t => t.name === selectedName);
              if (found && setFieldValue) setFieldValue('teacher', found.name);
            };
            const handleTeacherIdChange = (e) => {
              const selectedId = e.target.value;
              handleChange(e);
              const found = teacherList.find(t => t.id === selectedId);
              if (found && setFieldValue) setFieldValue('teacherId', found.id);
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
              <div className="mb-8 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomTextField
                    id="className"
                    name="className"
                    type="text"
                    label="Class Name *"
                    value={values.className}
                    onChange={handleChange}
                    error={errors.className}
                    touched={touched.className}
                    icon={FaGraduationCap}
                  />
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
                  <CustomSelectField
                    id="stream"
                    name="stream"
                    label="Stream *"
                    value={values.stream}
                    onChange={handleChange}
                    options={[{ value: '', label: 'Select Stream' }, ...streamOptions.map(s => ({ value: s, label: s }))]}
                    error={errors.stream}
                    touched={touched.stream}
                    required
                  />
                </div>
                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomTextField
                    id="startDate"
                    name="startDate"
                    type="date"
                    label="Start Date *"
                    value={values.startDate}
                    onChange={handleChange}
                    error={errors.startDate}
                    touched={touched.startDate}
                    icon={FaCalendar}
                  />
                  <CustomTextField
                    id="endDate"
                    name="endDate"
                    type="date"
                    label="End Date *"
                    value={values.endDate}
                    onChange={handleChange}
                    error={errors.endDate}
                    touched={touched.endDate}
                    icon={FaCalendar}
                  />
                </div>
                {/* Delivery Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Delivery Method *</label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="online"
                        checked={values.deliveryMethod === 'online'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">Online Only</div>
                        <div className="text-sm text-gray-500">Live streaming classes</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="physical"
                        checked={values.deliveryMethod === 'physical'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">Physical Only</div>
                        <div className="text-sm text-gray-500">In-person classes</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="hybrid"
                        checked={values.deliveryMethod === 'hybrid'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">Hybrid</div>
                        <div className="text-sm text-gray-500">Alternating weeks</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="other"
                        checked={values.deliveryMethod === 'other'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">Other</div>
                        <div className="text-sm text-gray-500">Custom (describe below)</div>
                      </div>
                    </label>
                  </div>
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
                  {errors.deliveryMethod && touched.deliveryMethod && (
                    <div className="text-red-600 text-sm mt-1">{errors.deliveryMethod}</div>
                  )}
                </div>
                {/* Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <CustomSelectField
                    id="schedule.day"
                    name="schedule.day"
                    label="Day *"
                    value={values.schedule.day}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Select Day' },
                      { value: 'monday', label: 'Monday' },
                      { value: 'tuesday', label: 'Tuesday' },
                      { value: 'wednesday', label: 'Wednesday' },
                      { value: 'thursday', label: 'Thursday' },
                      { value: 'friday', label: 'Friday' },
                      { value: 'saturday', label: 'Saturday' },
                      { value: 'sunday', label: 'Sunday' },
                    ]}
                    error={errors.schedule?.day}
                    touched={touched.schedule?.day}
                    required
                  />
                  <CustomTextField
                    id="schedule.startTime"
                    name="schedule.startTime"
                    type="time"
                    label="Start Time *"
                    value={values.schedule.startTime}
                    onChange={handleChange}
                    error={errors.schedule?.startTime}
                    touched={touched.schedule?.startTime}
                    icon={FaClock}
                  />
                  <CustomTextField
                    id="schedule.endTime"
                    name="schedule.endTime"
                    type="time"
                    label="End Time *"
                    value={values.schedule.endTime}
                    onChange={handleChange}
                    error={errors.schedule?.endTime}
                    touched={touched.schedule?.endTime}
                    icon={FaClock}
                  />
                  <CustomSelectField
                    id="schedule.frequency"
                    name="schedule.frequency"
                    label="Frequency"
                    value={values.schedule.frequency}
                    onChange={handleChange}
                    options={[
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'bi-weekly', label: 'Bi-weekly' },
                      { value: 'monthly', label: 'Monthly' },
                    ]}
                    error={errors.schedule?.frequency}
                    touched={touched.schedule?.frequency}
                  />
                </div>
                {/* Class Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CustomSelectField
                    id="hall"
                    name="hall"
                    label="Class Hall"
                    value={values.hall}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Select Hall' },
                      { value: 'hall1', label: 'Hall A' },
                      { value: 'hall2', label: 'Hall B' },
                      { value: 'hall3', label: 'Hall C' },
                    ]}
                    error={errors.hall}
                    touched={touched.hall}
                  />
                  <CustomTextField
                    id="maxStudents"
                    name="maxStudents"
                    type="number"
                    label="Maximum Students"
                    value={values.maxStudents}
                    onChange={handleChange}
                    error={errors.maxStudents}
                    touched={touched.maxStudents}
                    icon={FaUsers}
                    min="1"
                  />
                  <CustomTextField
                    id="fee"
                    name="fee"
                    type="number"
                    label="Class Fee (Rs.)"
                    value={values.fee}
                    onChange={handleChange}
                    error={errors.fee}
                    touched={touched.fee}
                    icon={FaMoneyBill}
                    min="0"
                  />
                  <CustomSelectField
                    id="status"
                    name="status"
                    label="Status *"
                    value={values.status}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Select Status' },
                      ...statusOptions
                    ]}
                    error={errors.status}
                    touched={touched.status}
                    required
                  />
                </div>
                {/* Payment Tracking (for all classes) */}
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name="paymentTracking"
                    checked={values.paymentTracking}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">
                    Enable Payment Tracking (First 7 days free)
                  </label>
                </div>
                {/* Zoom Link for online, hybrid, and other */}
                {(values.deliveryMethod === 'online' || values.deliveryMethod === 'hybrid' || values.deliveryMethod === 'other') && (
                  <div>
                    <div className="flex items-center gap-2">
                      <CustomTextField
                        id="zoomLink"
                        name="zoomLink"
                        type="url"
                        label={values.deliveryMethod === 'other' ? "Zoom Link (Optional)" : "Zoom Link"}
                        value={values.zoomLink}
                        onChange={handleChange}
                        error={errors.zoomLink}
                        touched={touched.zoomLink}
                        icon={FaVideo}
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
                    </div>
                    {zoomError && <div className="text-red-600 text-sm mt-1">{zoomError}</div>}
                  </div>
                )}
                {/* Course Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Course Type *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="courseType"
                        value="theory"
                        checked={values.courseType === 'theory'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">Theory</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="courseType"
                        value="revision"
                        checked={values.courseType === 'revision'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">Revision</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="courseType"
                        value="both"
                        checked={values.courseType === 'both'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">Theory + Revision</div>
                      </div>
                    </label>
                  </div>
                  {errors.courseType && touched.courseType && (
                    <div className="text-red-600 text-sm mt-1">{errors.courseType}</div>
                  )}
                </div>

                
                {/* Discount Options */}
                {values.courseType === 'both' && (
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <input
                      type="checkbox"
                      name="theoryRevisionDiscount"
                      checked={values.theoryRevisionDiscount}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label className="text-sm text-green-800 font-medium">
                      Apply Theory + Revision Discount
                    </label>
                  </div>
                )}
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter class description..."
                  />
                </div>
                {/* Form Actions */}
                <div className="flex justify-center">
                  <CustomButton
                    type="submit"
                    className="w-2/3 max-w-xs py-2 px-4 bg-[#1a365d] text-white hover:bg-[#13294b] active:bg-[#0f2038] rounded flex items-center justify-center gap-2"
                  >
                    {editingId ? <FaEdit /> : <FaPlus />} {editingId ? 'Update Class' : 'Create Class'}
                  </CustomButton>
                </div>
              </div>
            );
          }}
        </BasicForm>

        {/* Classes List */}
        <div className="border-t-2 pt-4">
          <h2 className="text-lg font-semibold mb-4">All Classes</h2>
          <BasicTable
            columns={[
              { key: 'className', label: 'Class Name' },
              { key: 'subject', label: 'Subject' },
              { key: 'teacher', label: 'Teacher' },
              { key: 'stream', label: 'Stream' },
              { key: 'deliveryMethod', label: 'Delivery' },
              { key: 'schedule', label: 'Schedule', render: row => `${formatDay(row.schedule.day)} ${formatTime(row.schedule.startTime)}-${formatTime(row.schedule.endTime)}` },
              { key: 'fee', label: 'Fee', render: row => `Rs. ${row.fee}` },
              { key: 'courseType', label: 'Course Type' },
              { key: 'status', label: 'Status', render: row => {
                if (row.status === 'active') return <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-semibold">Active</span>;
                if (row.status === 'inactive') return <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-semibold">Inactive</span>;
                if (row.status === 'archived') return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-semibold">Archived</span>;
                return row.status;
              } },
            ]}
            data={classes}
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
};

export default CreateClass; 