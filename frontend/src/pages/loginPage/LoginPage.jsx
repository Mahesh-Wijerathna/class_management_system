import React, { useState } from 'react'
import * as Yup from "yup"
import { FaUser, FaLock, FaEye, FaEyeSlash, FaGraduationCap } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import BasicForm from '../../components/BasicForm'
import CustomTextField from '../../components/CustomTextField'
import CustomButton from '../../components/CustomButton'
import { login } from '../../api/auth'

export default function LoginPage() {
  
  const [rememberMe, setRememberMe] = useState(false)
  const [backendError, setBackendError] = useState("");
  const navigate = useNavigate();

  const LoginSchema = Yup.object().shape({
    userID: Yup.string()
      .required("Student ID is required")
      .min(3, "Student ID must be at least 3 characters"),
    password: Yup.string()
      .notRequired()
  })

  const handleLogin = async (values) => {
    setBackendError("");
    
    // Store remember me preference in localStorage if checked
    if (rememberMe) {
      localStorage.setItem('rememberedUser', values.userID)
    } else {
      localStorage.removeItem('rememberedUser')
    }

    try {
      // First try to authenticate with backend
      const data = await login({ userID: values.userID, password: values.password });
      console.log("Backend login successful:", data);
      // Navigate to appropriate dashboard based on user role
      // navigate('/dashboard');
    } catch (error) {
      // If backend login fails, try localStorage authentication for students
      console.log("Backend login failed, trying localStorage authentication...");
      
      // Get students from localStorage
      const students = JSON.parse(localStorage.getItem('students')) || [];
      
      // Find student by Student ID only
      const student = students.find(s => 
        s.studentId === values.userID
      );
      
      if (student) {
        console.log("Student login successful:", student);
        // Store student info in session
        localStorage.setItem('currentStudent', JSON.stringify(student));
        // Navigate to student dashboard
        navigate('/studentdashboard');
      } else {
        // Both backend and localStorage authentication failed
        setBackendError("Invalid Student ID. Please check your Student ID.");
      }
    }
  }

  // Check for remembered user on component mount
  React.useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser')
    if (rememberedUser) {
      setRememberMe(true)
    }
  }, [])

  return (
    <div className='w-full flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      <div className='max-w-md w-full flex flex-col p-8 items-center'>
        <div className='app-log flex flex-col justify-center items-center mb-8'>
          <div className='w-12 h-12 rounded-full bg-[#3da58a] flex items-center justify-center mb-3 shadow-xl backdrop-blur-sm'>
            <FaGraduationCap className='text-white text-2xl' />
          </div>
          <span className='text-2xl font-bold text-[#1a365d] mb-1'>
            TCMS
          </span>
          <span className='text-sm text-[#1a365d] font-medium'>
            Please Login to Continue
          </span>
        </div>
        <BasicForm
          initialValues={{
            userID: localStorage.getItem('rememberedUser') || "",
            password: "" 
          }} 
          validationSchema={LoginSchema}
          onSubmit={handleLogin}
      >
          {({ errors, touched, handleChange, values }) => (
            <>
              <CustomTextField
                id='userID'
                name='userID'
              type='text'
                label='Student ID *'
              value={values.userID}
                onChange={handleChange}
                error={errors.userID}
                touched={touched.userID}
                icon={FaUser}
              />

              <CustomTextField
                id='password'
                name='password'
                type='password'
                label='Password (Optional)'
                value={values.password}
                onChange={handleChange}
                error={errors.password}
                touched={touched.password}
                icon={FaLock}
                isPassword
              />
               <div className='flex items-center justify-between'>
                <label className='flex items-center space-x-2 cursor-pointer'>
            <input
                    type='checkbox'
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className='form-checkbox h-3.5 w-3.5 text-[#064e3b] rounded border-gray-300 focus:ring-[#064e3b]'
                  />
                  <span className='text-[#1a365d] text-[10px]'>Remember me</span>
                </label>
                <button
                  type='button'
                  onClick={() => navigate('/forgotpassword')}
                  className='text-xs text-[#064e3b] hover:underline transition-colors duration-200 underline'
                >
                  Forgot password?
                </button>
              </div>

              <CustomButton type='submit'>Sign In</CustomButton>

              <div className='flex flex-col items-center mt-6 space-y-3 text-xs text-[#1a365d]'>
                
                <div className='flex space-x-4'>
                   
                </div>
                <Link to="/register" className='text-[#064e3b] hover:underline'>New Student? Register Here</Link>
              </div>
            </>
        )}
        </BasicForm>
      </div> 
    </div>
  )
}
