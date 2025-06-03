import React from 'react'
import * as Yup from "yup"
import { FaUser, FaLock, FaEnvelope, FaGraduationCap } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import BasicForm from '../../components/BasicForm'
import CustomTextField from '../../components/CustomTextField'
import CustomButton from '../../components/CustomButton'
import { register } from '../../api/auth'

export default function RegisterPage() {

  const RegisterSchema = Yup.object().shape({
    userID: Yup.string()
      .required("User ID is required")
      .min(3, "User ID must be at least 3 characters")
      .max(20, "User ID must not exceed 20 characters"),
    name: Yup.string()
      .required("Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must not exceed 50 characters"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm Password is required')
  })

  const handleRegister = async (values) => {
    try {
      const data = await register({
        userID: values.userID,
        name: values.name,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      // *** Handle successful registration ***
      console.log("Registration successful:", data);
      // Example: Show success message, redirect to login
       alert("Registration successful! You can now log in.");
      // navigate('/login'); // You would need to import useHistory or useNavigate from react-router-dom
    } catch (error) {
       // *** Handle registration errors ***
      console.error("Registration failed:", error.message);
       // Example: Display error message to the user
      alert(error.message || "Registration failed. Please try again.");
    }
  }

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
            Student Registration
          </span>
        </div>
        <BasicForm
          initialValues={{
            userID: "",
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
          }} 
          validationSchema={RegisterSchema}
          onSubmit={handleRegister}
        >
          {({errors, touched, handleChange, values}) => (
            <>
              <CustomTextField
                id='userID'
                name='userID'
                type='text'
                placeholder='Enter your user ID'
                value={values.userID}
                onChange={handleChange}
                error={errors.userID}
                touched={touched.userID}
                icon={FaUser}
              />

              <CustomTextField
                id='name'
                name='name'
                type='text'
                placeholder='Enter your full name'
                value={values.name}
                onChange={handleChange}
                error={errors.name}
                touched={touched.name}
                icon={FaUser}
              />

               <CustomTextField
                id='email'
                name='email'
                type='email'
                placeholder='Enter your email'
                value={values.email}
                onChange={handleChange}
                error={errors.email}
                touched={touched.email}
                icon={FaEnvelope}
              />

              <CustomTextField
                id='password'
                name='password'
                type='password'
                placeholder='Enter your password'
                value={values.password}
                onChange={handleChange}
                error={errors.password}
                touched={touched.password}
                icon={FaLock}
                isPassword
              />

              <CustomTextField
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                placeholder='Confirm your password'
                value={values.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                touched={touched.confirmPassword}
                icon={FaLock}
                isPassword
              />

              <CustomButton type='submit'>Register</CustomButton>

            </>
          )}
        </BasicForm>
        <div className='flex justify-center mt-4 text-xs'>
          <Link to="/login" className='text-[#064e3b] hover:underline'>
            Already have an account? Sign In
          </Link>
        </div>
      </div> 
    </div>
  )
} 