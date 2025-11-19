import React, { useState, useEffect } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import CustomTextField from '../../../components/CustomTextField';
import CustomButton from '../../../components/CustomButton';
import BasicAlertBox from '../../../components/BasicAlertBox';
import { FaUser, FaLock, FaPhone, FaIdCard, FaCalendarAlt, FaVenusMars } from 'react-icons/fa';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import { useNavigate } from 'react-router-dom';
import { changePassword, updateStudentProfile } from '../../../api/auth';
import axios from 'axios';

// Helper function to get the appropriate storage
const getStorage = () => {
  const usePersistentStorage = sessionStorage.getItem('usePersistentStorage');
  return usePersistentStorage === 'true' ? localStorage : sessionStorage;
};

  // Helper function to fetch student profile from backend
  const fetchStudentProfile = async (userid) => {
    try {
      const response = await axios.get(`http://localhost:8086/routes.php/get_with_id/${userid}`, {
        timeout: 5000
      });
      if (response.data && !response.data.error) {
        return response.data;
      } else {
        console.error('Error fetching student profile:', response.data);
        return null;
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
      return null;
    }
  };

const profileSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
  
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
  
  idNumber: Yup.string()
    .required('NIC is required')
    .matches(/^[0-9]{9}[VXvx]$|^[0-9]{12}$/, 'Please enter a valid Sri Lankan NIC (9 digits + V/X or 12 digits)'),
  
  mobile: Yup.string()
    .required('Mobile number is required')
    .matches(/^0[1-9][0-9]{8}$/, 'Please enter a valid Sri Lankan mobile number (e.g., 0712345678)'),
  
  dob: Yup.date()
    .required('Date of birth is required')
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Student must be between 5 and 100 years old', function(value) {
      if (!value) return false;
      const age = new Date().getFullYear() - value.getFullYear();
      return age >= 5 && age <= 100;
    }),
  
  age: Yup.number()
    .required('Age is required')
    .min(5, 'Age must be at least 5 years')
    .max(100, 'Age must be less than 100 years')
    .integer('Age must be a whole number'),
  
  gender: Yup.string()
    .required('Gender is required')
    .oneOf(['Male', 'Female', 'Other'], 'Please select a valid gender'),
  
  email: Yup.string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters'),
  
  school: Yup.string()
    .required('School is required')
    .min(2, 'School name must be at least 2 characters')
    .max(100, 'School name must be less than 100 characters'),
  
  stream: Yup.string()
    .required('Stream is required')
    .oneOf([
      'A/L-Maths', 'A/L-Science', 'A/L-Art', 'A/L-Technology', 'A/L-Commerce', 
      'O/L', 'Primary', 'Other'
    ], 'Please select a valid stream'),
  
  address: Yup.string()
    .required('Address is required')
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be less than 200 characters'),
  
  district: Yup.string()
    .required('District is required')
    .oneOf([
      'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota',
      'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale',
      'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura',
      'Trincomalee', 'Vavuniya'
    ], 'Please select a valid district'),
  
  parentName: Yup.string()
    .required('Parent name is required')
    .min(2, 'Parent name must be at least 2 characters')
    .max(100, 'Parent name must be less than 100 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Parent name can only contain letters and spaces'),
  
  parentMobile: Yup.string()
    .required('Parent mobile number is required')
    .matches(/^0[1-9][0-9]{8}$/, 'Please enter a valid Sri Lankan mobile number (e.g., 0712345678)')
    .test('different-mobile', 'Parent mobile must be different from student mobile', function(value) {
      const studentMobile = this.parent.mobile;
      return value !== studentMobile;
    }),
});

const passwordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Current password is required')
    .min(1, 'Current password is required'),
  
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .matches(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .matches(/^(?=.*\d)/, 'Password must contain at least one number')
    .matches(/^(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)')
    .test('different-password', 'New password must be different from current password', function(value) {
      const currentPassword = this.parent.currentPassword;
      return value !== currentPassword;
    }),
  
  confirmPassword: Yup.string()
    .required('Confirm password is required')
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match'),
});

