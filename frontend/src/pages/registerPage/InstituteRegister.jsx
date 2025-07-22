import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as Yup from 'yup';
import CustomTextField from '../../components/CustomTextField';
import CustomButton from '../../components/CustomButton';
import { Formik } from 'formik';
import { FaUser, FaLock, FaPhone, FaGraduationCap } from 'react-icons/fa';

const phoneRegex = /^0\d{9}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const userIdRegex = /^[A-Za-z0-9_-]{3,20}$/;

const validationSchema = Yup.object().shape({
  userId: Yup.string()
    .matches(userIdRegex, 'User ID must be 3-20 characters, letters, numbers, - or _')
    .required('User ID is required'),
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

export default function InstituteRegister() {
  const navigate = useNavigate();

  const initialValues = {
    userId: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  };

  const handleSubmit = (values) => {
    // TODO: Connect to backend
    alert('Registered!');
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
            Institute Student Registration
          </span>
        </div>
        <div className="w-full max-w-md">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            validateOnMount={true}
            onSubmit={(values, { setSubmitting, setTouched, validateForm }) => {
              validateForm().then(errors => {
                if (Object.keys(errors).length > 0) {
                  const firstErrorField = Object.keys(errors)[0];
                  const el = document.getElementsByName(firstErrorField)[0];
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTouched({ userId: true, mobile: true, password: true, confirmPassword: true });
                  setSubmitting(false);
                } else {
                  handleSubmit(values);
                }
              });
            }}
          >
            {({ errors, touched, handleChange, values, handleSubmit, isSubmitting, submitCount }) => (
              <form className='flex flex-col w-full space-y-4' onSubmit={handleSubmit}>
                {submitCount > 0 && Object.keys(errors).length > 0 && (
                  <div className='bg-red-100 text-red-700 p-2 rounded mb-2 text-xs font-semibold'>
                    Please fix the errors below before continuing.
                  </div>
                )}
                <CustomTextField
                  id="userId"
                  name="userId"
                  type="text"
                  label="User ID *"
                  value={values.userId}
                  onChange={handleChange}
                  error={errors.userId}
                  touched={touched.userId}
                  icon={FaUser}
                  hasError={!!errors.userId}
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
                  hasError={!!errors.mobile}
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
                  hasError={!!errors.password}
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
                  hasError={!!errors.confirmPassword}
                />
                <div className="flex gap-4 mt-2">
                  <CustomButton type="button" onClick={() => navigate(-1)}>
                    Back
                  </CustomButton>
                  <CustomButton type="submit" disabled={isSubmitting}>
                    Register
                  </CustomButton>
                </div>
              </form>
            )}
          </Formik>
          <Link to="/login" className="mt-8 text-[#064e3b] hover:underline text-xs block text-center">Already registered?</Link>
        </div>
      </div>
    </div>
  );
} 