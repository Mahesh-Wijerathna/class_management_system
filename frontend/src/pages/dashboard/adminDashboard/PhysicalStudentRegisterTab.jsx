import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import CustomTextField from '../../../components/CustomTextField';
import CustomButton from '../../../components/CustomButton';
import BasicForm from '../../../components/BasicForm';
import { FaUser, FaPhone, FaIdCard, FaCalendarAlt, FaVenusMars, FaGraduationCap, FaBarcode, FaDownload } from 'react-icons/fa';
import { Formik } from 'formik';
import JsBarcode from 'jsbarcode';
import { register, saveBarcode } from '../../../api/auth';

// Helper to parse NIC (Sri Lankan)
function parseNIC(nic) {
  let year, month, day, gender;
  let nicStr = nic.toString().toUpperCase();
  if (/^\d{9}[VX]$/.test(nicStr)) {
    year = '19' + nicStr.substring(0, 2);
    let days = parseInt(nicStr.substring(2, 5), 10);
    gender = days > 500 ? 'Female' : 'Male';
    if (days > 500) days -= 500;
    // Days to month/day
    const months = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let m = 0;
    while (days > months[m]) {
      days -= months[m];
      m++;
    }
    month = (m + 1).toString().padStart(2, '0');
    day = days.toString().padStart(2, '0');
  } else if (/^\d{12}$/.test(nicStr)) {
    year = nicStr.substring(0, 4);
    let days = parseInt(nicStr.substring(4, 7), 10);
    gender = days > 500 ? 'Female' : 'Male';
    if (days > 500) days -= 500;
    const months = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let m = 0;
    while (days > months[m]) {
      days -= months[m];
      m++;
    }
    month = (m + 1).toString().padStart(2, '0');
    day = days.toString().padStart(2, '0');
  } else {
    return null;
  }
  const dob = `${year}-${month}-${day}`;
  // Calculate age
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return { dob, gender, age };
}

const nicRegex = /^(\d{12}|\d{9}[VXvx])$/;
const phoneRegex = /^0\d{9}$/;
const genderRegex = /^(male|female)$/i;
const nameRegex = /^[A-Za-z ]+$/;
const allowedStreams = ['A/L-Maths', 'A/L-Science', 'A/L-Art', 'A/L-Technology', 'A/L-Commerce', 'O/L', 'Primary', 'Other'];
const allowedDistricts = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota',
  'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale',
  'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura',
  'Trincomalee', 'Vavuniya'
];