const streams = [
  'A/L-Maths', 'A/L-Science', 'A/L-Art', 'A/L-Technology', 'A/L-Commerce', 'O/L', 'Primary', 'Other'
];

const districts = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota',
  'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale',
  'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura',
  'Trincomalee', 'Vavuniya'
];

const genders = ['Male', 'Female', 'Other'];

const MyProfile = ({ onLogout }) => {
  // Language selection (read from localStorage and listen for changes)
  const [appLang, setAppLang] = useState(localStorage.getItem('appLang') || 'en');

  useEffect(() => {
    const onStorage = (e) => {
      if (!e) return;
      if (e.key === 'appLang' && e.newValue) setAppLang(e.newValue);
    };
    const onCustom = (e) => {
      const newLang = e?.detail || localStorage.getItem('appLang');
      if (newLang) setAppLang(newLang);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('appLangChanged', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('appLangChanged', onCustom);
    };
  }, []);

  const translations = {
    en: {
  loadingProfile: 'Loading profile...',
      redirectingToLogin: 'Redirecting to login...',
      editProfile: 'Edit Profile',
      changePassword: 'Change Password',
      cancel: 'Cancel',
      changePasswordBtn: 'Change Password',
      passwordRequirementsTitle: 'Password Requirements:',
      pw_req_1: 'At least 8 characters long',
      pw_req_2: 'Contains at least one uppercase letter',
      pw_req_3: 'Contains at least one lowercase letter',
      pw_req_4: 'Contains at least one number',
      pw_req_5: 'Contains at least one special character (@$!%*?&)',
      changingPassword: 'Changing Password...',
      profileInformation: 'Profile Information',
      firstName: 'First Name',
      lastName: 'Last Name',
      nic: 'NIC',
      mobile: 'Mobile',
      dob: 'Date of Birth',
      age: 'Age',
      gender: 'Gender',
      selectGender: 'Select Gender',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      email: 'Email',
      school: 'School',
      stream: 'Stream',
      selectStream: 'Select Stream',
      address: 'Address',
      district: 'District',
      selectDistrict: 'Select District',
      parentName: 'Parent Name',
      parentMobile: 'Parent Mobile',
      fixErrors: 'Please fix the following errors:',
      cancelBtn: 'Cancel',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      profileUpdatedMessage: 'Your profile information has been successfully updated and saved to the database.',
      profileUpdatedTitle: 'Profile Updated',
      updateFailedMessage: 'There was an error updating your profile. Please try again.',
      updateFailedTitle: 'Update Failed',
      ok: 'OK',
  passwordChangedMessage: 'Your password has been successfully changed. You can now use your new password to login.',
  passwordChangedTitle: 'Password Changed',
  passwordChangeFailedTitle: 'Password Change Failed',
  currentPasswordLabel: 'Current Password',
  newPasswordLabel: 'New Password',
  confirmNewPasswordLabel: 'Confirm New Password',
  editProfile: 'Edit Profile'
    },
    si: {
      loadingProfile: 'පැතිකඩ ලෝඩ් වර්මින්...',
      redirectingToLogin: 'පිවිසුමට යළි යවමින්...',
      editProfile: 'පැතිකඩ සංස්කරණය',
      changePassword: 'මුරපදය වෙනස් කරන්න',
      cancel: 'අවසන් කරන්න',
      changePasswordBtn: 'මුරපදය වෙනස් කරන්න',
      passwordRequirementsTitle: 'මුරපද අවශ්‍යතා:',
      pw_req_1: 'අකුරු 8 ක් හෝ වැඩි විය යුතුය',
      pw_req_2: 'අවම වශයෙන් එක් විශාල අකුරක් අඩංගු විය යුතුය',
      pw_req_3: 'අවම වශයෙන් එක් සුළු අකුරක් අඩංගු විය යුතුය',
      pw_req_4: 'අවම වශයෙන් එක් සංඛ්‍යාවක් අඩංගු විය යුතුය',
      pw_req_5: 'අවම වශයෙන් එක් විශේෂ චරිතයක් (@$!%*?&) අඩංගු විය යුතුය',
      changingPassword: 'මුරපදය වෙනස් වෙමින්...',
      profileInformation: 'පැතිකඩ තොරතුරු',
      firstName: 'ප්‍රථම නම',
      lastName: 'අවසන් නම',
      nic: 'හැඳුනුම්පත (NIC)',
      mobile: 'ජංගම',
      dob: 'උපන් දිනය',
      age: 'වයස',
      gender: 'ස්ත්‍රී/පුරුෂය',
      selectGender: 'ස්ත්‍රී/පුරුෂය තෝරන්න',
      male: 'පුරුෂ',
      female: 'කාන්තාව',
      other: 'වෙනත්',
      email: 'විද්‍යුත් තැපෑල',
      school: 'පාසල',
      stream: 'ප්‍රවාහය',
      selectStream: 'ප්‍රවාහය තෝරන්න',
      address: 'ලිපිනය',
      district: 'දිස්ත්‍රික්කය',
      selectDistrict: 'දිස්ත්‍රික්කය තෝරන්න',
      parentName: 'මව්පියගේ නම',
      parentMobile: 'මව්පිය ජංගම',
      fixErrors: 'කරුණාකර පහත දෝෂ නිවැරදි කරන්න:',
      cancelBtn: 'අවලංගු කරන්න',
      saveChanges: 'වෙනස්කම් සුරකින්න',
      saving: 'සුරකිමින්...',
      profileUpdatedMessage: 'ඔබගේ පැතිකඩ තොරතුරු සාර්ථකව යාවත්කාලීන කරන ලදී.',
      profileUpdatedTitle: 'පැතිකඩ යාවත්කාලීන කරන ලදී',
      updateFailedMessage: 'ඔබගේ පැතිකඩ යාවත්කාලීන කිරීමේදී දෝෂයක් සිදු විය. නැවත උත්සාහ කරන්න.',
      updateFailedTitle: 'යාවත්කාලීන කිරීම අසාර්ථකයි',
      ok: 'හරි',
  passwordChangedMessage: 'ඔබගේ මුරපදය සාර්ථකව වෙනස් විය.',
  passwordChangedTitle: 'මුරපදය වෙනස් කරන ලදි',
  passwordChangeFailedTitle: 'මුරපද වෙනස් කිරීම අසාර්ථකයි',
  currentPasswordLabel: 'වත්මන් මුරපදය',
  newPasswordLabel: 'නව මුරපදය',
  confirmNewPasswordLabel: 'නව මුරපදය තහවුරු කරන්න',
  editProfile: 'පැතිකඩ සංස්කරණය'
    }
  };

  const t = (key) => (translations[appLang] && translations[appLang][key]) || translations.en[key] || key;
  const [currentStudent, setCurrentStudent] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [alertBox, setAlertBox] = useState({ open: false, message: '', type: 'info' });
  const navigate = useNavigate();

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        // Load authenticated user data from appropriate storage
        const storage = getStorage();
        const userData = storage.getItem('userData');
        
        if (userData) {
          const user = JSON.parse(userData);
          
          // Check if user is a student
          if (user.role === 'student') {
            setCurrentStudent(user);
            
            // Fetch complete student profile from backend
            const profile = await fetchStudentProfile(user.userid);
            if (profile) {
              setStudentProfile(profile);
            }
          } else {
            console.log("User is not a student, redirecting...");
            navigate('/login');
          }
        } else {
          console.log("No user data found, redirecting to login");
          navigate('/login');
        }
      } catch (error) {
        console.error("Error loading student data:", error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <DashboardLayout
        userRole="Student"
        sidebarItems={studentSidebarSections}
        onLogout={onLogout}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">{t('loadingProfile')}</div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading or redirect if no student data
  if (!currentStudent) {
    return (
      <DashboardLayout
        userRole="Student"
        sidebarItems={studentSidebarSections}
        onLogout={onLogout}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">{t('redirectingToLogin')}</div>
        </div>
      </DashboardLayout>
    );
  }

  // Create initial profile from complete student data
  const initialProfile = {
    firstName: studentProfile?.first_name || currentStudent.firstName || '',
    lastName: studentProfile?.last_name || currentStudent.lastName || '',
    idNumber: studentProfile?.nic || currentStudent.nic || '',
    mobile: studentProfile?.mobile_number || currentStudent.mobile || '',
    dob: studentProfile?.date_of_birth || currentStudent.dateOfBirth || '',
    age: studentProfile?.age || currentStudent.age || '',
    gender: studentProfile?.gender || currentStudent.gender || '',
    email: studentProfile?.email || currentStudent.email || '',
    school: studentProfile?.school || currentStudent.school || '',
    stream: studentProfile?.stream || currentStudent.stream || '',
    address: studentProfile?.address || currentStudent.address || '',
    district: studentProfile?.district || currentStudent.district || '',
    parentName: studentProfile?.parent_name || currentStudent.parentName || '',
    parentMobile: studentProfile?.parent_mobile_number || currentStudent.parentMobile || '',
  };



  const initialPasswordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  const handleProfileSubmit = async (values, { setSubmitting }) => {
    try {
      // Transform form values to match backend expected format
      const profileData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        mobile: values.mobile,
        nic: values.idNumber,
        gender: values.gender,
        age: values.age,
        parentName: values.parentName,
        parentMobile: values.parentMobile,
        stream: values.stream,
        dateOfBirth: values.dob,
        school: values.school,
        address: values.address,
        district: values.district,
      };

      const response = await updateStudentProfile(currentStudent.userid, profileData);
      
      if (response.success) {
        // Update localStorage with new profile data
        const updatedUserData = {
          ...currentStudent,
          ...profileData
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        // Update current student state
        setCurrentStudent(updatedUserData);
        
        // Show success alert with title
        setAlertBox({
          open: true,
          message: t('profileUpdatedMessage'),
          title: t('profileUpdatedTitle'),
          type: 'success'
        });
      } else {
        // Show error alert with title
        setAlertBox({
          open: true,
          message: response.message || t('updateFailedMessage'),
          title: t('updateFailedTitle'),
          type: 'danger'
        });
      }
    } catch (error) {
      // Show error alert with title
      setAlertBox({
        open: true,
        message: error.message || t('updateFailedMessage'),
        title: t('updateFailedTitle'),
        type: 'danger'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (values, { setSubmitting, resetForm }) => {
    try {
      const response = await changePassword(
        currentStudent.userid,
        values.currentPassword,
        values.newPassword
      );
      
      if (response.success) {
        setPasswordMessage(t('passwordChangedMessage'));
        resetForm();
        setShowPasswordForm(false);
        
        // Show success alert with title
        setAlertBox({
          open: true,
          message: t('passwordChangedMessage'),
          title: t('passwordChangedTitle'),
          type: 'success'
        });
      } else {
        setPasswordMessage(response.message || t('passwordChangeFailedTitle'));
        
        // Show error alert with title
        setAlertBox({
          open: true,
          message: response.message || t('passwordChangeFailedTitle'),
          title: t('passwordChangeFailedTitle'),
          type: 'danger'
        });
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setPasswordMessage(''), 3000);
      
    } catch (error) {
      setPasswordMessage(error.message || t('passwordChangeFailedTitle'));
      
      // Show error alert with title
      setAlertBox({
        open: true,
        message: error.message || t('passwordChangeFailedTitle'),
        title: t('passwordChangeFailedTitle'),
        type: 'danger'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      userRole="Student"
      sidebarItems={studentSidebarSections}
      onLogout={onLogout}
    >
      {/* Modern Alert Box */}
      <BasicAlertBox
        open={alertBox.open}
        message={alertBox.message}
        title={alertBox.title}
        type={alertBox.type}
        confirmText={t('ok')}
        onConfirm={() => setAlertBox({ open: false, message: '', title: '', type: 'info' })}
        showCloseButton={true}
      />
      
      <div className="p-2 sm:p-4 lg:p-6 max-w-6xl mx-auto">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-[#1a365d]">{t('editProfile')}</h2>
        
        {/* Password Change Section */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-[#1a365d]">{t('changePassword')}</h3>
                          <button 
                type="button" 
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="px-3 sm:px-4 py-2 bg-[#1a365d] text-white text-xs font-bold rounded-lg hover:bg-[#13294b] active:bg-[#0f2038] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:ring-opacity-50 shadow-md hover:shadow-xl"
              >
              {showPasswordForm ? t('cancel') : t('changePassword')}
            </button>
          </div>
          
          {passwordMessage && (
            <div className={`p-3 rounded mb-4 text-xs ${
              passwordMessage.includes('successfully') 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              {passwordMessage}
            </div>
          )}
          
          {showPasswordForm && (
            <Formik
              initialValues={initialPasswordForm}
              validationSchema={passwordSchema}
              onSubmit={handlePasswordChange}
            >
              {({ errors, touched, handleChange, values, handleSubmit, isSubmitting }) => (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <CustomTextField
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      label={`${t('currentPasswordLabel')} *`}
                      value={values.currentPassword}
                      onChange={handleChange}
                      error={errors.currentPassword}
                      touched={touched.currentPassword}
                      icon={FaLock}
                      isPassword
                    />
                    
                    <CustomTextField
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      label={`${t('newPasswordLabel')} *`}
                      value={values.newPassword}
                      onChange={handleChange}
                      error={errors.newPassword}
                      touched={touched.newPassword}
                      icon={FaLock}
                      isPassword
                    />
                    
                    <CustomTextField
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      label={`${t('confirmNewPasswordLabel')} *`}
                      value={values.confirmPassword}
                      onChange={handleChange}
                      error={errors.confirmPassword}
                      touched={touched.confirmPassword}
                      icon={FaLock}
                      isPassword
                    />
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 border border-blue-200">
                    <p className="font-semibold mb-1">{t('passwordRequirementsTitle')}</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>{t('pw_req_1')}</li>
                      <li>{t('pw_req_2')}</li>
                      <li>{t('pw_req_3')}</li>
                      <li>{t('pw_req_4')}</li>
                      <li>{t('pw_req_5')}</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-end">
                    <CustomButton type="submit" disabled={isSubmitting}>
                      {isSubmitting ? t('changingPassword') : t('changePassword')}
                    </CustomButton>
                  </div>
                </form>
              )}
            </Formik>
          )}
        </div>
        
        {/* Profile Information Section */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold mb-4 text-[#1a365d]">{t('profileInformation')}</h3>
          
          {/* Editable Profile Form */}
          <Formik
            initialValues={initialProfile}
            validationSchema={profileSchema}
            onSubmit={handleProfileSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ errors, touched, handleChange, values, handleSubmit, isSubmitting, isValid, dirty }) => (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <CustomTextField
                    id="firstName"
                    name="firstName"
                    type="text"
                    label={`${t('firstName')} *`}
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
                    label={`${t('lastName')} *`}
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
                    label={`${t('nic')} *`}
                    value={values.idNumber}
                    onChange={handleChange}
                    error={errors.idNumber}
                    touched={touched.idNumber}
                    icon={FaIdCard}
                    placeholder="e.g., 981360737V or 199813607377"
                  />
                  <CustomTextField
                    id="mobile"
                    name="mobile"
                    type="text"
                    label={`${t('mobile')} *`}
                    value={values.mobile}
                    onChange={handleChange}
                    error={errors.mobile}
                    touched={touched.mobile}
                    icon={FaPhone}
                    placeholder="e.g., 0712345678"
                  />
                  <CustomTextField
                    id="dob"
                    name="dob"
                    type="date"
                    label={`${t('dob')} *`}
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
                    label={`${t('age')} *`}
                    value={values.age}
                    onChange={handleChange}
                    error={errors.age}
                    touched={touched.age}
                    icon={FaUser}
                    min="5"
                    max="100"
                  />
                  
                  {/* Gender Select */}
                  <div className="flex flex-col">
                    <label htmlFor="gender" className="text-xs font-medium text-[#1a365d] mb-1 flex items-center">
                      <FaVenusMars className="mr-2 text-[#1a365d]" />
                      {t('gender')} *
                    </label>
                    <select
                    id="gender"
                    name="gender"
                    value={values.gender}
                    onChange={handleChange}
                      className={`border-2 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:ring-opacity-50 transition-all duration-200 ${
                        errors.gender && touched.gender 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-[#1a365d]'
                      }`}
                    >
                      <option value="">{t('selectGender')}</option>
                      {genders.map((gender) => (
                        <option key={gender} value={gender}>
                          {t(gender.toLowerCase())}
                        </option>
                      ))}
                    </select>
                    {errors.gender && touched.gender && (
                      <span className="text-red-500 text-[10px] mt-1">{errors.gender}</span>
                    )}
                  </div>
                  
                  <CustomTextField
                    id="email"
                    name="email"
                    type="email"
                    label={`${t('email')} *`}
                    value={values.email}
                    onChange={handleChange}
                    error={errors.email}
                    touched={touched.email}
                    icon={FaUser}
                    placeholder="e.g., student@email.com"
                  />
                  <CustomTextField
                    id="school"
                    name="school"
                    type="text"
                    label={`${t('school')} *`}
                    value={values.school}
                    onChange={handleChange}
                    error={errors.school}
                    touched={touched.school}
                    icon={FaUser}
                  />
                  
                  {/* Stream Select */}
                  <div className="flex flex-col">
                      <label htmlFor="stream" className="text-xs font-medium text-[#1a365d] mb-1 flex items-center">
                      <FaUser className="mr-2 text-[#1a365d]" />
                      {t('stream')} *
                    </label>
                    <select
                      id="stream"
                      name="stream"
                      value={values.stream}
                      onChange={handleChange}
                      className={`border-2 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:ring-opacity-50 transition-all duration-200 ${
                        errors.stream && touched.stream 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-[#1a365d]'
                      }`}
                    >
                      <option value="">{t('selectStream')}</option>
                      {streams.map((stream) => (
                        <option key={stream} value={stream}>
                          {stream}
                        </option>
                      ))}
                    </select>
                    {errors.stream && touched.stream && (
                      <span className="text-red-500 text-[10px] mt-1">{errors.stream}</span>
                    )}
                  </div>
                  
                  <CustomTextField
                    id="address"
                    name="address"
                    type="text"
                    label={`${t('address')} *`}
                    value={values.address}
                    onChange={handleChange}
                    error={errors.address}
                    touched={touched.address}
                    icon={FaUser}
                    placeholder="e.g., 123 Main Street, City"
                  />
                  
                  {/* District Select */}
                  <div className="flex flex-col">
                      <label htmlFor="district" className="text-xs font-medium text-[#1a365d] mb-1 flex items-center">
                      <FaUser className="mr-2 text-[#1a365d]" />
                      {t('district')} *
                    </label>
                    <select
                      id="district"
                      name="district"
                      value={values.district}
                      onChange={handleChange}
                      className={`border-2 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:ring-opacity-50 transition-all duration-200 ${
                        errors.district && touched.district 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-[#1a365d]'
                      }`}
                    >
                      <option value="">{t('selectDistrict')}</option>
                      {districts.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                    {errors.district && touched.district && (
                      <span className="text-red-500 text-[10px] mt-1">{errors.district}</span>
                    )}
                  </div>
                  
                  <CustomTextField
                    id="parentName"
                    name="parentName"
                    type="text"
                    label={`${t('parentName')} *`}
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
                    label={`${t('parentMobile')} *`}
                    value={values.parentMobile}
                    onChange={handleChange}
                    error={errors.parentMobile}
                    touched={touched.parentMobile}
                    icon={FaPhone}
                    placeholder="e.g., 0712345678"
                  />
                </div>
                
                {/* Validation Summary */}
                {dirty && !isValid && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-red-800 mb-2">{t('fixErrors')}</h4>
                    <ul className="text-xs text-red-700 space-y-1">
                      {Object.keys(errors).map((field) => (
                        <li key={field} className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          {errors[field]}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex justify-end space-x-4">
                  <CustomButton type="button" onClick={() => navigate('/studentdashboard')}>
                    {t('cancelBtn')}
                  </CustomButton>
                  <CustomButton 
                    type="submit" 
                    disabled={isSubmitting || !isValid || !dirty}
                  >
                    {isSubmitting ? t('saving') : t('saveChanges')}
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