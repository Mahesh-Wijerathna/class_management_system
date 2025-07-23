import React, { useState } from 'react';
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

const initialStudents = [
  {
    studentId: '99985530',
    name: 'Januli Liyanage',
    gender: 'Female',
    stream: 'A/L-Science',
    dateOfBirth: '2008-05-02',
    school: 'Sujatha Vidyalaya',
    district: 'Matara',
    dateJoined: '2023-09-15',
    image: '',
    enrolledClasses: [
      { subject: 'Mathematics', teacher: 'Mr. Perera', schedule: 'Mon 8:00-10:00 AM', hall: 'Hall 1' },
      { subject: 'Science', teacher: 'Ms. Silva', schedule: 'Wed 10:00-12:00 PM', hall: 'Hall 2' },
    ],
  },
  {
    studentId: '99965474',
    name: 'Sithum Prabhashana',
    gender: 'Male',
    stream: 'A/L-Art',
    dateOfBirth: '2007-11-22',
    school: '',
    district: 'Matara',
    dateJoined: '2022-11-22',
    image: '',
    enrolledClasses: [
      { subject: 'English', teacher: 'Ms. Wickramasinghe', schedule: 'Tue 9:00-11:00 AM', hall: 'Hall 4' },
      { subject: 'ICT', teacher: 'Ms. Jayasinghe', schedule: 'Sat 9:00-11:00 AM', hall: 'Lab 1' },
    ],
  },
  {
    studentId: '99935041',
    name: 'Sithnula Geesan',
    gender: 'Male',
    stream: 'O/L',
    dateOfBirth: '2009-02-12',
    school: 'St. Thomas College',
    district: 'Matara',
    dateJoined: '2024-02-12',
    image: '',
    enrolledClasses: [
      { subject: 'History', teacher: 'Mr. Bandara', schedule: 'Thu 1:00-3:00 PM', hall: 'Hall 5' },
      { subject: 'Mathematics', teacher: 'Mr. Perera', schedule: 'Mon 8:00-10:00 AM', hall: 'Hall 1' },
    ],
  },
  {
    studentId: '99892421',
    name: 'Pasindi Vidana Pathirana',
    gender: 'Female',
    stream: 'A/L-Maths',
    dateOfBirth: '2010-07-06',
    school: 'Sujatha Vidyalaya',
    district: 'Matara',
    dateJoined: '2023-07-06',
    image: '',
    enrolledClasses: [
      { subject: 'Buddhism', teacher: 'Ven. Rathana', schedule: 'Thu 10:00-12:00 PM', hall: 'Hall 7' },
      { subject: 'Science', teacher: 'Ms. Silva', schedule: 'Wed 10:00-12:00 PM', hall: 'Hall 2' },
    ],
  },
  {
    studentId: '99820651',
    name: 'Thisuli Thumalja',
    gender: 'Female',
    stream: 'A/L-Science',
    dateOfBirth: '2006-11-03',
    school: '',
    district: 'Colombo',
    dateJoined: '2022-03-07',
    image: '',
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
  name: Yup.string().min(2, 'Name must be at least 2 characters').required('Student name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phone: Yup.string().matches(/^0\d{9}$/, 'Invalid phone number (should be 10 digits, start with 0)').required('Phone number is required'),
//   grade: Yup.string().required('Grade is required'),
  stream: Yup.string().oneOf(streamOptions, 'Invalid stream').required('Stream is required'),
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
  // Move file input ref to component scope to comply with React hook rules
  const fileInputRef = React.useRef();

  // Custom alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertStudentId, setAlertStudentId] = useState(null);

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


  // Show custom alert modal
  const handleDelete = (studentId) => {
    setAlertStudentId(studentId);
    setShowAlert(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    setStudents(students.filter(s => s.studentId !== alertStudentId));
    setShowAlert(false);
    setAlertStudentId(null);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowAlert(false);
    setAlertStudentId(null);
  };

  const handleEditSubmit = (values) => {
    setStudents(students.map(s => s.studentId === values.studentId ? values : s));
    setEditingStudent(null);
    setShowEditModal(false);
  };

  const handleCancel = () => {
    setShowEditModal(false);
    setEditValues({});
  };

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Student Enrollment</h1>
        <p className="mb-6 text-gray-700">View, edit, and remove registered students.</p>
        <BasicTable
          columns={[
            {
              key: 'image',
              label: 'Image',
              render: row => (
                row.image ? (
                  <img
                    src={row.image}
                    alt={row.name || 'Student'}
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                ) : (
                  <span className="inline-block w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <FaUser className="text-gray-400 text-lg" />
                  </span>
                )
              ),
            },
            { key: 'studentId', label: 'Student ID' },
            { key: 'name', label: 'Name', render: row => (
                <span className="flex items-center gap-1">
                  {row.gender === 'female' ? (
                    <span className="text-pink-500">&#9792;</span>
                  ) : (
                    <span className="text-blue-500">&#9794;</span>
                  )}
                  {row.name}
                </span>
              )
            },
            { key: 'dateOfBirth', label: 'Date of Birth' },
            { key: 'school', label: 'School' },
            { key: 'district', label: 'District' },
            { key: 'dateJoined', label: 'Date Joined' },
            { key: 'stream', label: 'Stream' },
            // { key: 'enrolledClasses', label: 'Enrolled Classes', render: row => (
            //     <ul className="list-disc pl-4">
            //       {Array.isArray(row.enrolledClasses) && row.enrolledClasses.length > 0
            //         ? row.enrolledClasses.map((c, i) => (
            //             <li key={i} className="mb-1">
            //               <span className="font-semibold">{c.subject}</span> <span className="text-gray-500">({c.teacher})</span><br />
            //               <span className="text-xs text-gray-600">{c.schedule} | {c.hall}</span>
            //             </li>
            //           ))
            //         : <li className="text-gray-400 italic">None</li>}
            //     </ul>
            //   )
            // },
          ]}
          data={students}
          actions={row => (
            <div className="flex gap-2">
              <button className="text-blue-600 hover:underline" onClick={() => handleEdit(row)} title="Edit"><FaEdit /></button>
              <button className="text-red-600 hover:underline" onClick={() => handleDelete(row.studentId)} title="Delete"><FaTrash /></button>
            </div>
          )}
          className="mb-6"
        />

        {/* Custom Alert Modal for Delete Confirmation */}
        {showAlert && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col items-center">
              <div className="text-lg font-semibold mb-4 text-center">Are you sure you want to delete this student?</div>
              <div className="flex gap-4 mt-2">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-semibold"
                  onClick={cancelDelete}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                  onClick={confirmDelete}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
                onClick={handleCancel}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-semibold mb-4">Edit Student</h2>
              <BasicForm
                initialValues={editValues}
                validationSchema={validationSchema}
                onSubmit={handleEditSubmit}
              >
                {(formikProps) => {
                  const { values, handleChange, errors, touched, setFieldValue } = formikProps;
                  // Image upload handler
                  const handleImageChange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof setFieldValue === 'function') {
                          setFieldValue('image', reader.result, true); // force update
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  // Force re-render on image change by using key on img
                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Image upload with preview */}
                        <div className="flex flex-col items-center md:col-span-2 mb-2">
                          <div className="relative mb-2">
                            {values.image ? (
                              <img
                                key={values.image}
                                src={values.image}
                                alt="Student"
                                className="w-16 h-16 rounded-full object-cover border"
                                style={{ display: 'block' }}
                              />
                            ) : (
                              <span className="inline-block w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                <FaUser className="text-gray-400 text-2xl" />
                              </span>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImageChange}
                          />
                          <button
                            type="button"
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          >
                            Upload Image
                          </button>
                        </div>
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
                          id="name"
                          name="name"
                          type="text"
                          label="Student Name *"
                          value={values.name}
                          onChange={handleChange}
                          error={errors.name}
                          touched={touched.name}
                          icon={FaUserGraduate}
                        />
                        <CustomSelectField
                          id="gender"
                          name="gender"
                          label="gender"
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
                          id="dateJoined"
                          name="dateJoined"
                          type="date"
                          label="Date Joined *"
                          value={values.dateJoined}
                          onChange={handleChange}
                          error={errors.dateJoined}
                          touched={touched.dateJoined}
                          icon={FaCalendar}
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
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Enrolled Classes</label>
                          <FieldArray name="enrolledClasses">
                            {({ push, remove }) => (
                              <>
                                {values.enrolledClasses && values.enrolledClasses.length > 0 ? (
                                  <>
                                    {values.enrolledClasses.map((cls, idx) => (
                                      <div key={idx} className="flex flex-wrap gap-2 mb-2 items-end border-b pb-2">
                                        <CustomTextField
                                          id={`enrolledClasses[${idx}].subject`}
                                          name={`enrolledClasses[${idx}].subject`}
                                          type="text"
                                          label="Subject"
                                          value={cls.subject}
                                          onChange={handleChange}
                                          icon={FaBook}
                                          className="w-32"
                                        />
                                        <CustomTextField
                                          id={`enrolledClasses[${idx}].teacher`}
                                          name={`enrolledClasses[${idx}].teacher`}
                                          type="text"
                                          label="Teacher"
                                          value={cls.teacher}
                                          onChange={handleChange}
                                          icon={FaUser}
                                          className="w-32"
                                        />
                                        <CustomTextField
                                          id={`enrolledClasses[${idx}].schedule`}
                                          name={`enrolledClasses[${idx}].schedule`}
                                          type="text"
                                          label="Schedule"
                                          value={cls.schedule}
                                          onChange={handleChange}
                                          icon={FaCalendar}
                                          className="w-40"
                                        />
                                        <CustomTextField
                                          id={`enrolledClasses[${idx}].hall`}
                                          name={`enrolledClasses[${idx}].hall`}
                                          type="text"
                                          label="Hall"
                                          value={cls.hall}
                                          onChange={handleChange}
                                          icon={FaBook}
                                          className="w-28"
                                        />
                                        <button
                                          type="button"
                                          className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-semibold shadow"
                                          onClick={() => remove(idx)}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-semibold shadow"
                                      onClick={() => push({ subject: '', teacher: '', schedule: '', hall: '' })}
                                    >
                                      + Add Class
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-gray-400 italic">No enrolled classes</div>
                                    <button
                                      type="button"
                                      className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-semibold shadow"
                                      onClick={() => push({ subject: '', teacher: '', schedule: '', hall: '' })}
                                    >
                                      + Add Class
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </FieldArray>
                        </div>
                      </div>
                      <div className="flex flex-row gap-4 mt-6 mb-2">
                        <CustomButton
                          type="button"
                          onClick={handleCancel}
                          className="w-1/2 py-2.5 px-4 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 shadow-md hover:shadow-xl"
                        >
                          Cancel
                        </CustomButton>
                        <CustomButton
                          type="submit"
                          form="editStudentForm"
                          className="w-1/2 py-2.5 px-4 bg-[#1a365d] text-white text-xs font-bold rounded-lg hover:bg-[#13294b] active:bg-[#0f2038] focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:ring-opacity-50 shadow-md hover:shadow-xl"
                          onClick={() => { document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }}
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentEnrollment;
