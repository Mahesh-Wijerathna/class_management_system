import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as Yup from 'yup';
import CustomTextField from '../../components/CustomTextField';
import CustomButton from '../../components/CustomButton';
import BasicForm from '../../components/BasicForm';
import { FaPhone, FaLock, FaGraduationCap, FaKey } from 'react-icons/fa';

const mobileSchema = Yup.object().shape({
  mobile: Yup.number().required('Required'),
});

const otpSchema = Yup.object().shape({
  otp: Yup.string().required('Required'),
  password: Yup.string().required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords do not match')
    .required('Required'),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');

  const handleSendOtp = (values) => {
    setMobile(values.mobile);
    // TODO: Send OTP to backend
    setStep(2);
  };

  const handleReset = (values) => {
    // TODO: Reset password via backend
    alert('Password reset successful!');
    navigate('/login');
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
            Forgot Password
          </span>
        </div>
        <div className="w-full max-w-md">
          {step === 1 && (
            <BasicForm
              initialValues={{ mobile: '' }}
              validationSchema={mobileSchema}
              onSubmit={handleSendOtp}
            >
              {({ errors, touched, handleChange, values }) => (
                <>
                  <CustomTextField
                    id="mobile"
                    name="mobile"
                    type="text"
                    label="Mobile Number"
                    value={values.mobile}
                    onChange={handleChange}
                    error={errors.mobile}
                    touched={touched.mobile}
                    icon={FaPhone}
                  />
                  <CustomButton type="submit">Send OTP</CustomButton>
                </>
              )}
            </BasicForm>
          )}
          {step === 2 && (
            <BasicForm
              initialValues={{ otp: '', password: '', confirmPassword: '' }}
              validationSchema={otpSchema}
              onSubmit={handleReset}
            >
              {({ errors, touched, handleChange, values }) => (
                <>
                  <CustomTextField
                    id="otp"
                    name="otp"
                    type="text"
                    label="OTP"
                    value={values.otp}
                    onChange={handleChange}
                    error={errors.otp}
                    touched={touched.otp}
                    icon={FaKey}
                  />
                  <CustomTextField
                    id="password"
                    name="password"
                    type="password"
                    label="New Password"
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
                    label="Confirm New Password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    touched={touched.confirmPassword}
                    isPassword
                    icon={FaLock}
                  />
                  <CustomButton type="submit">Reset Password</CustomButton>
                </>
              )}
            </BasicForm>
          )}
          <Link to="/login" className="mt-8 text-[#064e3b] hover:underline text-xs block text-center">Back to login</Link>
        </div>
      </div>
    </div>
  );
} 