const step1Schema = Yup.object().shape({
  firstName: Yup.string()
    .matches(nameRegex, 'First name should only contain letters')
    .min(2, 'First name must be at least 2 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .matches(nameRegex, 'Last name should only contain letters')
    .min(2, 'Last name must be at least 2 characters')
    .required('Last name is required'),
  idNumber: Yup.string()
    .matches(nicRegex, 'Invalid NIC format (e.g., 199985012023 or 981360737V)')
    .notRequired()
    .nullable(),
  mobile: Yup.string()
    .matches(phoneRegex, 'Invalid phone number (should be 10 digits, start with 0)')
    .required('Mobile number is required'),
});

const PhysicalStudentRegisterTab = () => {
  const [step, setStep] = useState(1);
  const [summaryValues, setSummaryValues] = useState({});
  const [nicInfo, setNicInfo] = useState(null);
  const [step1Values, setStep1Values] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    mobile: '',
  });
  const [manualFields, setManualFields] = useState({
    dob: '',
    age: '',
    gender: '',
    email: '',
    school: '',
    stream: '',
    address: '',
    district: '',
    parentName: '',
    parentMobile: '',
  });
  const [generatedBarcode, setGeneratedBarcode] = useState(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [registeredStudent, setRegisteredStudent] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Generate unique student ID
  const generateStudentId = () => {
    // Get existing students to determine next increment number
    const existingStudents = JSON.parse(localStorage.getItem('students')) || [];
    const nextNumber = existingStudents.length + 1;
    
    return `STD${nextNumber}${Date.now()}${Math.floor(Math.random() * 1000)}`;
  };

  // Generate student barcode
  const generateStudentBarcode = (student) => {
    const studentId = student.studentId || generateStudentId();
    const barcodeData = studentId; // Use Student ID only
    
    return {
      id: studentId,
      barcodeData: barcodeData,
      studentName: `${student.firstName} ${student.lastName}`,
      generatedAt: new Date().toISOString(),
      studentInfo: student
    };
  };

  // Download barcode as PNG
  const downloadBarcode = () => {
    if (!generatedBarcode) return;
    
    const canvas = document.getElementById('success-barcode-display');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `barcode_${generatedBarcode.studentName}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  // Generate barcode on canvas
  const generateBarcodeOnCanvas = (barcodeData, canvasId) => {
    try {
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        JsBarcode(`#${canvasId}`, barcodeData, {
          format: 'CODE128',
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 16,
          margin: 10
        });
      }
    } catch (error) {
      console.error('Error generating barcode on canvas:', error);
    }
  };



  const handleStep1 = (values) => {
    setStep1Values(values);
    if (values.idNumber && nicRegex.test(values.idNumber)) {
      const parsed = parseNIC(values.idNumber);
      if (parsed) {
        setNicInfo(parsed);
        setManualFields(parsed);
      } else {
        setNicInfo(null);
        setManualFields({ dob: '', age: '', gender: '', email: '', school: '', stream: '', address: '', district: '', parentName: '', parentMobile: '' });
      }
    } else {
      setNicInfo(null);
      setManualFields({ dob: '', age: '', gender: '', email: '', school: '', stream: '', address: '', district: '', parentName: '', parentMobile: '' });
    }
    setStep(2);
  };

  const handleStep2 = (values) => {
    setSummaryValues({ ...step1Values, ...values });
    setStep(3);
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    
    try {
      // Prepare registration data for backend
      const registrationData = {
        firstName: summaryValues.firstName,
        lastName: summaryValues.lastName,
        email: summaryValues.email,
        mobile: summaryValues.mobile,
        password: 'Tsms@1234', // Default password for physical registration
        role: 'student',
        // Additional fields for physical registration
        nic: summaryValues.idNumber || '',
        gender: summaryValues.gender,
        age: summaryValues.age,
        parentName: summaryValues.parentName,
        parentMobile: summaryValues.parentMobile,
        stream: summaryValues.stream,
        dateOfBirth: summaryValues.dob,
        school: summaryValues.school,
        address: summaryValues.address,
        district: summaryValues.district
      };

      // Call backend registration API
      const response = await register(registrationData);
      
      if (response.success) {
        // Create barcode object for display using the generated userid
        const barcodeObj = {
          id: response.userid,
          barcodeData: response.userid,
          studentName: `${summaryValues.firstName} ${summaryValues.lastName}`,
          generatedAt: new Date().toISOString()
        };
        
        setGeneratedBarcode(barcodeObj);
        setRegistrationSuccess(true);
        setRegisteredStudent({
          studentId: response.userid,
        firstName: summaryValues.firstName,
        lastName: summaryValues.lastName,
        nic: summaryValues.idNumber || '',
        gender: summaryValues.gender,
        age: summaryValues.age,
        email: summaryValues.email,
        phone: summaryValues.mobile,
        parentName: summaryValues.parentName,
        parentPhone: summaryValues.parentMobile,
        stream: summaryValues.stream,
        dateOfBirth: summaryValues.dob,
        school: summaryValues.school,
        address: summaryValues.address,
        district: summaryValues.district,
        dateJoined: new Date().toISOString().split('T')[0],
          enrolledClasses: []
        });
        
        // Save barcode data to backend
        try {
          await saveBarcode(response.userid, response.userid, `${summaryValues.firstName} ${summaryValues.lastName}`);
          console.log('Barcode data saved to backend');
        } catch (error) {
          console.error('Failed to save barcode data:', error);
          // Don't fail the registration if barcode save fails
        }
        
        // Generate barcode on canvas after a short delay to ensure DOM is ready
        setTimeout(() => {
          generateBarcodeOnCanvas(response.userid, 'success-barcode-display');
        }, 100);
        
        console.log('Physical registration successful! Student ID:', response.userid);
      } else {
        alert(response.message || 'Registration failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Generate barcode on canvas when success state is shown
  useEffect(() => {
    if (registrationSuccess && generatedBarcode) {
      setTimeout(() => {
        const canvas = document.getElementById('success-barcode-display');
        if (canvas) {
          try {
            JsBarcode('#success-barcode-display', generatedBarcode.barcodeData, {
              format: 'CODE128',
              width: 1.5,
              height: 30,
              displayValue: true,
              fontSize: 10,
              margin: 3,
              background: '#ffffff',
              lineColor: '#000000'
            });
          } catch (error) {
            console.error('Error generating barcode:', error);
          }
        }
      }, 300);
    }
  }, [registrationSuccess, generatedBarcode]);

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
            Physical Student Registration
          </span>
        </div>
        <div className="w-full max-w-md">
          {step === 1 && (
            <BasicForm
              initialValues={step1Values}
              validationSchema={step1Schema}
              onSubmit={handleStep1}
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
                      id="idNumber"
                      name="idNumber"
                      type="text"
                    label="NIC If Available"
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
                  <div className="flex gap-4 mt-2">
                    <CustomButton type="button" onClick={() => setStep(1)}>
                      Back
                    </CustomButton>
                    <CustomButton type="submit">
                      Next
                    </CustomButton>
                  </div>
                </>
              )}
            </BasicForm>
          )}
          {step === 2 && (
            <Formik
              initialValues={manualFields}
              validationSchema={Yup.object().shape({
                dob: Yup.date()
                  .max(new Date(), 'Date of birth cannot be in the future')
                  .required('Date of birth is required'),
                age: Yup.number()
                  .min(5, 'Age must be at least 5')
                  .max(100, 'Age must be less than 100')
                  .required('Age is required'),
                gender: Yup.string()
                  .matches(genderRegex, 'Gender must be Male or Female')
                  .required('Gender is required'),
                email: Yup.string().email('Invalid email'),
                school: Yup.string().min(2, 'School name must be at least 2 characters').required('School is required'),
                stream: Yup.string().oneOf(allowedStreams, 'Invalid stream').required('Stream is required'),
                address: Yup.string().min(5, 'Address must be at least 5 characters').required('Address is required'),
                district: Yup.string().oneOf(allowedDistricts, 'Invalid district').required('District is required'),
                parentName: Yup.string().min(2, 'Parent name must be at least 2 characters').required('Parent name is required'),
                parentMobile: Yup.string()
                  .matches(phoneRegex, 'Invalid phone number (should be 10 digits, start with 0)')
                  .required('Parent mobile number is required'),
              })}
              validateOnMount={false}
              onSubmit={(values, { setSubmitting, setTouched, setErrors, validateForm }) => {
                validateForm().then(errors => {
                  if (Object.keys(errors).length > 0) {
                    alert('Please enter all required values.');
                    setTouched({
                      dob: true, age: true, gender: true, email: true, school: true, stream: true, address: true, district: true, parentName: true, parentMobile: true
                    });
                    setSubmitting(false);
                  } else {
                    handleStep2(values);
                  }
                });
              }}
            >
              {({ errors, touched, handleChange, values, handleSubmit, isSubmitting, submitCount }) => (
                <form className='flex flex-col w-full space-y-4' onSubmit={e => {
                  handleSubmit(e);
                  if (Object.keys(errors).length > 0) {
                    const firstErrorField = Object.keys(errors)[0];
                    const el = document.getElementsByName(firstErrorField)[0];
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}>
                  {submitCount > 0 && Object.keys(errors).length > 0 && (
                    <div className='bg-red-100 text-red-700 p-2 rounded mb-2 text-xs font-semibold'>
                      Please fix the errors below before continuing.
                    </div>
                  )}
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
                      {allowedStreams.map(s => <option key={s} value={s}>{s}</option>)}
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
                        {allowedDistricts.map(d => <option key={d} value={d}>{d}</option>)}
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
                  <div className="flex gap-4 mt-2">
                    <CustomButton type="button" onClick={() => setStep(1)}>
                      Back
                    </CustomButton>
                    <CustomButton type="submit" disabled={isSubmitting}>
                      Next
                    </CustomButton>
                  </div>
                </form>
              )}
            </Formik>
          )}
          {step === 3 && (
            <div className="flex flex-col w-full space-y-4">
              {registrationSuccess ? (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">Student Registered Successfully!</h3>
                    <p className="text-gray-600">Generated Student ID: <span className="font-semibold text-blue-600">{generatedBarcode?.id}</span></p>
                  </div>
                  
                                     {generatedBarcode && (
                     <div className="bg-gray-50 p-3 rounded-lg mb-6">
                       <h4 className="font-medium text-gray-800 mb-2 text-center text-sm">Generated Barcode</h4>
                       <div className="flex justify-center mb-2">
                         <canvas id="success-barcode-display" className="border border-gray-300 max-w-xs"></canvas>
                       </div>
                       <p className="text-xs text-gray-600 text-center break-all">
                         {generatedBarcode.barcodeData}
                       </p>
                      <div className="mt-4">
                        <CustomButton
                          onClick={downloadBarcode}
                        >
                          Download Barcode
                        </CustomButton>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <CustomButton
                      onClick={() => {
                        setRegistrationSuccess(false);
                        setGeneratedBarcode(null);
                        setRegisteredStudent(null);
                        setStep(1);
                        setStep1Values({
                          firstName: '',
                          lastName: '',
                          idNumber: '',
                          mobile: '',
                        });
                        setManualFields({
                          dob: '',
                          age: '',
                          gender: '',
                          email: '',
                          school: '',
                          stream: '',
                          address: '',
                          district: '',
                          parentName: '',
                          parentMobile: '',
                        });
                        setSummaryValues({});
                      }}
                    >
                      Register Another Student
                    </CustomButton>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-[#1a365d] mb-2">Review Your Details</h2>
              <CustomTextField label="First Name" value={summaryValues.firstName} readOnly icon={FaUser} />
              <CustomTextField label="Last Name" value={summaryValues.lastName} readOnly icon={FaUser} />
                  <CustomTextField label="NIC" value={summaryValues.idNumber} readOnly icon={FaIdCard} />
              <CustomTextField label="Mobile" value={summaryValues.mobile} readOnly icon={FaPhone} />
              <CustomTextField label="Date of Birth" value={summaryValues.dob} readOnly icon={FaCalendarAlt} />
              <CustomTextField label="Age" value={summaryValues.age} readOnly icon={FaCalendarAlt} />
              <CustomTextField label="Gender" value={summaryValues.gender} readOnly icon={FaVenusMars} />
              <CustomTextField label="Email" value={summaryValues.email} readOnly icon={FaUser} />
              <CustomTextField label="School" value={summaryValues.school} readOnly icon={FaUser} />
              <CustomTextField label="Stream" value={summaryValues.stream} readOnly icon={FaUser} />
              <CustomTextField label="Address" value={summaryValues.address} readOnly icon={FaUser} />
              <CustomTextField label="District" value={summaryValues.district} readOnly icon={FaUser} />
              <CustomTextField label="Parent Name" value={summaryValues.parentName} readOnly icon={FaUser} />
              <CustomTextField label="Parent Mobile Number" value={summaryValues.parentMobile} readOnly icon={FaPhone} />
              <div className="flex gap-4 mt-2">
                <CustomButton type="button" onClick={() => setStep(2)}>
                  Back
                </CustomButton>
                    <CustomButton 
                      type="button" 
                      onClick={handleRegister}
                      disabled={isRegistering}
                    >
                      {isRegistering ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Registering...
                        </div>
                      ) : (
                        'Register'
                      )}
                </CustomButton>
              </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default PhysicalStudentRegisterTab;
