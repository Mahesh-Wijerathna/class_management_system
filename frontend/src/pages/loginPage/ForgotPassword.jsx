import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as Yup from 'yup';
import CustomTextField from '../../components/CustomTextField';
import CustomButton from '../../components/CustomButton';
import BasicForm from '../../components/BasicForm';
import { FaPhone, FaLock, FaGraduationCap, FaKey } from 'react-icons/fa';
import { sendOtp, forgotPasswordReset } from '../../api/auth';

const mobileSchema = Yup.object().shape({
  mobile: Yup.string()
    .required('Mobile number is required')
    .matches(/^0[1-9][0-9]{8}$/, 'Please enter a valid Sri Lankan mobile number (e.g., 0712345678)'),
});

const otpSchema = Yup.object().shape({
  otp: Yup.string()
    .required('OTP is required')
    .matches(/^[0-9]{6}$/, 'OTP must be 6 digits'),
  password: Yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .matches(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .matches(/^(?=.*\d)/, 'Password must contain at least one number')
    .matches(/^(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords do not match')
    .required('Confirm password is required'),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (values) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Sending OTP for mobile:', values.mobile);
      const response = await sendOtp(values.mobile);
      console.log('OTP response:', response);
      
      if (response.success) {
        setMobile(values.mobile);
        setSuccess('OTP sent successfully! Check your phone for the code.');
        setStep(2);
        // For testing purposes, show OTP in console
        console.log('OTP for testing:', response.otp);
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP send error:', error);
      setError(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (values) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Resetting password for mobile:', mobile, 'OTP:', values.otp);
      const response = await forgotPasswordReset(mobile, values.otp, values.password);
      console.log('Reset response:', response);
      
      if (response.success) {
        setSuccess('Password reset successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
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
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
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
                    label="Mobile Number *"
                    value={values.mobile}
                    onChange={handleChange}
                    error={errors.mobile}
                    touched={touched.mobile}
                    icon={FaPhone}
                    placeholder="e.g., 0712345678"
                  />
                  <CustomButton type="submit" disabled={loading}>
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </CustomButton>
                  
                  {/* Test button for debugging */}
                  <CustomButton 
                    type="button" 
                    onClick={async () => {
                      try {
                        console.log('Testing API call...');
                        const response = await sendOtp('0710901846');
                        console.log('Test response:', response);
                        alert(`Test successful! OTP: ${response.otp}`);
                      } catch (error) {
                        console.error('Test error:', error);
                        alert(`Test failed: ${error.message}`);
                      }
                    }}
                    className="mt-2 bg-blue-500 hover:bg-blue-600"
                  >
                    Test API (Debug)
                  </CustomButton>
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
                  <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
                    OTP sent to: {mobile}
                  </div>
                  <CustomTextField
                    id="otp"
                    name="otp"
                    type="text"
                    label="OTP *"
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
                    label="New Password *"
                    value={values.password}
                    onChange={handleChange}
                    error={errors.password}
                    touched={touched.password}
                    isPassword
                    icon={FaLock}
                  />
                  
                  {/* Password Requirements */}
                  <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 border border-blue-200">
                    <p className="font-semibold mb-1">Password Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>At least 8 characters long</li>
                      <li>At least one lowercase letter (a-z)</li>
                      <li>At least one uppercase letter (A-Z)</li>
                      <li>At least one number (0-9)</li>
                      <li>At least one special character (@$!%*?&)</li>
                    </ul>
                  </div>
                  
                  <CustomTextField
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    label="Confirm New Password *"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    touched={touched.confirmPassword}
                    isPassword
                    icon={FaLock}
                  />
                  <CustomButton type="submit" disabled={loading}>
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                  </CustomButton>
                  
                  <CustomButton 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="mt-2 bg-gray-500 hover:bg-gray-600"
                  >
                    Back to Mobile Number
                  </CustomButton>
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