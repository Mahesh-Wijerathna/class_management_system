import React from 'react';
import BasicAlertBox from '../../../components/BasicAlertBox';
import CustomTextField from '../../../components/CustomTextField';
import CustomButton from '../../../components/CustomButton';
import BasicForm from '../../../components/BasicForm';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { FaUser, FaLock, FaPhone, FaEnvelope } from 'react-icons/fa';

const phoneRegex = /^0\d{9}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const CreateCoreAdminLogin = () => {
  const navigate = useNavigate();

  const [submitCount, setSubmitCount] = React.useState(0);
  const [alertBox, setAlertBox] = React.useState({ open: false, message: '', onConfirm: null, confirmText: 'OK', type: 'success' });

  return (
      <div className="w-full max-w-5xl mx-auto bg-white p-8 rounded-lg shadow mt-10">
      <BasicAlertBox
        open={alertBox.open}
        message={alertBox.message}
        onConfirm={alertBox.onConfirm}
        confirmText={alertBox.confirmText}
        type={alertBox.type}
      />
      {/* <h2 className="text-2xl font-bold mb-6 text-center">Create Core Admin Login</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomTextField
                id="adminId"
                name="adminId"
                type="text"
                label="Admin ID *"
                value={values.adminId}
                onChange={handleChange}
                error={errors.adminId}
                touched={touched.adminId}
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
                label="Name *"
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
            </div>
            <hr className="my-6 border-t border-gray-300" />
            <div className="flex flex-row gap-4 mt-0 mb-2">
              <CustomButton
                type="button"
                onClick={() => navigate(-1)}
                className="w-1/2 py-2.5 px-4 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                onClick={() => setSubmitCount((c) => c + 1)}
                className="w-1/2 py-2.5 px-4 bg-[#1a365d] text-white text-xs font-bold rounded-lg hover:bg-[#13294b] active:bg-[#0f2038]"
              >
                Create
              </CustomButton>
            </div>
          </>
        )}
      </BasicForm> */}

      {/* Form for Core Admin Creation */}
      <h2 className="text-2xl font-bold mb-6 text-center">Create Core Admin</h2>
      <BasicForm
        initialValues={{
          firstName: '',
          lastName: '',
          password: '',
          email: '',
          phone: '',
        }}
        validationSchema={Yup.object().shape({
          firstName: Yup.string().min(2, "First name must be at least 2 characters").required("First name is required"),
          lastName: Yup.string().optional(),
          password: Yup.string()
            .matches(passwordRegex, 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character')
            .required('Password is required'),
          email: Yup.string().email('Invalid email address').required('Email is required'),
          phone: Yup.string().matches(phoneRegex, 'Invalid phone number (should be 10 digits, start with 0)').required('Phone number is required'),
        })}
        onSubmit={async (values) => {
          try {
            const response = await fetch('http://localhost:8081/routes.php/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: values.email,
                firstName: values.firstName,
                lastName: values.lastName,
                password: values.password,
                phone: values.phone,
                role: 'admin'
              }),
            });
            const data = await response.json();
            console.log('Response:', data);
            
            if (data.success) {
              const coreAdmins = JSON.parse(localStorage.getItem('coreAdmins')) || [];
              coreAdmins.push({ ...values, userid: data.userid });
              localStorage.setItem('coreAdmins', JSON.stringify(coreAdmins));
              
              setAlertBox({
                open: true,
                message: `Core admin account created successfully! Admin ID: ${data.userid}`,
                onConfirm: () => {
                  setAlertBox(a => ({ ...a, open: false }));
                  navigate('/admin/core-admins/info');
                },
                confirmText: 'OK',
                type: 'success'
              });
            } else {
              setAlertBox({
                open: true,
                message: data.message || 'Failed to create core admin account. Please try again.',
                onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
                confirmText: 'OK',
                type: 'error'
              });
            }
          } catch (error) {
            console.error('Failed to create core admin:', error);
            setAlertBox({
              open: true,
              message: error.message || 'Failed to create core admin account. Please try again.',
              onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
              confirmText: 'OK',
              type: 'error'
            });
          }
        }}
      >
        {({ errors, touched, handleChange, values }) => (
          <>
            {submitCount > 0 && Object.keys(errors).length > 0 && (
              <div className='bg-red-100 text-red-700 p-2 rounded mb-2 text-xs font-semibold'>
                Please fix the errors below before continuing.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                label="Last Name"
                value={values.lastName}
                onChange={handleChange}
                error={errors.lastName}
                touched={touched.lastName}
                icon={FaUser}
              />
              <CustomTextField
                id="additional-password"
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
                id="additional-email"
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
                id="additional-phone"
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
            <hr className="my-6 border-t border-gray-300" />
            <div className="flex flex-row gap-4 mt-0 mb-2">
              <CustomButton
                type="button"
                onClick={() => navigate(-1)}
                className="w-1/2 py-2.5 px-4 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                onClick={() => setSubmitCount((c) => c + 1)}
                className="w-1/2 py-2.5 px-4 bg-[#1a365d] text-white text-xs font-bold rounded-lg hover:bg-[#13294b] active:bg-[#0f2038]"
              >
                Create Admin
              </CustomButton>
            </div>
          </>
        )}
      </BasicForm>
      </div>
  );
};



export default CreateCoreAdminLogin;
