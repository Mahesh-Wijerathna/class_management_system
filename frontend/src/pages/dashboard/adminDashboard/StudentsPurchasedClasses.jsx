import React, { useState, useEffect } from 'react';
import BasicTable from '../../../components/BasicTable';
import BasicForm from '../../../components/BasicForm';
import CustomButton from '../../../components/CustomButton';
import CustomTextField from '../../../components/CustomTextField';
import CustomSelectField from '../../../components/CustomSelectField';
import BasicAlertBox from '../../../components/BasicAlertBox';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  studentId: Yup.string().required('Student ID is required'),
  classId: Yup.string().required('Class is required'),
  purchaseDate: Yup.date().required('Purchase date is required')
});

  const StudentsPurchasedClasses = () => {
    const [purchasedClasses, setPurchasedClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load data from localStorage on component mount
  useEffect(() => {
    loadDataFromLocalStorage();
  }, []);

  // Save purchased classes to localStorage whenever it changes
  useEffect(() => {
    if (purchasedClasses.length > 0) {
      localStorage.setItem('purchasedClasses', JSON.stringify(purchasedClasses));
    }
  }, [purchasedClasses]);

  const loadDataFromLocalStorage = () => {
    try {
      // Load students
      const storedStudents = localStorage.getItem('students');
      const parsedStudents = storedStudents ? JSON.parse(storedStudents) : [];
      setStudents(Array.isArray(parsedStudents) ? parsedStudents : []);

      // Load available classes
      const storedClasses = localStorage.getItem('classes');
      const parsedClasses = storedClasses ? JSON.parse(storedClasses) : [];
      setAvailableClasses(Array.isArray(parsedClasses) ? parsedClasses : []);

      // Load existing purchased classes or create from myClasses
      const storedPurchasedClasses = localStorage.getItem('purchasedClasses');
      if (storedPurchasedClasses) {
        const parsedPurchasedClasses = JSON.parse(storedPurchasedClasses);
        setPurchasedClasses(Array.isArray(parsedPurchasedClasses) ? parsedPurchasedClasses : []);
      } else {
        // If no purchased classes exist, create from myClasses data
        createPurchasedClassesFromMyClasses();
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      // Set empty arrays on error to prevent crashes
      setStudents([]);
      setAvailableClasses([]);
      setPurchasedClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createPurchasedClassesFromMyClasses = () => {
    try {
      const myClasses = JSON.parse(localStorage.getItem('myClasses') || '[]');
      const students = JSON.parse(localStorage.getItem('students') || '[]');
      
      const purchasedClassesData = myClasses
        .filter(cls => cls && cls.studentId) // Filter out invalid entries
        .map(cls => {
          const student = students.find(s => s && s.studentId === cls.studentId);
          return {
            id: cls.id || Date.now() + Math.random(),
            studentId: cls.studentId || 'Unknown',
            firstName: student ? (student.firstName || 'Unknown') : 'Unknown',
            lastName: student ? (student.lastName || 'Student') : 'Student',
            classId: cls.classId || cls.id || 'Unknown',
            purchasedClass: cls.className || 'Unknown Class',
            purchaseDate: cls.purchaseDate || new Date().toISOString().split('T')[0],
            status: cls.status || 'Active',
            paymentStatus: cls.paymentStatus || 'Paid'
          };
        });

      setPurchasedClasses(purchasedClassesData);
      localStorage.setItem('purchasedClasses', JSON.stringify(purchasedClassesData));
    } catch (error) {
      console.error('Error creating purchased classes from myClasses:', error);
      setPurchasedClasses([]); // Set empty array on error
    }
  };

  // Filter data based on search term
  const filteredData = purchasedClasses.filter(record =>
    (record.studentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.purchasedClass || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingRecord(null);
    setShowModal(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const handleDelete = (record) => {
    console.log('Delete button clicked for record:', record);
    setRecordToDelete(record);
    setShowDeleteAlert(true);
    console.log('Delete alert should be shown');
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      setPurchasedClasses(prev => prev.filter(record => record.id !== recordToDelete.id));
      
      // Also remove from myClasses if it exists there
      try {
        const myClasses = JSON.parse(localStorage.getItem('myClasses') || '[]');
        const updatedMyClasses = myClasses.filter(cls => 
          !(cls.studentId === recordToDelete.studentId && 
            (cls.classId === recordToDelete.classId || cls.id === recordToDelete.classId))
        );
        localStorage.setItem('myClasses', JSON.stringify(updatedMyClasses));
      } catch (error) {
        console.error('Error updating myClasses:', error);
      }
      
      setShowDeleteAlert(false);
      setRecordToDelete(null);
      
      // Show success message
      setSuccessMessage('Purchase record deleted successfully!');
      setShowSuccessAlert(true);
    }
  };

    const handleSubmit = (values) => {
    if (editingRecord) {
      // Update existing record
      const selectedClass = availableClasses.find(c => c.id === values.classId);
      const selectedStudent = students.find(s => s.studentId === values.studentId);
      
      setPurchasedClasses(prev => prev.map(record => 
        record.id === editingRecord.id 
          ? { 
              ...record, 
              studentId: values.studentId || record.studentId,
              firstName: selectedStudent ? (selectedStudent.firstName || record.firstName) : record.firstName,
              lastName: selectedStudent ? (selectedStudent.lastName || record.lastName) : record.lastName,
              classId: values.classId || record.classId,
              purchasedClass: selectedClass ? (selectedClass.className || record.purchasedClass) : record.purchasedClass,
              purchaseDate: values.purchaseDate || record.purchaseDate
            }
          : record
      ));
      
      // Show success message for update
      setSuccessMessage('Purchase record updated successfully!');
      setShowSuccessAlert(true);
    } else {
      // Add new record
      const selectedClass = availableClasses.find(c => c.id === values.classId);
      const selectedStudent = students.find(s => s.studentId === values.studentId);
      
      const newRecord = {
        id: Date.now(),
        studentId: values.studentId || 'Unknown',
        firstName: selectedStudent ? (selectedStudent.firstName || 'Unknown') : 'Unknown',
        lastName: selectedStudent ? (selectedStudent.lastName || 'Student') : 'Student',
        classId: values.classId || 'Unknown',
        purchasedClass: selectedClass ? (selectedClass.className || 'Unknown Class') : 'Unknown Class',
        purchaseDate: values.purchaseDate || new Date().toISOString().split('T')[0],
        status: 'Active',
        paymentStatus: 'Paid'
      };
      
      setPurchasedClasses(prev => [...prev, newRecord]);
      
      // Also add to myClasses for consistency
      try {
        const myClasses = JSON.parse(localStorage.getItem('myClasses') || '[]');
        const newMyClass = {
          ...selectedClass,
          studentId: values.studentId,
          purchaseDate: values.purchaseDate,
          paymentStatus: 'Paid',
          status: 'active'
        };
        myClasses.push(newMyClass);
        localStorage.setItem('myClasses', JSON.stringify(myClasses));
      } catch (error) {
        console.error('Error updating myClasses:', error);
      }
      
      // Show success message for add
      setSuccessMessage('Purchase record added successfully!');
      setShowSuccessAlert(true);
    }
    setShowModal(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingRecord(null);
  };

  const columns = [
    { key: 'studentId', label: 'Student ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'purchasedClass', label: 'Purchased Class' },
    { key: 'purchaseDate', label: 'Purchase Date', render: (row) => 
      new Date(row.purchaseDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    { key: 'paymentStatus', label: 'Payment Status', render: (row) => (
      <span className={`px-2 py-1 rounded text-xs font-bold ${
        row.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {row.paymentStatus}
      </span>
    )},
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`px-2 py-1 rounded text-xs font-bold ${
        row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {row.status}
      </span>
    )}
  ];

  const actions = (row) => (
    <div className="flex gap-2">
      <button
        className="text-blue-600 hover:text-blue-800 transition-colors"
        title="Edit"
        onClick={() => handleEdit(row)}
      >
        <FaEdit />
      </button>
      <button
        className="text-red-600 hover:text-red-800 transition-colors"
        title="Delete"
        onClick={() => handleDelete(row)}
      >
        <FaTrash />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading purchased classes data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Student Purchased Classes</h1>
        <p className="text-gray-600">Manage and track student class purchases</p>
      </div>

      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by student ID, name, or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <CustomButton
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FaPlus />
          Add New Purchase
        </CustomButton>
      </div>

      {/* Table */}
      <BasicTable
        columns={columns}
        data={filteredData}
        actions={actions}
        className="bg-white"
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingRecord ? 'Edit Purchase Record' : 'Add New Purchase Record'}
            </h2>
            
            <BasicForm
              initialValues={editingRecord || {
                studentId: '',
                classId: '',
                purchaseDate: ''
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, handleChange, values, setFieldValue }) => (
                <>
                  <CustomSelectField
                    name="studentId"
                    label="Student"
                    placeholder="Select Student"
                    value={values.studentId}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Select Student' },
                      ...students.map(student => ({
                        value: student.studentId,
                        label: `${student.studentId} - ${student.firstName} ${student.lastName}`
                      }))
                    ]}
                    error={errors.studentId}
                    touched={touched.studentId}
                  />

                  <CustomSelectField
                    name="classId"
                    label="Class"
                    placeholder="Select Class"
                    value={values.classId}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Select Class' },
                      ...availableClasses.map(cls => ({
                        value: cls.id,
                        label: `${cls.className} - ${cls.subject} (${cls.teacher})`
                      }))
                    ]}
                    error={errors.classId}
                    touched={touched.classId}
                  />

                  <CustomTextField
                    name="purchaseDate"
                    label="Purchase Date"
                    type="date"
                    placeholder="DD/MM/YYYY"
                    value={values.purchaseDate}
                    onChange={handleChange}
                    error={errors.purchaseDate}
                    touched={touched.purchaseDate}
                  />

                  <div className="flex gap-3 mt-6">
                    <CustomButton
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {editingRecord ? 'Update' : 'Add'} Purchase
                    </CustomButton>
                    <CustomButton
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </CustomButton>
                  </div>
                </>
              )}
            </BasicForm>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      <BasicAlertBox
        open={showDeleteAlert}
        message={`Are you sure you want to delete the purchase record for ${recordToDelete?.firstName} ${recordToDelete?.lastName} - ${recordToDelete?.purchasedClass}?`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteAlert(false)}
        confirmText="OK"
        cancelText="Cancel"
        type="danger"
      />

      {/* Success Alert */}
      <BasicAlertBox
        open={showSuccessAlert}
        message={successMessage}
        onConfirm={() => setShowSuccessAlert(false)}
        confirmText="OK"
        type="success"
      />
    </div>
  );
};

export default StudentsPurchasedClasses; 