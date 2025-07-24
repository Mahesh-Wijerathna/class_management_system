import React, { useState } from 'react';
import * as Yup from 'yup';
import { FaUser, FaLock, FaPhone, FaIdCard, FaCalendarAlt, FaVenusMars, FaGraduationCap } from 'react-icons/fa';
import { Formik } from 'formik';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import CustomButton from '../../../components/CustomButton';
import { FaEdit, FaTrash, FaEnvelope,   FaBook } from 'react-icons/fa';
import BasicTable from '../../../components/BasicTable';
import BasicForm from '../../../components/BasicForm';
import CustomTextField from '../../../components/CustomTextField';
import CustomSelectField from '../../../components/CustomSelectField';
import BasicAlertBox from '../../../components/BasicAlertBox';

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

// Helper to parse NIC (Sri Lankan)
function parseNIC(nic) {
  let year, month, day, gender;
  let nicStr = nic.toString().toUpperCase();
  if (/^\d{9}[VX]$/.test(nicStr)) {
    year = '19' + nicStr.substring(0, 2);
    let days = parseInt(nicStr.substring(2, 5), 10);
    gender = days > 500 ? 'Female' : 'Male';
    if (days > 500) days -= 500;
    const months = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let m = 0;
    while (days > months[m]) {
      days -= months[m];
      m++;
    }
    month = (m + 1).toString().padStart(2, '0');
    day = days.toString().padStart(2, '0');
  } else if (/^\d{12}$/.test(nicStr)) {
    year = nicStr.substring(0, 4);
    let days = parseInt(nicStr.substring(4, 7), 10);
    gender = days > 500 ? 'Female' : 'Male';
    if (days > 500) days -= 500;
    const months = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let m = 0;
    while (days > months[m]) {
      days -= months[m];
      m++;
    }
    month = (m + 1).toString().padStart(2, '0');
    day = days.toString().padStart(2, '0');
  } else {
    return null;
  }
  const dob = `${year}-${month}-${day}`;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const mm = today.getMonth() - birthDate.getMonth();
  if (mm < 0 || (mm === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return { dob, gender, age };
}

const nicRegex = /^(\d{12}|\d{9}[VXvx])$/;
const phoneRegex = /^0\d{9}$/;
const genderRegex = /^(male|female)$/i;
const nameRegex = /^[A-Za-z ]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const allowedStreams = ['AL-Maths', 'AL-Science', 'AL-Art', 'AL-Tech', 'AL-Common', 'OL', 'Primary'];
const allowedDistricts = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota',
  'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale',
  'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura',
  'Trincomalee', 'Vavuniya'
];
const sriLankaDistricts = [...allowedDistricts];
const streams = [...allowedStreams];

function PhysicalStudentRegisterForm() {
  const [step, setStep] = useState(1);
  const [summaryValues, setSummaryValues] = useState({});
  const [nicInfo, setNicInfo] = useState(null);
  const [step1Values, setStep1Values] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });
  const [manualFields, setManualFields] = useState({
    dob: '',
    age: '',
    gender: '',
    email: '',
    school: '',
    stream: '',
    address: '',
    district: '',
    parentName: '',
    parentMobile: '',
  });

  const step1Schema = Yup.object().shape({
    firstName: Yup.string()
      .matches(nameRegex, 'First name should only contain letters')
      .min(2, 'First name must be at least 2 characters')
      .required('First name is required'),
    lastName: Yup.string()
      .matches(nameRegex, 'Last name should only contain letters')
      .min(2, 'Last name must be at least 2 characters')
      .required('Last name is required'),
    idNumber: Yup.string()
      .matches(nicRegex, 'Invalid NIC format (e.g., 199985012023 or 981360737V)')
      .notRequired()
      .nullable(),
    mobile: Yup.string()
      .matches(phoneRegex, 'Invalid phone number (should be 10 digits, start with 0)')
      .required('Mobile number is required'),
    password: Yup.string()
      .matches(passwordRegex, 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords do not match')
      .required('Confirm password is required'),
  });

  const handleStep1 = (values) => {
    setStep1Values(values);
    if (values.idNumber && nicRegex.test(values.idNumber)) {
      const parsed = parseNIC(values.idNumber);
      if (parsed) {
        setNicInfo(parsed);
        setManualFields(parsed);
      } else {
        setNicInfo(null);
        setManualFields({ dob: '', age: '', gender: '', email: '', school: '', stream: '', address: '', district: '', parentName: '', parentMobile: '' });
      }
    } else {
      setNicInfo(null);
      setManualFields({ dob: '', age: '', gender: '', email: '', school: '', stream: '', address: '', district: '', parentName: '', parentMobile: '' });
    }
    setStep(2);
  };

  const handleStep2 = (values) => {
    setSummaryValues({ ...step1Values, ...values });
    setStep(3);
  };

  const handleRegister = () => {
    alert('Registered! ' + JSON.stringify(summaryValues, null, 2));
  };

  return (
    <div className="w-full flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className='max-w-md w-full flex flex-col p-8 items-center'>
        <div className='app-log flex flex-col justify-center items-center mb-8'>
          <div className='w-12 h-12 rounded-full bg-[#3da58a] flex items-center justify-center mb-3 shadow-xl backdrop-blur-sm'>
            <FaGraduationCap className='text-white text-2xl' />
          </div>
          <span className='text-2xl font-bold text-[#1a365d] mb-1'>
            TCMS
          </span>
          <span className='text-sm text-[#1a365d] font-medium'>
            Physical Student Registration
          </span>
        </div>
        <div className="w-full max-w-md">
          {step === 1 && (
            <BasicForm
              initialValues={step1Values}
              validationSchema={step1Schema}
              onSubmit={handleStep1}
            >
              {({ errors, touched, handleChange, values }) => (
                <>
                  <CustomTextField
                    id="firstName"
                    name="firstName"
                    type="text"
                    label="First Name *"
                    value={values.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                    touched={touched.firstName}
                    icon={FaUser}
                  />
                  <CustomTextField
                    id="lastName"
                    name="lastName"
                    type="text"
                    label="Last Name *"
                    value={values.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                    touched={touched.lastName}
                    icon={FaUser}
                  />
                  <CustomTextField
                    id="idNumber"
                    name="idNumber"
                    type="text"
                    label="Student ID Number If Available"
                    value={values.idNumber}
                    onChange={handleChange}
                    error={errors.idNumber}
                    touched={touched.idNumber}
                    icon={FaIdCard}
                  />
                  <CustomTextField
                    id="mobile"
                    name="mobile"
                    type="text"
                    label="Mobile *"
                    value={values.mobile}
                    onChange={handleChange}
                    error={errors.mobile}
                    touched={touched.mobile}
                    icon={FaPhone}
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
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    label="Confirm Password *"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    touched={touched.confirmPassword}
                    isPassword
                    icon={FaLock}
                  />
                  <div className="flex gap-4 mt-2">
                    <CustomButton type="button" onClick={() => setStep(1)}>
                      Back
                    </CustomButton>
                    <CustomButton type="submit">
                      Next
                    </CustomButton>
                  </div>
                </>
              )}
            </BasicForm>
          )}
          {step === 2 && (
            <Formik
              initialValues={manualFields}
              validationSchema={Yup.object().shape({
                dob: Yup.date()
                  .max(new Date(), 'Date of birth cannot be in the future')
                  .required('Date of birth is required'),
                age: Yup.number()
                  .min(5, 'Age must be at least 5')
                  .max(100, 'Age must be less than 100')
                  .required('Age is required'),
                gender: Yup.string()
                  .matches(genderRegex, 'Gender must be Male or Female')
                  .required('Gender is required'),
                email: Yup.string().email('Invalid email'),
                school: Yup.string().min(2, 'School name must be at least 2 characters').required('School is required'),
                stream: Yup.string().oneOf(allowedStreams, 'Invalid stream').required('Stream is required'),
                address: Yup.string().min(5, 'Address must be at least 5 characters').required('Address is required'),
                district: Yup.string().oneOf(allowedDistricts, 'Invalid district').required('District is required'),
                parentName: Yup.string().min(2, 'Parent name must be at least 2 characters').required('Parent name is required'),
                parentMobile: Yup.string()
                  .matches(phoneRegex, 'Invalid phone number (should be 10 digits, start with 0)')
                  .required('Parent mobile number is required'),
              })}
              validateOnMount={false}
              onSubmit={(values, { setSubmitting, setTouched, setErrors, validateForm }) => {
                validateForm().then(errors => {
                  if (Object.keys(errors).length > 0) {
                    alert('Please enter all required values.');
                    setTouched({
                      dob: true, age: true, gender: true, email: true, school: true, stream: true, address: true, district: true, parentName: true, parentMobile: true
                    });
                    setSubmitting(false);
                  } else {
                    handleStep2(values);
                  }
                });
              }}
            >
              {({ errors, touched, handleChange, values, handleSubmit, isSubmitting, submitCount }) => (
                <form className='flex flex-col w-full space-y-4' onSubmit={e => {
                  handleSubmit(e);
                  if (Object.keys(errors).length > 0) {
                    const firstErrorField = Object.keys(errors)[0];
                    const el = document.getElementsByName(firstErrorField)[0];
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}>
                  {submitCount > 0 && Object.keys(errors).length > 0 && (
                    <div className='bg-red-100 text-red-700 p-2 rounded mb-2 text-xs font-semibold'>
                      Please fix the errors below before continuing.
                    </div>
                  )}
                  <CustomTextField
                    id="dob"
                    name="dob"
                    type="date"
                    label="Date of Birth *"
                    value={values.dob}
                    onChange={handleChange}
                    error={errors.dob}
                    touched={touched.dob}
                    icon={FaCalendarAlt}
                  />
                  <CustomTextField
                    id="age"
                    name="age"
                    type="number"
                    label="Age *"
                    value={values.age}
                    onChange={handleChange}
                    error={errors.age}
                    touched={touched.age}
                    icon={FaCalendarAlt}
                  />
                  <CustomTextField
                    id="gender"
                    name="gender"
                    type="text"
                    label="Gender *"
                    value={values.gender}
                    onChange={handleChange}
                    error={errors.gender}
                    touched={touched.gender}
                    icon={FaVenusMars}
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
                    icon={FaUser}
                  />
                  <CustomTextField
                    id="school"
                    name="school"
                    type="text"
                    label="School *"
                    value={values.school}
                    onChange={handleChange}
                    error={errors.school}
                    touched={touched.school}
                    icon={FaUser}
                  />
                  <div className="flex flex-col mb-2">
                    <label htmlFor="stream" className="text-xs font-medium text-[#1a365d] mb-1">Stream *</label>
                    <select
                      id="stream"
                      name="stream"
                      value={values.stream}
                      onChange={handleChange}
                      className="border-2 border-[#1a365d] rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                    >
                      <option value="">Select Stream</option>
                      {streams.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.stream && <span className='text-red-500 text-[10px] mt-1'>{errors.stream}</span>}
                  </div>
                  <CustomTextField
                    id="address"
                    name="address"
                    type="text"
                    label="Address *"
                    value={values.address}
                    onChange={handleChange}
                    error={errors.address}
                    touched={touched.address}
                    icon={FaUser}
                  />
                  <div className="flex flex-col mb-2">
                    <label htmlFor="district" className="text-xs font-medium text-[#1a365d] mb-1">District *</label>
                    <select
                      id="district"
                      name="district"
                      value={values.district}
                      onChange={handleChange}
                      className="border-2 border-[#1a365d] rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                    >
                      <option value="">Select District</option>
                      {sriLankaDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {errors.district && <span className='text-red-500 text-[10px] mt-1'>{errors.district}</span>}
                  </div>
                  <CustomTextField
                    id="parentName"
                    name="parentName"
                    type="text"
                    label="Parent Name *"
                    value={values.parentName}
                    onChange={handleChange}
                    error={errors.parentName}
                    touched={touched.parentName}
                    icon={FaUser}
                  />
                  <CustomTextField
                    id="parentMobile"
                    name="parentMobile"
                    type="text"
                    label="Parent Mobile Number *"
                    value={values.parentMobile}
                    onChange={handleChange}
                    error={errors.parentMobile}
                    touched={touched.parentMobile}
                    icon={FaPhone}
                  />
                  <div className="flex gap-4 mt-2">
                    <CustomButton type="button" onClick={() => setStep(1)}>
                      Back
                    </CustomButton>
                    <CustomButton type="submit" disabled={isSubmitting}>
                      Next
                    </CustomButton>
                  </div>
                </form>
              )}
            </Formik>
          )}
          {step === 3 && (
            <div className="flex flex-col w-full space-y-4">
              <h2 className="text-lg font-bold text-[#1a365d] mb-2">Review Your Details</h2>
              <CustomTextField label="First Name" value={summaryValues.firstName} readOnly icon={FaUser} />
              <CustomTextField label="Last Name" value={summaryValues.lastName} readOnly icon={FaUser} />
              <CustomTextField label="ID Number" value={summaryValues.idNumber} readOnly icon={FaIdCard} />
              <CustomTextField label="Mobile" value={summaryValues.mobile} readOnly icon={FaPhone} />
              <CustomTextField label="Date of Birth" value={summaryValues.dob} readOnly icon={FaCalendarAlt} />
              <CustomTextField label="Age" value={summaryValues.age} readOnly icon={FaCalendarAlt} />
              <CustomTextField label="Gender" value={summaryValues.gender} readOnly icon={FaVenusMars} />
              <CustomTextField label="Email" value={summaryValues.email} readOnly icon={FaUser} />
              <CustomTextField label="School" value={summaryValues.school} readOnly icon={FaUser} />
              <CustomTextField label="Stream" value={summaryValues.stream} readOnly icon={FaUser} />
              <CustomTextField label="Address" value={summaryValues.address} readOnly icon={FaUser} />
              <CustomTextField label="District" value={summaryValues.district} readOnly icon={FaUser} />
              <CustomTextField label="Parent Name" value={summaryValues.parentName} readOnly icon={FaUser} />
              <CustomTextField label="Parent Mobile Number" value={summaryValues.parentMobile} readOnly icon={FaPhone} />
              <div className="flex gap-4 mt-2">
                <CustomButton type="button" onClick={() => setStep(2)}>
                  Back
                </CustomButton>
                <CustomButton type="button" onClick={handleRegister}>
                  Register
                </CustomButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const TeacherInfo = () => {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTeacherId, setAlertTeacherId] = useState(null);
  // For save notification
  const [saveAlert, setSaveAlert] = useState({ open: false, message: '', onConfirm: null, confirmText: 'OK', type: 'success' });

  // Only one set of delete/confirm/cancel functions
  const handleDelete = (teacherId) => {
    setAlertTeacherId(teacherId);
    setShowAlert(true);
  };
  const confirmDelete = () => {
    setTeachers(teachers.filter(t => t.teacherId !== alertTeacherId));
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
  const handleEditSubmit = (values) => {
    setTeachers(teachers.map(t => t.teacherId === values.teacherId ? values : t));
    setEditingTeacher(null);
    setShowEditModal(false);
    setSaveAlert({
      open: true,
      message: 'Teacher details saved successfully!',
      onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
      confirmText: 'OK',
      type: 'success',
    });
  };

  // Handle cancel
  const handleCancel = () => {
    setEditingTeacher(null);
    setEditValues({});
    setShowEditModal(false);
  };

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
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
    </DashboardLayout>
  );
};

export default TeacherInfo;
