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
      .required("User ID is required")
      .min(3, "User ID must be at least 3 characters")
      .max(20, "User ID must not exceed 20 characters"),
    password: Yup.string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      )           
  })

  const handleLogin = async (values) => {
    setBackendError("");
    
    // Store remember me preference
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberedUser', values.userID);
      // Use sessionStorage for tokens when remember me is false
      sessionStorage.setItem('usePersistentStorage', 'true');
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedUser');
      sessionStorage.removeItem('usePersistentStorage');
    }

    try {
      console.log("Attempting login with:", { userid: values.userID, password: values.password });
      const data = await login({ userid: values.userID, password: values.password });
      
      // Check if login was successful
      if (data.success) {
        // Handle successful login
      console.log("Login successful:", data);
        
        // Store tokens and user data based on remember me preference
        if (data.accessToken) {
          if (rememberMe) {
            // Store in localStorage for persistent login
            localStorage.setItem('authToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('userData', JSON.stringify(data.user));
            localStorage.setItem('tokenExpiry', new Date(Date.now() + 15 * 60 * 1000).toISOString()); // 15 minutes
          } else {
            // Store in sessionStorage for session-only login
            sessionStorage.setItem('authToken', data.accessToken);
            sessionStorage.setItem('refreshToken', data.refreshToken);
            sessionStorage.setItem('userData', JSON.stringify(data.user));
            sessionStorage.setItem('tokenExpiry', new Date(Date.now() + 15 * 60 * 1000).toISOString()); // 15 minutes
          }
        }
        
        // Redirect based on user role
        if (data.user && data.user.role) {
          console.log("User role:", data.user.role);
          switch (data.user.role.toLowerCase()) {
            case 'admin':
              console.log("Redirecting to admin dashboard");
              navigate('/admindashboard');
              break;
            case 'teacher':
              console.log("Redirecting to teacher dashboard");
              navigate('/teacherdashboard');
              break;
            case 'student':
              console.log("Redirecting to student dashboard");
              navigate('/studentdashboard');
              break;
            default:
              console.log("Unknown role, redirecting to default dashboard");
              navigate('/dashboard');
          }
        } else {
          console.log("No user role found, redirecting to default dashboard");
          navigate('/dashboard');
        }
      } else {
        // Login failed but didn't throw an error (backend returned success: false)
        console.log("Login failed:", data.message);
        setBackendError(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      // Handle network errors or other exceptions
      console.log("Login error:", error);
      setBackendError(error.message || "Login failed. Please check your credentials.");
  }
  }

  // Check for remembered user and auto-login on component mount
  React.useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    const rememberMePreference = localStorage.getItem('rememberMe');
    const usePersistentStorage = sessionStorage.getItem('usePersistentStorage');
    
    if (rememberedUser && rememberMePreference === 'true') {
      setRememberMe(true);
      
      // Check if we have valid tokens for auto-login
      const authToken = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const userData = localStorage.getItem('userData');
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      
      if (authToken && refreshToken && userData && tokenExpiry) {
        const expiryTime = new Date(tokenExpiry).getTime();
        const currentTime = Date.now();
        
        // If token is still valid (with 5 minute buffer), auto-login
        if (currentTime < expiryTime - (5 * 60 * 1000)) {
          try {
            const user = JSON.parse(userData);
            console.log("Auto-login with remembered user:", user);
            
            // Redirect based on user role
            switch (user.role.toLowerCase()) {
              case 'admin':
                navigate('/admindashboard');
                break;
              case 'teacher':
                navigate('/teacherdashboard');
                break;
              case 'student':
                navigate('/studentdashboard');
                break;
              default:
                navigate('/dashboard');
            }
          } catch (error) {
            console.log("Error parsing remembered user data:", error);
            // Clear invalid data
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('tokenExpiry');
          }
        } else {
          console.log("Remembered token expired, user needs to login again");
          // Clear expired tokens
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
          localStorage.removeItem('tokenExpiry');
        }
      }
    } else if (usePersistentStorage === 'true') {
      // Check sessionStorage for session-only login
      const authToken = sessionStorage.getItem('authToken');
      const refreshToken = sessionStorage.getItem('refreshToken');
      const userData = sessionStorage.getItem('userData');
      const tokenExpiry = sessionStorage.getItem('tokenExpiry');
      
      if (authToken && refreshToken && userData && tokenExpiry) {
        const expiryTime = new Date(tokenExpiry).getTime();
        const currentTime = Date.now();
        
        if (currentTime < expiryTime - (5 * 60 * 1000)) {
          try {
            const user = JSON.parse(userData);
            console.log("Auto-login with session user:", user);
            
            switch (user.role.toLowerCase()) {
              case 'admin':
                navigate('/admindashboard');
                break;
              case 'teacher':
                navigate('/teacherdashboard');
                break;
              case 'student':
                navigate('/studentdashboard');
                break;
              default:
                navigate('/dashboard');
            }
          } catch (error) {
            console.log("Error parsing session user data:", error);
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('refreshToken');
            sessionStorage.removeItem('userData');
            sessionStorage.removeItem('tokenExpiry');
          }
        }
      }
    }
  }, [navigate]);

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
                label='User ID *'
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
                label='Password *'
                value={values.password}
                onChange={handleChange}
                error={errors.password}
                touched={touched.password}
                icon={FaLock}
                isPassword
              />
               <div className='flex items-center justify-between'>
                <label className='flex items-center space-x-2 cursor-pointer group'>
                  <div className='relative'>
            <input
                    type='checkbox'
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                      className='form-checkbox h-4 w-4 text-[#064e3b] rounded border-gray-300 focus:ring-[#064e3b] focus:ring-2 focus:ring-offset-2 transition-all duration-200'
                  />
                    {rememberMe && (
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <svg className='w-3 h-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className='text-[#1a365d] text-sm font-medium group-hover:text-[#064e3b] transition-colors duration-200'>
                    Remember me
                  </span>
                </label>
                <button
                  type='button'
                  onClick={() => navigate('/forgotpassword')}
                  className='text-sm text-[#064e3b] hover:text-[#1a365d] hover:underline transition-all duration-200 font-medium'
                >
                  Forgot password?
                </button>
              </div>

              {backendError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  {backendError}
                </div>
              )}

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
