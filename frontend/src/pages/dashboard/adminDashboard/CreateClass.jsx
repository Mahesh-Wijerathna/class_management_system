// (moved inside BasicForm render)
import React, { useState, useEffect } from 'react';
import BasicAlertBox from '../../../components/BasicAlertBox';
import BasicForm from '../../../components/BasicForm';
import CustomTextField from '../../../components/CustomTextField';
import CustomButton from '../../../components/CustomButton';
import CustomSelectField from '../../../components/CustomSelectField';
import { FaEdit, FaTrash, FaPlus, FaCalendar, FaBook, FaUser, FaClock, FaMoneyBill, FaVideo, FaUsers, FaGraduationCap, FaSync } from 'react-icons/fa';
import * as Yup from 'yup';
import BasicTable from '../../../components/BasicTable';
import { getAllClasses, createClass, updateClass, deleteClass } from '../../../api/classes';
import { getActiveTeachers } from '../../../api/teachers';


const streamOptions = [
  { value: '', label: 'Select Stream' },
  { value: 'O/L', label: 'O/L' },
  { value: 'A/L-Art', label: 'A/L-Art' },
  { value: 'A/L-Maths', label: 'A/L-Maths' },
  { value: 'A/L-Science', label: 'A/L-Science' },
  { value: 'A/L-Commerce', label: 'A/L-Commerce' },
  { value: 'A/L-Technology', label: 'A/L-Technology' },
  { value: 'Primary', label: 'Primary' },
];

const statusOptions = [
  { value: '', label: 'Select Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const validationSchema = Yup.object().shape({
  className: Yup.string().required('Class Name is required'),
  subject: Yup.string().required('Subject is required'),
  teacher: Yup.string().required('Teacher is required'),
  stream: Yup.string().oneOf(streamOptions.map(o => o.value), 'Invalid stream').required('Stream is required'),
  deliveryMethod: Yup.string().oneOf(['online', 'physical', 'hybrid', 'other'], 'Invalid delivery method').required('Delivery Method is required'),
  deliveryOther: Yup.string().when('deliveryMethod', {
    is: (val) => val === 'other',
    then: (schema) => schema.required('Please specify delivery method'),
    otherwise: (schema) => schema.notRequired(),
  }),
  schedule: Yup.object().shape({
    day: Yup.string().when('frequency', {
      is: 'no-schedule',
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema.required('Day is required'),
    }),
    startTime: Yup.string().when('frequency', {
      is: 'no-schedule',
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema.required('Start Time is required'),
    }),
    endTime: Yup.string().when('frequency', {
      is: 'no-schedule',
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema.required('End Time is required'),
    }),
    frequency: Yup.string().oneOf(['weekly', 'bi-weekly', 'monthly', 'no-schedule'], 'Invalid frequency').required('Frequency is required'),
  }),
  startDate: Yup.string().required('Start Date is required'),
  endDate: Yup.string().required('End Date is required').test('endDate', 'End Date must be after Start Date', function(value) {
    const { startDate } = this.parent;
    return !startDate || !value || value >= startDate;
  }),
  maxStudents: Yup.number().min(1, 'Must be at least 1').required('Maximum Students is required'),
  fee: Yup.number().min(0, 'Must be 0 or greater').required('Fee is required'),
  zoomLink: Yup.string().when('deliveryMethod', {
    is: (val) => val === 'online' || val === 'hybrid',
    then: (schema) => schema.required('Zoom Link is required'),
    otherwise: (schema) => schema.notRequired(), // Optional for 'other' and 'physical'
  }),
  courseType: Yup.string().oneOf(['theory', 'revision'], 'Invalid course type').required('Course Type is required'),
  status: Yup.string().oneOf(statusOptions.map(o => o.value), 'Invalid status').required('Status is required'),
});

const initialValues = {
  className: '',
  subject: '',
  teacher: '',
  teacherId: '',
  stream: '',
  deliveryMethod: 'online',
  deliveryOther: '',
  schedule: {
    day: '',
    startTime: '',
    endTime: '',
    frequency: 'weekly'
  },
  startDate: '',
  endDate: '',
  maxStudents: 30, // Changed from 0 to 30 (default class size)
  fee: 0, // Changed from '' to 0 (default fee)
  paymentTracking: false,
  paymentTrackingFreeDays: 7,
  zoomLink: '',
  description: '',
  courseType: 'theory',
  revisionDiscountPrice: '', 
  status: 'active' // Changed from '' to 'active' (default status)
};

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hour, minute] = timeStr.split(':');
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
}

function formatDay(day) {
  if (!day) return '';
  return day.charAt(0).toUpperCase() + day.slice(1);
}

