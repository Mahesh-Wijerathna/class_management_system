import React, { useState } from 'react';
import BasicAlertBox from '../../../components/BasicAlertBox';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import CustomButton from '../../../components/CustomButton';
import BasicTable from '../../../components/BasicTable';
import BasicForm from '../../../components/BasicForm';
import { FieldArray } from 'formik';
import CustomTextField from '../../../components/CustomTextField';
import { FaEdit, FaTrash, FaUser, FaEnvelope, FaPhone, FaIdCard, FaUserGraduate, FaBook, FaCalendar } from 'react-icons/fa';
import * as Yup from 'yup';
import CustomSelectField from '../../../components/CustomSelectField';

// Helper to parse NIC (Sri Lankan)
function parseNIC(nic) {
  let year, month, day, gender;
  let nicStr = nic.toString().toUpperCase();
  if (/^\d{9}[VX]$/.test(nicStr)) {
    year = '19' + nicStr.substring(0, 2);
    let days = parseInt(nicStr.substring(2, 5), 10);
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
  const mm = today.getMonth() - birthDate.getMonth();
  if (mm < 0 || (mm === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return { dob, gender, age };
}


const initialStudents = [
  {
    studentId: '99985530',
    nic: '200805202345',
    firstName: 'Januli',
    lastName: 'Liyanage',
    gender: 'Female',
    age: 17,
    email: 'januli.liyanage@email.com',
    phone: '0771234567',
    parentName: 'Nimal Liyanage',
    parentPhone: '0778888888',
    stream: 'A/L-Science',
    dateOfBirth: '2008-05-02',
    school: 'Sujatha Vidyalaya',
    address: '123 Main St, Apt 4B, Matara',
    district: 'Matara',
    dateJoined: '2023-09-15',
    enrolledClasses: [
      { subject: 'Mathematics', teacher: 'Mr. Perera', schedule: 'Mon 8:00-10:00 AM', hall: 'Hall 1' },
      { subject: 'Science', teacher: 'Ms. Silva', schedule: 'Wed 10:00-12:00 PM', hall: 'Hall 2' },
    ],
  },
  {
    studentId: '99965474',
    nic: '200711223456',
    firstName: 'Sithum',
    lastName: 'Prabhashana',
    gender: 'Male',
    age: 18,
    email: 'sithum.prabhashana@email.com',
    phone: '0772345678',
    parentName: 'Sunil Prabhashana',
    parentPhone: '0779999999',
    stream: 'A/L-Art',
    dateOfBirth: '2007-11-22',
    school: 'Rahula College',
    address: '456 Lake Rd, Floor 2, Matara',
    district: 'Matara',
    dateJoined: '2022-11-22',
    enrolledClasses: [
      { subject: 'English', teacher: 'Ms. Wickramasinghe', schedule: 'Tue 9:00-11:00 AM', hall: 'Hall 4' },
      { subject: 'ICT', teacher: 'Ms. Jayasinghe', schedule: 'Sat 9:00-11:00 AM', hall: 'Lab 1' },
    ],
  },
  {
    studentId: '99935041',
    nic: '200902123789',
    firstName: 'Sithnula',
    lastName: 'Geesan',
    gender: 'Male',
    age: 16,
    email: 'sithnula.geesan@email.com',
    phone: '0773456789',
    parentName: 'Ruwan Geesan',
    parentPhone: '0777777777',
    stream: 'O/L',
    dateOfBirth: '2009-02-12',
    school: 'St. Thomas College',
    address: '789 River Ave, Block C, Matara',
    district: 'Matara',
    dateJoined: '2024-02-12',
    enrolledClasses: [
      { subject: 'History', teacher: 'Mr. Bandara', schedule: 'Thu 1:00-3:00 PM', hall: 'Hall 5' },
      { subject: 'Mathematics', teacher: 'Mr. Perera', schedule: 'Mon 8:00-10:00 AM', hall: 'Hall 1' },
    ],
  },
  {
    studentId: '99892421',
    nic: '201007063456',
    firstName: 'Pasindi',
    lastName: 'Vidana Pathirana',
    gender: 'Female',
    age: 15,
    email: 'pasindi.vidana@email.com',
    phone: '0774567890',
    parentName: 'Kumari Pathirana',
    parentPhone: '0776666666',
    stream: 'A/L-Maths',
    dateOfBirth: '2010-07-06',
    school: 'Sujatha Vidyalaya',
    address: '321 Hill Rd, Suite 10, Matara',
    district: 'Matara',
    dateJoined: '2023-07-06',
    enrolledClasses: [
      { subject: 'Buddhism', teacher: 'Ven. Rathana', schedule: 'Thu 10:00-12:00 PM', hall: 'Hall 7' },
      { subject: 'Science', teacher: 'Ms. Silva', schedule: 'Wed 10:00-12:00 PM', hall: 'Hall 2' },
    ],
  },
  {
    studentId: '99820651',
    nic: '200611033123',
    firstName: 'Thisuli',
    lastName: 'Thumalja',
    gender: 'Female',
    age: 19,
    email: 'thisuli.thumalja@email.com',
    phone: '0775678901',
    parentName: 'Saman Thumalja',
    parentPhone: '0775555555',
    stream: 'A/L-Science',
    dateOfBirth: '2006-11-03',
    school: 'Visakha Vidyalaya',
    address: '654 Ocean View, Colombo 7, Colombo',
    district: 'Colombo',
    dateJoined: '2022-03-07',
    enrolledClasses: [
      { subject: 'English', teacher: 'Ms. Wickramasinghe', schedule: 'Tue 9:00-11:00 AM', hall: 'Hall 4' },
      { subject: 'Mathematics', teacher: 'Mr. Perera', schedule: 'Mon 8:00-10:00 AM', hall: 'Hall 1' },
      { subject: 'Science', teacher: 'Ms. Silva', schedule: 'Wed 10:00-12:00 PM', hall: '' },
    ],
  },
];

const streamOptions = [
  'O/L',
  'A/L-Art',
  'A/L-Maths',
  'A/L-Science',
  'A/L-Commerce',
  'A/L-Technology',
  'Primary',
];

const genderOptions = [
    'Male',
    'Female',
];

const validationSchema = Yup.object().shape({
  studentId: Yup.string().required('Student ID is required'),
  firstName: Yup.string().min(2, 'First name must be at least 2 characters').required('First name is required'),
  lastName: Yup.string().min(2, 'Last name must be at least 2 characters').required('Last name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  stream: Yup.string().oneOf(streamOptions, 'Invalid stream').required('Stream is required'),
  dateOfBirth: Yup.string().required('Date of Birth is required'),
  gender: Yup.string().oneOf(genderOptions, 'Invalid gender').required('Gender is required'),
  school: Yup.string().required('School is required'),
  address: Yup.string().required('Address is required'),
  district: Yup.string().required('District is required'),
  phone: Yup.string().required('Mobile is required'),
  parentName: Yup.string().required('Parent name is required'),
  parentPhone: Yup.string().required('Parent mobile number is required'),
  enrolledClasses: Yup.array().of(
    Yup.object().shape({
      subject: Yup.string().required('Subject is required'),
      teacher: Yup.string().required('Teacher is required'),
      schedule: Yup.string(),
      hall: Yup.string(),
    })
  ),
});



const StudentEnrollment = () => {
  const [students, setStudents] = useState(initialStudents);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editValues, setEditValues] = useState({});

  // Stylish alert state
  const [alertBox, setAlertBox] = useState({ open: false, message: '', onConfirm: null, onCancel: null, confirmText: 'OK', cancelText: 'Cancel', type: 'info' });
  const [saveAlert, setSaveAlert] = useState({ open: false, message: '', onConfirm: null, confirmText: 'OK', type: 'success' });

  const openAlert = (message, onConfirm, options = {}) => {
    setAlertBox({
      open: true,
      message,
      onConfirm: onConfirm || (() => setAlertBox(a => ({ ...a, open: false }))),
      onCancel: options.onCancel || (() => setAlertBox(a => ({ ...a, open: false }))),
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Cancel',
      type: options.type || 'info',
    });
  };

  const handleEdit = (student) => {
    setEditingStudent(student.studentId);
    setEditValues({
      ...student,
      enrolledClasses: Array.isArray(student.enrolledClasses)
        ? student.enrolledClasses.map(c => ({ ...c }))
        : [],
    });
    setShowEditModal(true);
  };

  // --- ALERT HANDLERS ---
  const showDeleteAlert = (studentId) => {
    openAlert(
      'Are you sure you want to delete this student?',
      () => {
        setAlertBox(a => ({ ...a, open: false }));
        setStudents(students.filter(s => s.studentId !== studentId));
      },
      { confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
    );
  };

  const showRemoveClassAlert = (remove, idx) => {
    openAlert(
      'Are you sure you want to remove this class from the student?',
      () => {
        setAlertBox(a => ({ ...a, open: false }));
        remove(idx);
      },
      { confirmText: 'Remove', cancelText: 'Cancel', type: 'danger' }
    );
  };

  const handleEditSubmit = (values) => {
    setStudents(students.map(s => s.studentId === values.studentId ? values : s));
    setEditingStudent(null);
    setShowEditModal(false);
    setSaveAlert({
      open: true,
      message: 'Student details saved successfully!',
      onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
      confirmText: 'OK',
      type: 'success',
    });
  };

  const handleCancel = () => {
    setShowEditModal(false);
    setEditValues({});
  };

  return (
    // <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Student Enrollment</h1>
        <p className="mb-6 text-gray-700">View, edit and remove registered students.</p>
        <BasicTable
          columns={[
            { key: 'studentId', label: 'Student ID' },
            { key: 'firstName', label: 'First Name', render: row => (
                <span className="flex items-center gap-1">
                  {row.gender === 'female' ? (
                    <span className="text-pink-500">&#9792;</span>
                  ) : (
                    <span className="text-blue-500">&#9794;</span>
                  )}
                  {row.firstName}
                </span>
              )
            },
            { key: 'lastName', label: 'Last Name', render: row => row.lastName },
            { key: 'dateOfBirth', label: 'Date of Birth' },
            { key: 'school', label: 'School' },
            { key: 'district', label: 'District' },
            { key: 'dateJoined', label: 'Date Joined' },
            { key: 'stream', label: 'Stream' },

          ]}
          data={students}
          actions={row => (
            <div className="flex gap-2">
              <button className="text-blue-600 hover:underline" onClick={() => handleEdit(row)} title="Edit"><FaEdit /></button>
              <button className="text-red-600 hover:underline" onClick={() => showDeleteAlert(row.studentId)} title="Delete"><FaTrash /></button>
            </div>
          )}
          className="mb-6"
        />

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-5xl max-h-[96vh] flex flex-col pointer-events-auto ml-64">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-xl font-bold">Edit Student</h2>
                <button
                  className="text-gray-500 hover:text-gray-800 text-2xl focus:outline-none"
                  onClick={handleCancel}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-4 flex-1">
                <BasicForm
                  initialValues={editValues}
                  validationSchema={validationSchema}
                  onSubmit={handleEditSubmit}
                >
                  {(formikProps) => {
                    const { values, handleChange, errors, touched, setFieldValue } = formikProps;
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <CustomTextField
                            id="dateJoined"
                            name="dateJoined"
                            type="date"
                            label="Joined Date *"
                            value={values.dateJoined || ''}
                            onChange={handleChange}
                            error={errors.dateJoined}
                            touched={touched.dateJoined}
                            icon={FaCalendar}
                          />
                          <CustomTextField
                            id="studentId"
                            name="studentId"
                            type="text"
                            label="Student ID *"
                            value={values.studentId}
                            onChange={handleChange}
                            error={errors.studentId}
                            touched={touched.studentId}
                            disabled
                            icon={FaIdCard}
                          />
                          <CustomTextField
                            id="nic"
                            name="nic"
                            type="text"
                            label="NIC (optional)"
                            value={values.nic || ''}
                            onChange={e => {
                              const { setFieldValue, handleChange } = formikProps;
                              handleChange(e);
                              const val = e.target.value;
                              const parsed = parseNIC(val);
                              if (parsed && typeof setFieldValue === 'function') {
                                setFieldValue('dateOfBirth', parsed.dob);
                                setFieldValue('age', parsed.age);
                                setFieldValue('gender', parsed.gender);
                              }
                            }}
                            error={errors.nic}
                            touched={touched.nic}
                            icon={FaIdCard}
                          />
                          <CustomTextField
                            id="firstName"
                            name="firstName"
                            type="text"
                            label="First Name *"
                            value={values.firstName || ''}
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
                            value={values.lastName || ''}
                            onChange={handleChange}
                            error={errors.lastName}
                            touched={touched.lastName}
                            icon={FaUser}
                          />
                          <CustomTextField
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            label="Date of Birth *"
                            value={values.dateOfBirth}
                            onChange={handleChange}
                            error={errors.dateOfBirth}
                            touched={touched.dateOfBirth}
                            icon={FaCalendar}
                          />
                          <CustomTextField
                            id="age"
                            name="age"
                            type="number"
                            label="Age"
                            value={values.age || ''}
                            onChange={handleChange}
                            error={errors.age}
                            touched={touched.age}
                            icon={FaCalendar}
                            disabled
                          />
                          <CustomSelectField
                            id="gender"
                            name="gender"
                            label="Gender"
                            value={values.gender}
                            onChange={handleChange}
                            options={[
                              { value: '', label: 'Select Gender' },
                              ...genderOptions.map(s => ({ value: s, label: s }))
                            ]}
                            error={errors.gender}
                            touched={touched.gender}
                            required
                            icon={FaBook}
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
                            id="school"
                            name="school"
                            type="text"
                            label="School"
                            value={values.school}
                            onChange={handleChange}
                            error={errors.school}
                            touched={touched.school}
                            icon={FaBook}
                          />
                          <CustomTextField
                            id="address"
                            name="address"
                            type="text"
                            label="Address"
                            value={values.address || ''}
                            onChange={handleChange}
                            error={errors.address}
                            touched={touched.address}
                            icon={FaBook}
                          />
                          <CustomTextField
                            id="district"
                            name="district"
                            type="text"
                            label="District *"
                            value={values.district}
                            onChange={handleChange}
                            error={errors.district}
                            touched={touched.district}
                            icon={FaBook}
                          />
                          
                          <CustomTextField
                            id="phone"
                            name="phone"
                            type="text"
                            label="Mobile"
                            value={values.phone}
                            onChange={handleChange}
                            error={errors.phone}
                            touched={touched.phone}
                            icon={FaPhone}
                          />
                          <CustomSelectField
                            id="stream"
                            name="stream"
                            label="Stream"
                            value={values.stream}
                            onChange={handleChange}
                            options={[
                              { value: '', label: 'Select Stream' },
                              ...streamOptions.map(s => ({ value: s, label: s }))
                            ]}
                            error={errors.stream}
                            touched={touched.stream}
                            required
                            icon={FaBook}
                          />
                          <CustomTextField
                            id="parentName"
                            name="parentName"
                            type="text"
                            label="Parent Name"
                            value={values.parentName || ''}
                            onChange={handleChange}
                            error={errors.parentName}
                            touched={touched.parentName}
                            icon={FaUser}
                          />
                          <CustomTextField
                            id="parentPhone"
                            name="parentPhone"
                            type="text"
                            label="Parent Mobile Number"
                            value={values.parentPhone || ''}
                            onChange={handleChange}
                            error={errors.parentPhone}
                            touched={touched.parentPhone}
                            icon={FaPhone}
                          />

                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Enrolled Classes</label>
                          <FieldArray name="enrolledClasses">
                            {({ push, remove }) => (
                              <div className="overflow-x-auto border rounded-lg bg-white">
                                <div className="max-h-64 overflow-y-auto">
                                  <table className="min-w-[900px] w-full border-separate border-spacing-0">
                                    <thead className="sticky top-0 z-10 bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300 sticky top-0 bg-gray-100">Subject</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300 sticky top-0 bg-gray-100">Teacher</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300 sticky top-0 bg-gray-100">Schedule</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 border-b border-gray-300 sticky top-0 bg-gray-100">Hall</th>
                                        <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border-b border-gray-300 sticky top-0 bg-gray-100">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {values.enrolledClasses && values.enrolledClasses.length > 0 ? (
                                        values.enrolledClasses.map((cls, idx) => (
                                          <tr key={idx} className="border-b hover:bg-blue-50 transition-colors">
                                            <td className="px-4 py-2 align-middle">
                                              <CustomTextField
                                                id={`enrolledClasses[${idx}].subject`}
                                                name={`enrolledClasses[${idx}].subject`}
                                                type="text"
                                                label=""
                                                value={cls.subject}
                                                onChange={handleChange}
                                                icon={FaBook}
                                                className="w-full focus:ring-2 focus:ring-blue-400"
                                              />
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                              <CustomTextField
                                                id={`enrolledClasses[${idx}].teacher`}
                                                name={`enrolledClasses[${idx}].teacher`}
                                                type="text"
                                                label=""
                                                value={cls.teacher}
                                                onChange={handleChange}
                                                icon={FaUser}
                                                className="w-full focus:ring-2 focus:ring-blue-400"
                                              />
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                              <CustomTextField
                                                id={`enrolledClasses[${idx}].schedule`}
                                                name={`enrolledClasses[${idx}].schedule`}
                                                type="text"
                                                label=""
                                                value={cls.schedule}
                                                onChange={handleChange}
                                                icon={FaCalendar}
                                                className="w-full focus:ring-2 focus:ring-blue-400"
                                              />
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                              <CustomTextField
                                                id={`enrolledClasses[${idx}].hall`}
                                                name={`enrolledClasses[${idx}].hall`}
                                                type="text"
                                                label=""
                                                value={cls.hall}
                                                onChange={handleChange}
                                                icon={FaBook}
                                                className="w-full focus:ring-2 focus:ring-blue-400"
                                              />
                                            </td>
                                            <td className="px-4 py-2 text-center align-middle">
                                              <button
                                                type="button"
                                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-semibold shadow focus:outline-none focus:ring-2 focus:ring-red-400"
                                                onClick={() => showRemoveClassAlert(remove, idx)}
                                              >
                                                Remove
                                              </button>
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan={5} className="text-center text-gray-400 italic py-2">No enrolled classes</td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                                <button
                                  type="button"
                                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-bold shadow focus:outline-none focus:ring-2 focus:ring-green-400"
                                  onClick={() => push({ subject: '', teacher: '', schedule: '', hall: '' })}
                                >
                                  + Add Class
                                </button>
                              </div>
                            )}
                          </FieldArray>
                        </div>
                        <div className="flex flex-row gap-4 mt-8 mb-2">
                          <CustomButton
                            type="button"
                            onClick={handleCancel}
                            className="w-1/2 py-3 px-4 bg-gray-200 text-gray-700 text-base font-bold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 shadow-md hover:shadow-xl"
                          >
                            Cancel
                          </CustomButton>
                          <CustomButton
                            type="submit"
                            className="w-1/2 py-3 px-4 bg-[#1a365d] text-white text-base font-bold rounded-lg hover:bg-[#13294b] active:bg-[#0f2038] focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:ring-opacity-50 shadow-md hover:shadow-xl"
                          >
                            Save
                          </CustomButton>
                        </div>
                      </>
                    );
                  }}
                </BasicForm>
              </div>
            </div>
          </div>
        )}

        <BasicAlertBox
          open={alertBox.open}
          message={alertBox.message}
          onConfirm={alertBox.onConfirm}
          onCancel={alertBox.onCancel}
          confirmText={alertBox.confirmText}
          cancelText={alertBox.cancelText}
          type={alertBox.type}
        />
        <BasicAlertBox
          open={saveAlert.open}
          message={saveAlert.message}
          onConfirm={saveAlert.onConfirm}
          confirmText={saveAlert.confirmText}
          type={saveAlert.type}
        />
      </div>
    /* </DashboardLayout> */
  );
};

export default StudentEnrollment;
