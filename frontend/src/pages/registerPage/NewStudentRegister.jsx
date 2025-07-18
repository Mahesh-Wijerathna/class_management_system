import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as Yup from 'yup';
import CustomTextField from '../../components/CustomTextField';
import CustomButton from '../../components/CustomButton';
import BasicForm from '../../components/BasicForm';
import { FaUser, FaLock, FaPhone, FaCalendarAlt } from 'react-icons/fa';
import { FaGraduationCap } from 'react-icons/fa';

const validationSchema = Yup.object().shape({
  firstName: Yup.string().required('Required'),
  lastName: Yup.string().required('Required'),
  dob: Yup.string().required('Required'),
  gender: Yup.string().required('Required'),
  mobile: Yup.string().required('Required'),
  password: Yup.string().required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords do not match')
    .required('Required'),
});

export default function NewStudentRegister() {
  const navigate = useNavigate();

  const initialValues = {
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
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
            New Student Registration
          </span>
        </div>
        <div className="w-full max-w-md">
          
          <BasicForm
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
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
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#1a365d]">Gender *</label>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-1 text-xs">
                      <input type="radio" name="gender" value="male" checked={values.gender === 'male'} onChange={handleChange} /> Male
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      <input type="radio" name="gender" value="female" checked={values.gender === 'female'} onChange={handleChange} /> Female
                    </label>
                  </div>
                  {errors.gender && touched.gender && <span className='text-red-500 text-[10px] mt-1'>{errors.gender}</span>}
                </div>
                <div className="flex gap-4 mt-2">
                  <CustomButton type="button" onClick={() => navigate(-1)}>
                    Back
                  </CustomButton>
                  <CustomButton type="submit">
                    Register
                  </CustomButton>
                </div>
              </>
            )}
          </BasicForm>
          <Link to="/login" className="mt-8 text-[#064e3b] hover:underline text-xs block text-center">Already registered?</Link>
        </div>
      </div>
    </div>
  );
} 