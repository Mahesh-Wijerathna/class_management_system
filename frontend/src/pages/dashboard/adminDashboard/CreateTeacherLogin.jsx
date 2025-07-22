import React from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import CustomTextField from '../../../components/CustomTextField';
import CustomButton from '../../../components/CustomButton';
import CustomSelectField from '../../../components/CustomSelectField';
import BasicForm from '../../../components/BasicForm';
import adminSidebarSections from '././AdminDashboardSidebar';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { FaUser, FaLock, FaPhone, FaIdCard, FaChalkboardTeacher, FaEnvelope } from 'react-icons/fa';

const streamOptions = [
  'O/L',
  'A/L-Art',
  'A/L-Maths',
  'A/L-Science',
  'A/L-Commerce',
  'A/L-Technology',
  'Primary',
];

const phoneRegex = /^0\d{9}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

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

const initialValues = {
  teacherId: '',
  designation: '',
  name: '',
  stream: '',
  password: '',
  email: '',
  phone: '',
};

const CreateTeacherLogin = () => {
  const navigate = useNavigate();
  const [submitCount, setSubmitCount] = React.useState(0);

  const handleSubmit = (values) => {
    // TODO: Connect to backend or API
    alert('Teacher account created!');
    navigate(-1);
  };

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="w-full max-w-5xl mx-auto bg-white p-8 rounded-lg shadow mt-10">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Teacher Login</h2>
        <BasicForm
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, handleChange, values }) => (
            <>
              {submitCount > 0 && Object.keys(errors).length > 0 && (
                <div className='bg-red-100 text-red-700 p-2 rounded mb-2 text-xs font-semibold'>
                  Please fix the errors below before continuing.
                </div>
              )}
          {/* Responsive grid for two columns on md+ screens */}
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

            <CustomSelectField
              id="designation"
              name="designation"
              label="Designation"
              value={values.designation}
              onChange={handleChange}
              options={[{ value: '', label: 'Select Designation' },
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

            <CustomSelectField
              id="stream"
              name="stream"
              label="Stream"
              value={values.stream}
              onChange={handleChange}
              options={[{ value: '', label: 'Select Stream' }, ...streamOptions.map(s => ({ value: s, label: s }))]}
              error={errors.stream}
              touched={touched.stream}
              required
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
          </div>
          {/* Horizontal line between buttons */}
          <hr className="my-6 border-t border-gray-300" />
          <div className="flex flex-row gap-4 mt-0 mb-2">
            <CustomButton
              type="button"
              onClick={() => navigate(-1)}
              className="w-1/2 py-2.5 px-4 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 shadow-md hover:shadow-xl"
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              onClick={() => setSubmitCount((c) => c + 1)}
              className="w-1/2 py-2.5 px-4 bg-[#1a365d] text-white text-xs font-bold rounded-lg hover:bg-[#13294b] active:bg-[#0f2038] focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:ring-opacity-50 shadow-md hover:shadow-xl"
            >
              Create
            </CustomButton>
          </div>
            </>
          )}
        </BasicForm>
      </div>
    </DashboardLayout>
  );
};

export default CreateTeacherLogin; 