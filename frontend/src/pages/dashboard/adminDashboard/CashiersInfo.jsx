import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { FaUser, FaLock, FaPhone, FaIdCard, FaEnvelope, FaEdit, FaTrash } from 'react-icons/fa';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import CustomButton from '../../../components/CustomButton';
import BasicTable from '../../../components/BasicTable';
import BasicForm from '../../../components/BasicForm';
import CustomTextField from '../../../components/CustomTextField';
import BasicAlertBox from '../../../components/BasicAlertBox';

const initialCashiers = [
  {
    cashierId: 'C001',
    name: 'Cashier One',
    email: 'cashier.one@example.com',
    phone: '0701234567',
    password: '********',
  },
];

const CashiersInfo = () => {
  const [cashiers, setCashiers] = useState(() => {
    const stored = localStorage.getItem('cashiers');
    return stored ? JSON.parse(stored) : initialCashiers;
  });
  useEffect(() => {
    localStorage.setItem('cashiers', JSON.stringify(cashiers));
  }, [cashiers]);
  const [editingCashier, setEditingCashier] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertCashierId, setAlertCashierId] = useState(null);
  const [saveAlert, setSaveAlert] = useState({ open: false, message: '', onConfirm: null, confirmText: 'OK', type: 'success' });

  const handleDelete = (cashierId) => {
    setAlertCashierId(cashierId);
    setShowAlert(true);
  };
  const confirmDelete = () => {
    setCashiers(cashiers.filter(a => a.cashierId !== alertCashierId));
    setShowAlert(false);
    setAlertCashierId(null);
  };
  const cancelDelete = () => {
    setShowAlert(false);
    setAlertCashierId(null);
  };
  const handleEdit = (cashier) => {
    setEditingCashier(cashier.cashierId);
    setEditValues({ ...cashier });
    setShowEditModal(true);
  };

  const phoneRegex = /^0\d{9}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  const validationSchema = Yup.object().shape({
    cashierId: Yup.string().required('Cashier ID is required'),
    name: Yup.string().min(2, "Name must be at least 2 characters").required("Name is required"),
    password: Yup.string()
      .matches(passwordRegex, 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character')
      .required('Password is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().matches(phoneRegex, 'Invalid phone number (should be 10 digits, start with 0)').required('Phone number is required'),
  });

  const handleEditSubmit = (values) => {
    setCashiers(cashiers.map(a => a.cashierId === values.cashierId ? values : a));
    setEditingCashier(null);
    setShowEditModal(false);
    setSaveAlert({
      open: true,
      message: 'Cashier details saved successfully!',
      onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
      confirmText: 'OK',
      type: 'success',
    });
  };
  const handleCancel = () => {
    setEditingCashier(null);
    setEditValues({});
    setShowEditModal(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Cashiers Information</h1>
      <p className="mb-6 text-gray-700">View, edit and delete cashier details.</p>
      <BasicTable
        columns={[
          {
            key: 'cashierId',
            label: 'ID',
            render: (row) => (
              <span className="flex items-center gap-1"><FaIdCard className="inline mr-1 text-gray-500" />{row.cashierId}</span>
            ),
          },
          {
            key: 'name',
            label: 'Name',
            render: (row) => (
              <span className="flex items-center gap-1"><FaUser className="inline mr-1 text-gray-500" />{row.name}</span>
            ),
          },
          {
            key: 'email',
            label: 'Email',
            render: (row) => (
              <span className="flex items-center gap-1"><FaEnvelope className="inline mr-1 text-gray-500" />{row.email}</span>
            ),
          },
          {
            key: 'phone',
            label: 'Phone',
            render: (row) => (
              <span className="flex items-center gap-1"><FaPhone className="inline mr-1 text-gray-500" />{row.phone}</span>
            ),
          },
          {
            key: 'password',
            label: 'Password',
            render: () => '********',
          },
        ]}
        data={cashiers}
        actions={(row) => (
          <div className="flex gap-2">
            <button className="text-blue-600 hover:underline" onClick={() => handleEdit(row)} title="Edit"><FaEdit /></button>
            <button className="text-red-600 hover:underline" onClick={() => handleDelete(row.cashierId)} title="Delete"><FaTrash /></button>
          </div>
        )}
        className="mb-6"
      />
      <BasicAlertBox
        open={showAlert}
        message={"Are you sure you want to delete this cashier?"}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
              onClick={handleCancel}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Edit Cashier</h2>
            <BasicForm
              initialValues={editValues}
              validationSchema={validationSchema}
              onSubmit={handleEditSubmit}
            >
              {({ values, handleChange, errors, touched }) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomTextField
                    id="cashierId"
                    name="cashierId"
                    type="text"
                    label="Cashier ID *"
                    value={values.cashierId}
                    onChange={handleChange}
                    error={errors.cashierId}
                    touched={touched.cashierId}
                    disabled
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
              )}
            </BasicForm>
            <div className="flex flex-row gap-4 mt-6 mb-2">
              <CustomButton
                type="button"
                onClick={handleCancel}
                className="w-1/2 py-2.5 px-4 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                form="edit-cashier-form"
                className="w-1/2 py-2.5 px-4 bg-[#1a365d] text-white text-xs font-bold rounded-lg hover:bg-[#13294b] active:bg-[#0f2038]"
                onClick={() => { document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }}
              >
                Save
              </CustomButton>
            </div>
          </div>
        </div>
      )}
      <BasicAlertBox
        open={saveAlert.open}
        message={saveAlert.message}
        onConfirm={saveAlert.onConfirm}
        confirmText={saveAlert.confirmText}
        type={saveAlert.type}
      />
    </div>
  );
};

export default CashiersInfo;
