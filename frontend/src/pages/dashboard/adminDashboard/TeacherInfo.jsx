import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { FaUser, FaLock, FaPhone, FaIdCard } from 'react-icons/fa';
// import { Formik } from 'formik';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import CustomButton from '../../../components/CustomButton';
import { FaEdit, FaTrash, FaEnvelope,   FaBook } from 'react-icons/fa';
import BasicTable from '../../../components/BasicTable';
import BasicForm from '../../../components/BasicForm';
import CustomTextField from '../../../components/CustomTextField';
import CustomSelectField from '../../../components/CustomSelectField';
import BasicAlertBox from '../../../components/BasicAlertBox';
import { getAllTeachers, updateTeacher, deleteTeacher } from '../../../api/teachers';

// Dummy initial data (replace with API data in production)
const initialTeachers = [
  {
    teacherId: 'T001',
    designation: 'Mr.',
    name: 'John Doe',
    stream: 'A/L-Maths',
    email: 'john.doe@example.com',
    phone: '0771234567',
    password: '********',
  },
  {
    teacherId: 'T002',
    designation: 'Mrs.',
    name: 'Jane Smith',
    stream: 'O/L',
    email: 'jane.smith@example.com',
    phone: '0719876543',
    password: '********',
  },
];

const TeacherInfo = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTeacherId, setAlertTeacherId] = useState(null);
  // For save notification
  const [saveAlert, setSaveAlert] = useState({ open: false, message: '', onConfirm: null, confirmText: 'OK', type: 'success' });

  // Load teachers from backend
  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await getAllTeachers();
      if (response.success) {
        setTeachers(response.data || []);
      } else {
        console.error('Failed to load teachers:', response.message);
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  // Load teachers on component mount
  useEffect(() => {
    loadTeachers();
  }, []);

  // Only one set of delete/confirm/cancel functions
  const handleDelete = (teacherId) => {
    setAlertTeacherId(teacherId);
    setShowAlert(true);
  };
  
  const confirmDelete = async () => {
    try {
      const response = await deleteTeacher(alertTeacherId);
      if (response.success) {
        // Reload teachers from backend
        await loadTeachers();
        setSaveAlert({
          open: true,
          message: 'Teacher deleted successfully!',
          onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
          confirmText: 'OK',
          type: 'success'
        });
      } else {
        setSaveAlert({
          open: true,
          message: response.message || 'Failed to delete teacher',
          onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
          confirmText: 'OK',
          type: 'error'
        });
      }
    } catch (error) {
      setSaveAlert({
        open: true,
        message: 'Error deleting teacher. Please try again.',
        onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
        confirmText: 'OK',
        type: 'error'
      });
    }
    setShowAlert(false);
    setAlertTeacherId(null);
  };
  
  const cancelDelete = () => {
    setShowAlert(false);
    setAlertTeacherId(null);
  };

  // Handle edit
  const handleEdit = (teacher) => {
    setEditingTeacher(teacher.teacherId);
    setEditValues({ ...teacher });
    setShowEditModal(true);
  };

  // Validation schema for edit form
  const phoneRegex = /^0\d{9}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  const streamOptions = [
    'O/L',
    'A/L-Art',
    'A/L-Maths',
    'A/L-Science',
    'A/L-Commerce',
    'A/L-Technology',
    'Primary',
  ];
  const validationSchema = Yup.object().shape({
    teacherId: Yup.string().required('Teacher ID is required'),
    designation: Yup.string().required('Designation is required'),
    name: Yup.string().min(2, "Name must be at least 2 characters").required("Teacher's Name is required"),
    stream: Yup.string().oneOf(streamOptions, 'Invalid stream').required('Stream is required'),
    password: Yup.string()
      .matches(passwordRegex, 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character')
      .required('Password is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().matches(phoneRegex, 'Invalid phone number (should be 10 digits, start with 0)').required('Phone number is required'),
  });

  // Handle save (submit)
  const handleEditSubmit = async (values) => {
    try {
      const response = await updateTeacher(values.teacherId, values);
      if (response.success) {
        // Reload teachers from backend
        await loadTeachers();
        setEditingTeacher(null);
        setShowEditModal(false);
        setSaveAlert({
          open: true,
          message: 'Teacher details updated successfully!',
          onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
          confirmText: 'OK',
          type: 'success'
        });
      } else {
        setSaveAlert({
          open: true,
          message: response.message || 'Failed to update teacher',
          onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
          confirmText: 'OK',
          type: 'error'
        });
      }
    } catch (error) {
      setSaveAlert({
        open: true,
        message: 'Error updating teacher. Please try again.',
        onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
        confirmText: 'OK',
        type: 'error'
      });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditingTeacher(null);
    setEditValues({});
    setShowEditModal(false);
  };

  // Save to localStorage whenever teachers changes
  useEffect(() => {
    localStorage.setItem('teachers', JSON.stringify(teachers));
  }, [teachers]);

  return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Teachers Information</h1>
        <p className="mb-6 text-gray-700">View, edit and delete teacher details.</p>
        <BasicTable
          columns={[
            {
              key: 'teacherId',
              label: 'ID',
              render: (row) => (
                <span className="flex items-center gap-1"><FaIdCard className="inline mr-1 text-gray-500" />{row.teacherId}</span>
              ),
            },
            { key: 'designation', label: 'Designation' },
            {
              key: 'name',
              label: 'Name',
              render: (row) => (
                <span className="flex items-center gap-1"><FaUser className="inline mr-1 text-gray-500" />{row.name}</span>
              ),
            },
            { key: 'stream', label: 'Stream' },
            {
              key: 'email',
              label: 'Email',
              render: (row) => (
                <span className="flex items-center gap-1"><FaEnvelope className="inline mr-1 text-gray-500" />{row.email}</span>
              ),
            },
            {
              key: 'phone',
              label: 'Phone',
              render: (row) => (
                <span className="flex items-center gap-1"><FaPhone className="inline mr-1 text-gray-500" />{row.phone}</span>
              ),
            },
            {
              key: 'password',
              label: 'Password',
              render: () => '********',
            },
          ]}
          data={teachers}
          actions={(row) => (
            <div className="flex gap-2">
              <button className="text-blue-600 hover:underline" onClick={() => handleEdit(row)} title="Edit"><FaEdit /></button>
              <button className="text-red-600 hover:underline" onClick={() => handleDelete(row.teacherId)} title="Delete"><FaTrash /></button>
            </div>
          )}
          className="mb-6"
        />
  
        {/* BasicAlertBox for Delete Confirmation */}
        <BasicAlertBox
          open={showAlert}
          message={"Are you sure you want to delete this teacher?"}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
                onClick={handleCancel}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-semibold mb-4">Edit Teacher</h2>
              <BasicForm
                initialValues={editValues}
                validationSchema={validationSchema}
                onSubmit={handleEditSubmit}
              >
                {({ values, handleChange, errors, touched }) => (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomTextField
                      id="teacherId"
                      name="teacherId"
                      type="text"
                      label="Teacher ID *"
                      value={values.teacherId}
                      onChange={handleChange}
                      error={errors.teacherId}
                      touched={touched.teacherId}
                      disabled
                      icon={FaIdCard}
                    />
                    <CustomTextField
                      id="email"
                      name="email"
                      type="email"
                      label="Email *"
                      value={values.email}
                      onChange={handleChange}
                      error={errors.email}
                      touched={touched.email}
                      icon={FaEnvelope}
                    />
                    <CustomSelectField
                          id="designation"
                          name="designation"
                          label="Designation"
                          value={values.designation}
                          onChange={handleChange}
                          options={[
                            { value: '', label: 'Select Designation' },
                            { value: 'Mr.', label: 'Mr.' },
                            { value: 'Mrs.', label: 'Mrs.' },
                            { value: 'Miss', label: 'Miss' },
                            { value: 'Ven.', label: 'Ven.' },
                            { value: 'Dr', label: 'Dr' },
                            { value: 'Prof', label: 'Prof' }
                          ]}
                          error={errors.designation}
                          touched={touched.designation}
                          required
                          icon={FaIdCard}
                    />
                     <CustomTextField
                          id="name"
                          name="name"
                          type="text"
                          label="Teacher's Name *"
                          value={values.name}
                          onChange={handleChange}
                          error={errors.name}
                          touched={touched.name}
                          icon={FaUser}
                    />
                    <CustomTextField
                      id="password"
                      name="password"
                      type="password"
                      label="Password *"
                      value={values.password}
                      onChange={handleChange}
                      error={errors.password}
                      touched={touched.password}
                      isPassword
                      icon={FaLock}
                    />
                    <CustomTextField
                      id="phone"
                      name="phone"
                      type="text"
                      label="Phone Number *"
                      value={values.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      touched={touched.phone}
                      icon={FaPhone}
                    />
                     <CustomSelectField
                      id="stream"
                      name="stream"
                      label="Stream"
                      value={values.stream}
                      onChange={handleChange}
                      options={[
                        { value: '', label: 'Select Stream' },
                        ...streamOptions.map(s => ({ value: s, label: s }))
                      ]}
                      error={errors.stream}
                      touched={touched.stream}
                      required
                      icon={FaBook}
                    />
                  </div>
                )}
              </BasicForm>

              <div className="flex flex-row gap-4 mt-6 mb-2">
                <CustomButton
                  type="button"
                  onClick={handleCancel}
                  className="w-1/2 py-2.5 px-4 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 shadow-md hover:shadow-xl"
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  type="submit"
                  form="edit-teacher-form"
                  className="w-1/2 py-2.5 px-4 bg-[#1a365d] text-white text-xs font-bold rounded-lg hover:bg-[#13294b] active:bg-[#0f2038] focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:ring-opacity-50 shadow-md hover:shadow-xl"
                  onClick={() => { document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }}
                >
                  Save
                </CustomButton>
              </div>
            </div>
          </div>
        )}

        {/* Save Success Alert */}
        <BasicAlertBox
          open={saveAlert.open}
          message={saveAlert.message}
          onConfirm={saveAlert.onConfirm}
          confirmText={saveAlert.confirmText}
          type={saveAlert.type}
        />
      </div>
  );
};

export default TeacherInfo;
