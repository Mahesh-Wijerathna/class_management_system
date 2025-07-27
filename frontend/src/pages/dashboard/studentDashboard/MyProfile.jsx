import React from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import CustomTextField from '../../../components/CustomTextField';
import CustomButton from '../../../components/CustomButton';
import { FaUser, FaLock, FaPhone, FaIdCard, FaCalendarAlt, FaVenusMars } from 'react-icons/fa';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';

const profileSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  idNumber: Yup.string().required('NIC is required'),
  mobile: Yup.string().required('Mobile is required'),
  dob: Yup.date().required('Date of birth is required'),
  age: Yup.number().required('Age is required'),
  gender: Yup.string().required('Gender is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  school: Yup.string().required('School is required'),
  stream: Yup.string().required('Stream is required'),
  address: Yup.string().required('Address is required'),
  district: Yup.string().required('District is required'),
  parentName: Yup.string().required('Parent name is required'),
  parentMobile: Yup.string().required('Parent mobile is required'),
});

const initialProfile = {
  firstName: 'Bawantha',
  lastName: 'Rathnayake',
  idNumber: '981360737V',
  mobile: '0740901827',
  dob: '2000-01-01',
  age: 24,
  gender: 'Male',
  email: 'bawantharathnayake25@gmail.com',
  school: 'Sample School',
  stream: 'AL-Science',
  address: '123, Main Street, Colombo',
  district: 'Colombo',
  parentName: 'Parent Name',
  parentMobile: '0771234567',
};

const streams = [
  'AL-Maths', 'AL-Science', 'AL-Art', 'AL-Tech', 'AL-Common', 'OL', 'Primary'
];
const sriLankaDistricts = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota',
  'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale',
  'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura',
  'Trincomalee', 'Vavuniya'
];

const MyProfile = () => {
  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
        <div className="bg-white rounded-2xl shadow p-6">
          {/* Avatar and Upload */}
          
          {/* Editable Profile Form */}
          <Formik
            initialValues={initialProfile}
            validationSchema={profileSchema}
            onSubmit={values => {
              alert('Profile saved! ' + JSON.stringify(values, null, 2));
            }}
          >
            {({ errors, touched, handleChange, values, handleSubmit, isSubmitting }) => (
              <form className="space-y-6" onSubmit={handleSubmit}>
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
                    label="NIC *"
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
                      {streams.map((s, i) => <option key={s + '-' + i} value={s}>{s}</option>)}
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
                      {sriLankaDistricts.map((d, i) => <option key={d + '-' + i} value={d}>{d}</option>)}
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
                </div>
                <div className="flex gap-4 mt-4">
                  <CustomButton type="submit" disabled={isSubmitting}>
                    Save Changes
                  </CustomButton>
                </div>
              </form>
            )}
          </Formik>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyProfile; 