const CreateClass = ({ onLogout }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(initialValues);
  const [submitKey, setSubmitKey] = useState(0);
  const [alertBox, setAlertBox] = useState({ open: false, message: '', onConfirm: null, onCancel: null, confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' });
  const [zoomLoading, setZoomLoading] = useState(false);
  const [zoomError, setZoomError] = useState('');
  // State for revision relation (must be at top level, not inside render callback)
  const [revisionRelation, setRevisionRelation] = React.useState('none'); // 'none' | 'related' | 'unrelated'
  // State for selected theory class id (for autofill)
  const [selectedTheoryId, setSelectedTheoryId] = React.useState('');
  // State for teachers
  const [teacherList, setTeacherList] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Load classes from backend
  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await getAllClasses();
      if (response.success) {
        setClasses(response.data || []);
      } else {
        console.error('Failed to load classes:', response.message);
        setClasses([]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Load teachers from backend
  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      console.log('Loading teachers...');
      const response = await getActiveTeachers();
      console.log('Teachers response:', response);
      if (response.success) {
        console.log('Teachers loaded successfully:', response.data?.length || 0, 'teachers');
        // Remove duplicates based on teacherId
        const uniqueTeachers = response.data?.filter((teacher, index, self) => 
          index === self.findIndex(t => t.teacherId === teacher.teacherId)
        ) || [];
        console.log('Unique teachers after filtering:', uniqueTeachers.length);
        setTeacherList(uniqueTeachers);
      } else {
        console.error('Failed to load teachers:', response.message);
        setTeacherList([]);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
      setTeacherList([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadClasses();
    loadTeachers();
  }, []);

  // Auto-sync myClasses with admin classes on component mount
  useEffect(() => {
    // Only sync if there are classes loaded
    if (classes.length > 0) {
      const hasUpdates = syncMyClassesWithAdminClasses();
      if (hasUpdates) {
        console.log('Auto-synced myClasses with admin classes on component mount');
      }
    }
  }, [classes]); // Run when classes change

  // Sync function to update myClasses with latest admin class data
  const syncMyClassesWithAdminClasses = () => {
    try {
      const myClasses = JSON.parse(localStorage.getItem('myClasses') || '[]');
      let hasUpdates = false;
      
      const updatedMyClasses = myClasses.map(studentClass => {
        // Find corresponding admin class
        const adminClass = classes.find(adminCls => 
          adminCls.id === studentClass.classId || adminCls.id === studentClass.id
        );
        
        if (adminClass) {
                     // Update student class with latest admin data while preserving student-specific data
           const updatedStudentClass = {
             ...studentClass,
             className: adminClass.className,
             subject: adminClass.subject,
             teacher: adminClass.teacher,
             stream: adminClass.stream,
             deliveryMethod: adminClass.deliveryMethod,
             schedule: adminClass.schedule,
             fee: adminClass.fee,
             maxStudents: adminClass.maxStudents,
             zoomLink: adminClass.zoomLink, // Update zoom link
             description: adminClass.description,
             courseType: adminClass.courseType,
             status: adminClass.status, // Update status (active/inactive)
             paymentTracking: adminClass.paymentTracking,
             paymentTrackingFreeDays: adminClass.paymentTrackingFreeDays,
             // Preserve student-specific data
             // paymentStatus, paymentMethod, purchaseDate, attendance, etc. remain unchanged
           };
          
          // Check if any updates were made
          if (JSON.stringify(studentClass) !== JSON.stringify(updatedStudentClass)) {
            hasUpdates = true;
          }
          
          return updatedStudentClass;
        }
        
        return studentClass;
      });
      
      if (hasUpdates) {
        localStorage.setItem('myClasses', JSON.stringify(updatedMyClasses));
        console.log('Synced myClasses with latest admin class data');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error syncing myClasses with admin classes:', error);
      return false;
    }
  };

  // Get teacher list from localStorage (from TeacherInfo.jsx)
  const teacherOptions = [
    { value: '', label: 'Select Teacher', key: 'select-teacher' },
    ...teacherList.map(t => ({ 
      value: `${t.designation} ${t.name}`, 
      label: `${t.designation} ${t.name}`,
      key: `teacher-${t.teacherId}` // Use teacherId as unique key
    }))
  ];
  
  console.log('Teacher list:', teacherList);
  console.log('Teacher options:', teacherOptions);

  const handleSubmit = async (values, { resetForm }) => {
    console.log('Form submitted with values:', values);
    let submitValues = { ...values };
    // If revision+related, always use related theory class values for main fields
    if (
      submitValues.courseType === 'revision' &&
      revisionRelation === 'related' &&
      selectedTheoryId
    ) {
      const related = classes.find(tc => String(tc.id) === String(selectedTheoryId));
      if (related) {
        submitValues = {
          ...submitValues,
          className: related.className,
          subject: related.subject,
          teacher: related.teacher,
          teacherId: related.teacherId,
          stream: related.stream,
          deliveryMethod: related.deliveryMethod,
          schedule: { ...related.schedule },
          startDate: related.startDate,
          endDate: related.endDate,
          maxStudents: related.maxStudents,
          zoomLink: related.zoomLink || submitValues.zoomLink, // Keep user's zoom link if related doesn't have one
          description: related.description,
          relatedTheoryId: related.id,
        };
      }
    } else if (submitValues.courseType === 'revision' && revisionRelation === 'unrelated') {
      // For revision+unrelated, ensure relatedTheoryId is not set
      submitValues.relatedTheoryId = null; // Changed from '' to null
    } else if (submitValues.courseType === 'theory') {
      // For theory, ensure relatedTheoryId is not set
      submitValues.relatedTheoryId = null; // Changed from '' to null
    }
    // Always ensure teacherId is set if teacher is selected
    if (!submitValues.teacherId && submitValues.teacher) {
      console.log('Looking for teacher:', submitValues.teacher);
      console.log('Available teachers:', teacherList);
      const found = teacherList.find(t => `${t.designation} ${t.name}` === submitValues.teacher);
      console.log('Found teacher:', found);
      if (found) submitValues.teacherId = found.teacherId;
    }
    // Always ensure fee and revisionDiscountPrice are numbers
    submitValues.fee = submitValues.fee ? Number(submitValues.fee) : 0;
    if (submitValues.revisionDiscountPrice) {
      submitValues.revisionDiscountPrice = Number(submitValues.revisionDiscountPrice);
    } else {
      submitValues.revisionDiscountPrice = null; // Convert empty string to null
    }
    // Add payment tracking logic
    let paymentTrackingObj = { enabled: false };
    if (submitValues.paymentTracking && submitValues.startDate) {
      // Use user input for free days, default to 7 if not set
      const freeDays = Number(submitValues.paymentTrackingFreeDays) || 7;
      const start = new Date(submitValues.startDate);
      const freeUntil = new Date(start);
      freeUntil.setDate(start.getDate() + freeDays);
      paymentTrackingObj = {
        enabled: true,
        startDate: submitValues.startDate,
        freeUntil: freeUntil.toISOString().slice(0, 10),
        freeDays,
        active: true
      };
    }
    // Ensure submitValues has the required structure
    const normalizedSubmitValues = {
      ...submitValues,
      schedule: submitValues.schedule || { day: '', startTime: '', endTime: '', frequency: 'weekly' },
      fee: submitValues.fee || 0,
      maxStudents: submitValues.maxStudents || 50,
      status: submitValues.status || 'active',
      paymentTracking: paymentTrackingObj,
      zoomLink: submitValues.zoomLink || '', // Ensure zoom link is included
      description: submitValues.description || ''
    };

    // Debug: Log the normalized values to see if zoom link is included
    console.log('Saving class with zoom link:', normalizedSubmitValues.zoomLink);
    
    if (editingId) {
      // Update the class using API
      try {
        const response = await updateClass(editingId, normalizedSubmitValues);
        if (response.success) {
          // Reload classes from backend
          await loadClasses();
      
          // Also update the class in students' myClasses if it exists
          try {
            const myClasses = JSON.parse(localStorage.getItem('myClasses') || '[]');
            const updatedMyClasses = myClasses.map(studentClass => {
              if (studentClass.classId === editingId || studentClass.id === editingId) {
                // Update the class data while preserving student-specific data
                return {
                  ...studentClass,
                  className: normalizedSubmitValues.className,
                  subject: normalizedSubmitValues.subject,
                  teacher: normalizedSubmitValues.teacher,
                  stream: normalizedSubmitValues.stream,
                  deliveryMethod: normalizedSubmitValues.deliveryMethod,
                  schedule: normalizedSubmitValues.schedule,
                  fee: normalizedSubmitValues.fee,
                  maxStudents: normalizedSubmitValues.maxStudents,
                  zoomLink: normalizedSubmitValues.zoomLink, // Update zoom link
                  description: normalizedSubmitValues.description,
                  courseType: normalizedSubmitValues.courseType,
                  status: normalizedSubmitValues.status, // Update status (active/inactive)
                  paymentTracking: normalizedSubmitValues.paymentTracking,
                  paymentTrackingFreeDays: normalizedSubmitValues.paymentTrackingFreeDays,
                  // Preserve student-specific data
                  // paymentStatus, paymentMethod, purchaseDate, attendance, etc. remain unchanged
                };
              }
              return studentClass;
            });
            
            localStorage.setItem('myClasses', JSON.stringify(updatedMyClasses));
            console.log('Updated class in myClasses localStorage for existing students');
          } catch (error) {
            console.error('Error updating myClasses localStorage:', error);
          }
          
          setEditingId(null);
          setAlertBox({
            open: true,
            message: 'Class updated successfully! All enrolled students will see the updated information.',
            onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
            onCancel: null,
            confirmText: 'OK',
            cancelText: '',
            type: 'success',
          });
        } else {
          setAlertBox({
            open: true,
            message: 'Failed to update class. Please try again.',
            onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
            onCancel: null,
            confirmText: 'OK',
            cancelText: '',
            type: 'danger',
          });
        }
      } catch (error) {
        console.error('Error updating class:', error);
        setAlertBox({
          open: true,
          message: 'Failed to update class. Please try again.',
          onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
          onCancel: null,
          confirmText: 'OK',
          cancelText: '',
          type: 'danger',
        });
      }
    } else {
      // Create new class using API
      try {
        console.log('Creating class with data:', normalizedSubmitValues);
        const response = await createClass(normalizedSubmitValues);
        console.log('Create class response:', response);
        if (response.success) {
          // Reload classes from backend
          await loadClasses();
      setAlertBox({
        open: true,
        message: 'Class created successfully!',
        onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
        onCancel: null,
        confirmText: 'OK',
        cancelText: '',
        type: 'success',
      });
        } else {
          console.error('Create class failed:', response);
          setAlertBox({
            open: true,
            message: response.message || 'Failed to create class. Please try again.',
            onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
            onCancel: null,
            confirmText: 'OK',
            cancelText: '',
            type: 'danger',
          });
        }
      } catch (error) {
        console.error('Error creating class:', error);
        setAlertBox({
          open: true,
          message: `Error creating class: ${error.message}`,
          onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
          onCancel: null,
          confirmText: 'OK',
          cancelText: '',
          type: 'danger',
        });
      }
    }
    // Reset form but preserve zoom link if it was generated
    const currentZoomLink = values.zoomLink;
    resetForm();
    setFormValues({
      ...initialValues,
      zoomLink: currentZoomLink || '' // Preserve the zoom link
    });
    setSubmitKey(prev => prev + 1);
  };

  const handleEdit = (id) => {
    const cls = classes.find(c => c.id === id);
    if (cls) {
      setFormValues(cls);
      setEditingId(id);
      setSubmitKey(prev => prev + 1);
    }
  };

  const handleDelete = (id) => {
    setAlertBox({
      open: true,
      message: 'Are you sure you want to delete this class? This will also remove it from all enrolled students.',
      onConfirm: async () => {
        try {
          const response = await deleteClass(id);
          if (response.success) {
            // Reload classes from backend
            await loadClasses();
        
        // Also remove from students' myClasses if it exists
        try {
          const myClasses = JSON.parse(localStorage.getItem('myClasses') || '[]');
          const updatedMyClasses = myClasses.filter(studentClass => 
            studentClass.classId !== id && studentClass.id !== id
          );
          
          localStorage.setItem('myClasses', JSON.stringify(updatedMyClasses));
          console.log('Removed class from myClasses localStorage for all students');
        } catch (error) {
          console.error('Error removing class from myClasses localStorage:', error);
        }
        
        if (editingId === id) {
          setEditingId(null);
          setFormValues(initialValues);
          setSubmitKey(prev => prev + 1);
        }
            
            setAlertBox({
              open: true,
              message: 'Class deleted successfully!',
              onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
              onCancel: null,
              confirmText: 'OK',
              cancelText: '',
              type: 'success',
            });
          } else {
            setAlertBox({
              open: true,
              message: 'Failed to delete class. Please try again.',
              onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
              onCancel: null,
              confirmText: 'OK',
              cancelText: '',
              type: 'danger',
            });
          }
        } catch (error) {
          console.error('Error deleting class:', error);
          setAlertBox({
            open: true,
            message: 'Failed to delete class. Please try again.',
            onConfirm: () => setAlertBox(a => ({ ...a, open: false })),
            onCancel: null,
            confirmText: 'OK',
            cancelText: '',
            type: 'danger',
          });
        }
      },
      onCancel: () => setAlertBox(a => ({ ...a, open: false })),
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
  };

  // Sync formValues with related theory class when selectedTheoryId changes (for revision+related)
  useEffect(() => {
    if (!selectedTheoryId) return;
    if (formValues.courseType !== 'revision' || revisionRelation !== 'related') return;
    const related = classes.find(tc => String(tc.id) === String(selectedTheoryId));
    if (related) {
      setFormValues(prev => ({
        ...prev,
        className: related.className,
        subject: related.subject,
        teacher: related.teacher,
        teacherId: related.teacherId,
        stream: related.stream,
        deliveryMethod: related.deliveryMethod,
        schedule: { ...related.schedule },
        startDate: related.startDate,
        endDate: related.endDate,
        maxStudents: related.maxStudents,
        zoomLink: related.zoomLink,
        description: related.description,
        relatedTheoryId: related.id,
        // Do NOT overwrite fee or revisionDiscountPrice here!
        status: 'active',
      }));
    }
  }, [selectedTheoryId, formValues.courseType, revisionRelation, classes]);

  return (
    <>
      <BasicAlertBox
        open={alertBox.open}
        message={alertBox.message}
        onConfirm={alertBox.onConfirm}
        onCancel={alertBox.onCancel}
        confirmText={alertBox.confirmText}
        cancelText={alertBox.cancelText}
        type={alertBox.type}
      />
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Class Management</h1>
        <p className="mb-6 text-gray-700">Create, update, and manage classes with different delivery methods and course types.</p>

        <BasicForm
          key={submitKey}
          initialValues={formValues}
          enableReinitialize={true}
          validationSchema={validationSchema}
          validationContext={{ courseType: formValues.courseType }}
          onSubmit={handleSubmit}

        >
          {(props) => {
            const { errors, touched, handleChange, values, setFieldValue } = props;
            // Link teacher and teacherId
            const handleTeacherChange = (e) => {
              const selectedName = e.target.value;
              handleChange(e);
              const found = teacherList.find(t => `${t.designation} ${t.name}` === selectedName);
              if (found && setFieldValue) {
                setFieldValue('teacher', `${found.designation} ${found.name}`);
                setFieldValue('teacherId', found.teacherId); // Store TeacherId for display
              } else if (setFieldValue) {
                setFieldValue('teacherId', '');
              }
            };
            // Move handleGenerateZoomLink here so setFieldValue is in scope
            const handleGenerateZoomLink = async () => {
              setZoomLoading(true);
              setZoomError('');
              try {
                await new Promise(res => setTimeout(res, 1000));
                const randomId = Math.floor(100000000 + Math.random() * 900000000);
                const zoomUrl = `https://zoom.us/j/${randomId}`;
                setFieldValue('zoomLink', zoomUrl);
              } catch (err) {
                setZoomError('Failed to generate Zoom link. Please try again.');
              } finally {
                setZoomLoading(false);
              }
            };

            // Get all theory classes for dropdown
            const theoryClasses = classes.filter(c => c.courseType === 'theory');

            // Autofill revision fields when related theory class is selected
            const handleRelatedTheoryChange = (e) => {
              const selectedId = e.target.value;
              setSelectedTheoryId(selectedId);
              const selectedTheory = theoryClasses.find(c => String(c.id) === String(selectedId));
              if (selectedTheory && setFieldValue) {
                // Set all required fields in Formik state
                setFieldValue('className', selectedTheory.className, false);
                setFieldValue('subject', selectedTheory.subject, false);
                setFieldValue('teacher', selectedTheory.teacher, false);
                setFieldValue('teacherId', selectedTheory.teacherId, false);
                setFieldValue('stream', selectedTheory.stream, false);
                setFieldValue('deliveryMethod', selectedTheory.deliveryMethod, false);
                setFieldValue('schedule.day', selectedTheory.schedule.day, false);
                setFieldValue('schedule.startTime', selectedTheory.schedule.startTime, false);
                setFieldValue('schedule.endTime', selectedTheory.schedule.endTime, false);
                setFieldValue('schedule.frequency', selectedTheory.schedule.frequency, false);
                setFieldValue('startDate', selectedTheory.startDate, false);
                setFieldValue('endDate', selectedTheory.endDate, false);
                setFieldValue('maxStudents', selectedTheory.maxStudents, false);
                setFieldValue('zoomLink', selectedTheory.zoomLink, false);
                setFieldValue('description', selectedTheory.description, false);
                setFieldValue('relatedTheoryId', selectedTheory.id, false); // for table mapping
                // Always require user to enter fee and discount for revision, so clear them
                setFieldValue('fee', '', false);
                setFieldValue('revisionDiscountPrice', '', false);
                setFieldValue('status', 'active', false);
              }
            };

            return (
              <div className="mb-8 space-y-6">
                {/* Course Type at the top */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Course Type *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="courseType"
                        value="theory"
                        checked={values.courseType === 'theory'}
                        onChange={e => {
                          handleChange(e);
                          setRevisionRelation('none');
                        }}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">Theory</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="courseType"
                        value="revision"
                        checked={values.courseType === 'revision'}
                        onChange={e => {
                          handleChange(e);
                          setRevisionRelation('none');
                        }}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">Revision</div>
                      </div>
                    </label>
                  </div>
                  {errors.courseType && touched.courseType && (
                    <div className="text-red-600 text-sm mt-1">{errors.courseType}</div>
                  )}
                </div>

                {/* If Revision, show related/unrelated options */}
                {values.courseType === 'revision' && (
                  <div className="flex flex-col md:flex-row items-center gap-4 p-3 bg-blue-50 rounded-lg">
                    <label className="text-sm text-blue-800 font-medium min-w-max">Revision Class Relation:</label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="revisionRelation"
                        value="related"
                        checked={revisionRelation === 'related'}
                        onChange={() => setRevisionRelation('related')}
                        className="mr-2"
                      />
                      <span>Related Theory Class</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="revisionRelation"
                        value="unrelated"
                        checked={revisionRelation === 'unrelated'}
                        onChange={() => setRevisionRelation('unrelated')}
                        className="mr-2"
                      />
                      <span>No Related Class</span>
                    </label>
                  </div>
                )}

                {/* If related, show theory class dropdown and autofill */}
                {values.courseType === 'revision' && revisionRelation === 'related' && (
                  <div className="flex flex-col md:flex-row items-center gap-4 p-3 bg-blue-100 rounded-lg">
                    <label className="text-sm text-blue-900 font-medium min-w-max">Select Related Theory Class:</label>
                    <select
                      className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={handleRelatedTheoryChange}
                      value={selectedTheoryId}
                    >
                      <option key="default-related-theory" value="">Select Theory Class</option>
                      {theoryClasses.map(tc => (
                        <option key={`theory-${tc.id}`} value={tc.id}>{tc.className} ({tc.subject}) - {tc.teacher}</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Basic Information */}
                {values.courseType === 'revision' && revisionRelation === 'related' && selectedTheoryId ? (
                  (() => {
                    const related = classes.find(tc => String(tc.id) === String(selectedTheoryId));
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 rounded p-3">
                          {/* Class Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                            <input type="text" className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900 w-full" value={related?.className || ''} disabled readOnly />
                            {/* Hidden input for Formik */}
                            <input type="hidden" name="className" value={related?.className || ''} />
                          </div>
                          {/* Subject */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                            <input type="text" className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900 w-full" value={related?.subject || ''} disabled readOnly />
                            <input type="hidden" name="subject" value={related?.subject || ''} />
                          </div>
                          {/* Teacher */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                            <input type="text" className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900 w-full" value={related?.teacher || ''} disabled readOnly />
                            <input type="hidden" name="teacher" value={related?.teacher || ''} />
                          </div>
                          {/* Stream */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stream *</label>
                            <input type="text" className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900 w-full" value={related?.stream || ''} disabled readOnly />
                            <input type="hidden" name="stream" value={related?.stream || ''} />
                          </div>
                        </div>
                        {/* Discount Price Input for Revision class (for theory students) - styled as in image */}
                        <div className="flex flex-col md:flex-row items-center gap-4 p-3 bg-blue-50 rounded-lg mt-2">
                          <label className="text-sm text-blue-800 font-medium min-w-max">Discount for Theory Students (Rs.)</label>
                          <input
                            type="number"
                            name="revisionDiscountPrice"
                            value={values.revisionDiscountPrice || ''}
                            onChange={handleChange}
                            min="0"
                            className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter discount price for theory students (Rs.)"
                          />
                        </div>

                      </>
                    );
                  })()
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomTextField
                      id="className"
                      name="className"
                      type="text"
                      label="Class Name *"
                      value={values.className}
                      onChange={handleChange}
                      error={errors.className}
                      touched={touched.className}
                      icon={FaGraduationCap}
                    />
                    <CustomTextField
                      id="subject"
                      name="subject"
                      type="text"
                      label="Subject *"
                      value={values.subject}
                      onChange={handleChange}
                      error={errors.subject}
                      touched={touched.subject}
                      icon={FaBook}
                    />
                    <CustomSelectField
                      id="teacher"
                      name="teacher"
                      label="Teacher *"
                      value={values.teacher}
                      onChange={handleTeacherChange}
                      options={teacherOptions}
                      error={errors.teacher}
                      touched={touched.teacher}
                      required
                    />
                    {/* Show Teacher ID after selecting Teacher Name */}
                    {values.teacher && (
                      <div className="flex flex-col justify-end">
                        <label className="text-xs font-medium text-gray-700 mb-1">Teacher ID</label>
                        <div className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-normal">
                          {teacherList.find(t => `${t.designation} ${t.name}` === values.teacher)?.teacherId || ''}
                        </div>
                      </div>
                    )}
                    <CustomSelectField
                      id="stream"
                      name="stream"
                      label="Stream *"
                      value={values.stream}
                      onChange={handleChange}
                      options={streamOptions}
                      error={errors.stream}
                      touched={touched.stream}
                      required
                    />
                  </div>
                )}
                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomTextField
                    id="startDate"
                    name="startDate"
                    type="date"
                    label="Start Date *"
                    value={values.startDate}
                    onChange={handleChange}
                    error={errors.startDate}
                    touched={touched.startDate}
                    icon={FaCalendar}
                  />
                  <CustomTextField
                    id="endDate"
                    name="endDate"
                    type="date"
                    label="End Date *"
                    value={values.endDate}
                    onChange={handleChange}
                    error={errors.endDate}
                    touched={touched.endDate}
                    icon={FaCalendar}
                  />
                </div>
                {/* Delivery Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Delivery Method *</label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="online"
                        checked={values.deliveryMethod === 'online'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">Online Only</div>
                        <div className="text-sm text-gray-500">Live streaming classes</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="physical"
                        checked={values.deliveryMethod === 'physical'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">Physical Only</div>
                        <div className="text-sm text-gray-500">In-person classes</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="hybrid"
                        checked={values.deliveryMethod === 'hybrid'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">Hybrid</div>
                        <div className="text-sm text-gray-500">Alternating weeks</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="other"
                        checked={values.deliveryMethod === 'other'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">Other</div>
                        <div className="text-sm text-gray-500">Custom (describe below)</div>
                      </div>
                    </label>
                  </div>
                  {values.deliveryMethod === 'other' && (
                    <CustomTextField
                      id="deliveryOther"
                      name="deliveryOther"
                      type="text"
                      label="Describe Delivery Method *"
                      value={values.deliveryOther}
                      onChange={handleChange}
                      error={errors.deliveryOther}
                      touched={touched.deliveryOther}
                    />
                  )}
                  {errors.deliveryMethod && touched.deliveryMethod && (
                    <div className="text-red-600 text-sm mt-1">{errors.deliveryMethod}</div>
                  )}
                </div>
                {/* Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomSelectField
                    id="schedule.frequency"
                    name="schedule.frequency"
                    label="Frequency"
                    value={values.schedule.frequency}
                    onChange={handleChange}
                    options={[
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'bi-weekly', label: 'Bi-weekly' },
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'no-schedule', label: 'No Schedule' },
                    ]}
                    error={errors.schedule?.frequency}
                    touched={touched.schedule?.frequency}
                    disabled={values.courseType === 'theory+revision'}
                  />
                  {values.schedule.frequency !== 'no-schedule' && (
                    <>
                      <CustomSelectField
                        id="schedule.day"
                        name="schedule.day"
                        label="Day"
                        value={values.schedule.day}
                        onChange={handleChange}
                        options={[
                          { value: '', label: 'Select Day' },
                          { value: 'Monday', label: 'Monday' },
                          { value: 'Tuesday', label: 'Tuesday' },
                          { value: 'Wednesday', label: 'Wednesday' },
                          { value: 'Thursday', label: 'Thursday' },
                          { value: 'Friday', label: 'Friday' },
                          { value: 'Saturday', label: 'Saturday' },
                          { value: 'Sunday', label: 'Sunday' },
                        ]}
                        error={errors.schedule?.day}
                        touched={touched.schedule?.day}
                        disabled={values.courseType === 'theory+revision'}
                      />
                      <CustomTextField
                        id="schedule.startTime"
                        name="schedule.startTime"
                        type="time"
                        label="Start Time"
                        value={values.schedule.startTime}
                        onChange={handleChange}
                        error={errors.schedule?.startTime}
                        touched={touched.schedule?.startTime}
                        icon={FaClock}
                        disabled={values.courseType === 'theory+revision'}
                      />
                      <CustomTextField
                        id="schedule.endTime"
                        name="schedule.endTime"
                        type="time"
                        label="End Time"
                        value={values.schedule.endTime}
                        onChange={handleChange}
                        error={errors.schedule?.endTime}
                        touched={touched.schedule?.endTime}
                        icon={FaClock}
                        disabled={values.courseType === 'theory+revision'}
                      />
                    </>
                  )}
                </div>
                {/* Class Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomTextField
                    id="maxStudents"
                    name="maxStudents"
                    type="number"
                    label="Maximum Students"
                    value={values.maxStudents}
                    onChange={handleChange}
                    error={errors.maxStudents}
                    touched={touched.maxStudents}
                    icon={FaUsers}
                    min="1"
                  />
                  <CustomTextField
                    id="fee"
                    name="fee"
                    type="number"
                    label="Class Fee (Rs.)"
                    value={values.fee}
                    onChange={handleChange}
                    error={errors.fee}
                    touched={touched.fee}
                    icon={FaMoneyBill}
                    min="0"
                  />
                  <CustomSelectField
                    id="status"
                    name="status"
                    label="Status *"
                    value={values.status}
                    onChange={handleChange}
                    options={statusOptions}
                    error={errors.status}
                    touched={touched.status}
                    required
                  />
                </div>
                {/* Payment Tracking (for all classes) */}
                <div className="flex flex-col md:flex-row items-center mb-2 gap-2">
                  <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="paymentTracking"
                    checked={values.paymentTracking}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">
                      Enable Payment Tracking
                  </label>
                  </div>
                  {values.paymentTracking && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700">First </label>
                      <input
                        type="number"
                        name="paymentTrackingFreeDays"
                        min="1"
                        max="31"
                        value={values.paymentTrackingFreeDays || 7}
                        onChange={handleChange}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">days free of the month</span>
                    </div>
                  )}
                </div>
                {/* Zoom Link for online, hybrid, and other */}
                {(values.deliveryMethod === 'online' || values.deliveryMethod === 'hybrid' || values.deliveryMethod === 'other') && (
                  <div>
                    <div className="mb-2">
                      <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                        <FaVideo className="inline mr-1" />
                        <strong>Zoom Link Required:</strong> For online and hybrid classes, you must provide a zoom link. You can either enter one manually or click "Create Zoom Link" to generate one automatically.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CustomTextField
                        id="zoomLink"
                        name="zoomLink"
                        type="url"
                        label={values.deliveryMethod === 'other' ? "Zoom Link (Optional)" : "Zoom Link *"}
                        value={values.zoomLink}
                        onChange={handleChange}
                        error={errors.zoomLink}
                        touched={touched.zoomLink}
                        icon={FaVideo}
                        placeholder="https://zoom.us/j/..."
                      />
                      <CustomButton
                        type="button"
                        onClick={handleGenerateZoomLink}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                        disabled={zoomLoading}
                      >
                        {zoomLoading ? 'Generating...' : 'Create Zoom Link'}
                      </CustomButton>
                    </div>
                    {zoomError && <div className="text-red-600 text-sm mt-1">{zoomError}</div>}
                    {!values.zoomLink && (values.deliveryMethod === 'online' || values.deliveryMethod === 'hybrid') && (
                      <div className="text-orange-600 text-sm mt-1">
                        ⚠️ Please enter a zoom link or click "Create Zoom Link" to generate one.
                      </div>
                    )}
                  </div>
                )}
                
                
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter class description..."
                  />
                </div>
                {/* Form Actions */}
                <div className="flex justify-center">
                  <CustomButton
                    type="submit"
                    className="w-2/3 max-w-xs py-2 px-4 bg-[#1a365d] text-white hover:bg-[#13294b] active:bg-[#0f2038] rounded flex items-center justify-center gap-2"
                  >
                    {editingId ? <FaEdit /> : <FaPlus />} {editingId ? 'Update Class' : 'Create Class'}
                  </CustomButton>
                </div>
              </div>
            );
          }}
        </BasicForm>

        {/* Classes List */}
        <div className="border-t-2 pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">All Classes</h2>
            <div className="flex gap-2">
              <CustomButton
                onClick={loadClasses}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <FaSync className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> 
                {loading ? 'Loading...' : 'Refresh'}
              </CustomButton>
            <CustomButton
              onClick={() => {
                const hasUpdates = syncMyClassesWithAdminClasses();
                if (hasUpdates) {
                  alert('Successfully synced all enrolled students with the latest class information!');
                } else {
                  alert('No updates needed. All enrolled students already have the latest information.');
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <FaSync className="mr-1" /> Sync Student Data
            </CustomButton>
          </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading classes...</div>
            </div>
          ) : (
          <BasicTable
            columns={[
              { key: 'className', label: 'Class Name', render: row => {
                // For revision class with related theory, show related theory className
                if (row.courseType === 'revision' && row.relatedTheoryId) {
                  const related = classes.find(c => String(c.id) === String(row.relatedTheoryId));
                  return related ? related.className : (row.className || 'N/A');
                }
                return row.className || 'N/A';
              } },
              { key: 'subject', label: 'Subject', render: row => {
                if (row.courseType === 'revision' && row.relatedTheoryId) {
                  const related = classes.find(c => String(c.id) === String(row.relatedTheoryId));
                  return related ? related.subject : (row.subject || 'N/A');
                }
                return row.subject || 'N/A';
              } },
              { key: 'teacher', label: 'Teacher', render: row => {
                if (row.courseType === 'revision' && row.relatedTheoryId) {
                  const related = classes.find(c => String(c.id) === String(row.relatedTheoryId));
                  return related ? related.teacher : (row.teacher || 'N/A');
                }
                return row.teacher || 'N/A';
              } },
              { key: 'stream', label: 'Stream', render: row => {
                if (row.courseType === 'revision' && row.relatedTheoryId) {
                  const related = classes.find(c => String(c.id) === String(row.relatedTheoryId));
                  return related ? related.stream : (row.stream || 'N/A');
                }
                return row.stream || 'N/A';
              } },
              { key: 'deliveryMethod', label: 'Delivery', render: row => row.deliveryMethod || 'N/A' },
              { key: 'schedule', label: 'Schedule', render: row => {
                if (!row.schedule) return 'N/A';
                if (row.schedule.frequency === 'no-schedule') {
                  return 'No Schedule';
                }
                return `${formatDay(row.schedule.day)} ${formatTime(row.schedule.startTime)}-${formatTime(row.schedule.endTime)}`;
              } },
              { key: 'fee', label: 'Fee', render: row => {
                let fee = Number(row.fee) || 0;
                // For revision class, show discount for theory students
                if (row.courseType === 'revision' && row.revisionDiscountPrice) {
                  return <span>Rs. {fee} <span className="text-xs text-blue-700">(Theory student: Rs. {Math.max(0, fee - Number(row.revisionDiscountPrice))})</span></span>;
                }
                return `Rs. ${fee}`;
              } },
              { key: 'courseType', label: 'Course Type', render: row => row.courseType || 'N/A' },
              { key: 'revisionDiscountPrice', label: 'Theory Student Discount', render: row => row.courseType === 'revision' && row.revisionDiscountPrice ? `Rs. ${row.revisionDiscountPrice}` : '' },
              { key: 'status', label: 'Status', render: row => {
                if (row.status === 'active') return <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-semibold">Active</span>;
                if (row.status === 'inactive') return <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-semibold">Inactive</span>;
                return row.status || 'N/A';
              } },
            ]}
            data={classes}
            actions={row => (
              <div className="flex gap-2">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => handleEdit(row.id)}
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => handleDelete(row.id)}
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          />
          )}
        </div>
      </div>
    </>
  );
};

export default CreateClass;
