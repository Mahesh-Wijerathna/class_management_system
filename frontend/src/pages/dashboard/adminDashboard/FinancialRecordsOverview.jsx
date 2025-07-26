import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import adminSidebarSections from './AdminDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import CustomButton from '../../../components/CustomButton';
import BasicForm from '../../../components/BasicForm';
import CustomTextField from '../../../components/CustomTextField';
import CustomSelectField from '../../../components/CustomSelectField';
import BasicAlertBox from '../../../components/BasicAlertBox';
import * as Yup from 'yup';
import { FaEdit, FaTrash } from 'react-icons/fa';

const typeOptions = [
  { value: 'income', label: 'Income' },
  { value: 'outcome', label: 'Outcome' },
];
const roleOptions = [
  { value: '', label: 'Select Role' },
  { value: 'Student', label: 'Student' },
  { value: 'Teacher', label: 'Teacher' },
  { value: 'Cashier', label: 'Cashier' },
  { value: 'Cleaner', label: 'Cleaner' },
];
const statusOptions = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Refunded', label: 'Refunded' },
];
const categoryOptions = [
  { value: '', label: 'Select Category' },
  { value: 'Tuition Fee', label: 'Tuition Fee' },
  { value: 'Exam Fee', label: 'Exam Fee' },
  { value: 'Teacher Salary', label: 'Teacher Salary' },
  { value: 'Cashier Salary', label: 'Cashier Salary' },
  { value: 'Cleaner Salary', label: 'Cleaner Salary' },
  { value: 'Other', label: 'Other' },
];

const validationSchema = Yup.object().shape({
  date: Yup.string().required('Date is required'),
  type: Yup.string().oneOf(['income', 'outcome']).required('Type is required'),
  category: Yup.string().required('Category is required'),
  person: Yup.string().required('Person is required'),
  role: Yup.string().required('Role is required'),
  className: Yup.string(),
  amount: Yup.number().min(0, 'Must be 0 or greater').required('Amount is required'),
  status: Yup.string().required('Status is required'),
});

const initialRecords = [
  {
    id: 'TXN001',
    date: '2025-07-01',
    type: 'income',
    category: 'Tuition Fee',
    person: 'Alice Perera',
    role: 'Student',
    className: 'Advanced Mathematics',
    amount: 5000,
    status: 'Paid',
  },
  {
    id: 'TXN002',
    date: '2025-07-01',
    type: 'outcome',
    category: 'Teacher Salary',
    person: 'Mr. Silva',
    role: 'Teacher',
    className: 'Advanced Mathematics',
    amount: 3000,
    status: 'Paid',
  },
  {
    id: 'TXN003',
    date: '2025-07-01',
    type: 'outcome',
    category: 'Cleaner Salary',
    person: 'Kumara',
    role: 'Cleaner',
    className: '-',
    amount: 500,
    status: 'Paid',
  },
  {
    id: 'TXN004',
    date: '2025-07-02',
    type: 'income',
    category: 'Exam Fee',
    person: 'Bob Silva',
    role: 'Student',
    className: 'Physics Fundamentals',
    amount: 2000,
    status: 'Pending',
  },
  {
    id: 'TXN005',
    date: '2025-07-02',
    type: 'outcome',
    category: 'Cashier Salary',
    person: 'Ms. Perera',
    role: 'Cashier',
    className: '-',
    amount: 1200,
    status: 'Paid',
  },
];

const FinancialRecordsOverview = () => {
  const [records, setRecords] = useState(initialRecords);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [alertBox, setAlertBox] = useState({ open: false, message: '', onConfirm: null, onCancel: null, confirmText: 'OK', cancelText: 'Cancel', type: 'info' });
  const [saveAlert, setSaveAlert] = useState({ open: false, message: '', onConfirm: null, confirmText: 'OK', type: 'success' });

  // Filter records by type, date, and role
  const filteredRecords = records.filter(rec =>
    (selectedType === 'all' || rec.type === selectedType) &&
    (!selectedDate || rec.date === selectedDate) &&
    (selectedRole === 'All' || rec.role === selectedRole)
  );

  // Calculate totals
  const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalOutcome = records.filter(r => r.type === 'outcome').reduce((sum, r) => sum + r.amount, 0);
  const profit = totalIncome - totalOutcome;

  // Get next transaction ID
  const getNextTransactionId = () => {
    if (records.length === 0) return 'TXN001';
    const lastId = records[records.length - 1].id;
    const lastNum = parseInt(lastId.replace('TXN', ''), 10);
    return `TXN${(lastNum + 1).toString().padStart(3, '0')}`;
  };

  // Alert helpers
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

  // Open modal for add or edit
  const handleAdd = () => {
    setEditRecord({
      id: getNextTransactionId(),
      date: '',
      type: 'income',
      category: '',
      person: '',
      role: '',
      className: '',
      amount: '',
      status: 'Paid',
    });
    setShowModal(true);
  };
  const handleEdit = (record) => {
    setEditRecord({ ...record });
    setShowModal(true);
  };
  const handleDelete = (id) => {
    openAlert(
      'Are you sure you want to delete this record?',
      () => {
        setRecords(records.filter(r => r.id !== id));
        setAlertBox(a => ({ ...a, open: false }));
        setSaveAlert({
          open: true,
          message: 'Record deleted successfully!',
          onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
          confirmText: 'OK',
          type: 'success',
        });
      },
      { confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
    );
  };
  const handleModalClose = () => {
    setShowModal(false);
    setEditRecord(null);
  };
  const handleModalSubmit = (values) => {
    if (records.some(r => r.id === values.id)) {
      // Edit
      setRecords(records.map(r => (r.id === values.id ? values : r)));
      setShowModal(false);
      setEditRecord(null);
      setSaveAlert({
        open: true,
        message: 'Financial record updated successfully!',
        onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
        confirmText: 'OK',
        type: 'success',
      });
    } else {
      // Add
      setRecords([...records, values]);
      setShowModal(false);
      setEditRecord(null);
      setSaveAlert({
        open: true,
        message: 'Financial record added successfully!',
        onConfirm: () => setSaveAlert(a => ({ ...a, open: false })),
        confirmText: 'OK',
        type: 'success',
      });
    }
  };

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Financial Records</h1>
        <div className="flex flex-wrap gap-6 mb-6">
          <div className="bg-green-100 text-green-800 rounded-lg px-6 py-4 font-bold text-lg">
            Total Income: Rs. {totalIncome}
          </div>
          <div className="bg-red-100 text-red-800 rounded-lg px-6 py-4 font-bold text-lg">
            Total Outcome: Rs. {totalOutcome}
          </div>
          <div className={`rounded-lg px-6 py-4 font-bold text-lg ${profit >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
            Profit: Rs. {profit}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <CustomButton
            className="bg-[#1a365d] text-white px-4 py-2 rounded hover:bg-[#13294b] active:bg-[#0f2038]"
            onClick={handleAdd}
          >
            Add New
          </CustomButton>
          <label className="font-semibold ml-4">Type:</label>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="outcome">Outcome</option>
          </select>
          <label className="font-semibold ml-4">Role:</label>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {['All', ...roleOptions.map(r => r.value)].map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <label className="font-semibold ml-4">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        <BasicTable
          columns={[
            { key: 'id', label: 'Transaction ID' },
            { key: 'date', label: 'Date' },
            { key: 'type', label: 'Type', render: row => (
                <span className={`px-2 py-1 rounded text-xs font-bold ${row.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{row.type.charAt(0).toUpperCase() + row.type.slice(1)}</span>
              ) },
            { key: 'category', label: 'Category' },
            { key: 'person', label: 'Person' },
            { key: 'role', label: 'Role' },
            { key: 'className', label: 'Class' },
            { key: 'amount', label: 'Amount', render: row => (
                <span className={row.type === 'income' ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>Rs. {row.amount}</span>
              ) },
            { key: 'status', label: 'Status', render: row => (
                <span className={`px-2 py-1 rounded text-xs font-bold ${row.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{row.status}</span>
              ) },
            { key: 'actions', label: 'Actions', render: (row) => (
              <div className="flex gap-2">
                <button
                  className="text-blue-600 hover:underline text-lg"
                  title="Edit"
                  onClick={() => handleEdit(row)}
                >
                  <FaEdit />
                </button>
                <button
                  className="text-red-600 hover:underline text-lg"
                  title="Delete"
                  onClick={() => handleDelete(row.id)}
                >
                  <FaTrash />
                </button>
              </div>
            ) },
          ]}
          data={filteredRecords}
        />

        {/* Modal for Add/Edit */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-xl max-h-[96vh] flex flex-col pointer-events-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-xl font-bold">{editRecord && records.some(r => r.id === editRecord.id) ? 'Edit Financial Record' : 'Add Financial Record'}</h2>
                <button
                  className="text-gray-500 hover:text-gray-800 text-2xl focus:outline-none"
                  onClick={handleModalClose}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-4 flex-1">
                <BasicForm
                  initialValues={editRecord}
                  validationSchema={validationSchema}
                  onSubmit={handleModalSubmit}
                  enableReinitialize
                >
                  {({ values, handleChange, errors, touched }) => (
                    <div className="space-y-6">
                      <CustomTextField
                        id="id"
                        name="id"
                        label="Transaction ID"
                        value={values.id}
                        onChange={handleChange}
                        readOnly
                      />
                      <CustomTextField
                        id="date"
                        name="date"
                        type="date"
                        label="Date *"
                        value={values.date}
                        onChange={handleChange}
                        error={errors.date}
                        touched={touched.date}
                      />
                      <CustomSelectField
                        id="type"
                        name="type"
                        label="Type *"
                        value={values.type}
                        onChange={handleChange}
                        options={typeOptions}
                        error={errors.type}
                        touched={touched.type}
                        required
                      />
                      <CustomSelectField
                        id="category"
                        name="category"
                        label="Category *"
                        value={values.category}
                        onChange={handleChange}
                        options={categoryOptions}
                        error={errors.category}
                        touched={touched.category}
                        required
                      />
                      <CustomTextField
                        id="person"
                        name="person"
                        label="Person *"
                        value={values.person}
                        onChange={handleChange}
                        error={errors.person}
                        touched={touched.person}
                      />
                      <CustomSelectField
                        id="role"
                        name="role"
                        label="Role *"
                        value={values.role}
                        onChange={handleChange}
                        options={roleOptions}
                        error={errors.role}
                        touched={touched.role}
                        required
                      />
                      <CustomTextField
                        id="className"
                        name="className"
                        label="Class"
                        value={values.className}
                        onChange={handleChange}
                        error={errors.className}
                        touched={touched.className}
                      />
                      <CustomTextField
                        id="amount"
                        name="amount"
                        type="number"
                        label="Amount *"
                        value={values.amount}
                        onChange={handleChange}
                        error={errors.amount}
                        touched={touched.amount}
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
                      <div className="flex gap-4 justify-end">
                        <CustomButton
                          type="button"
                          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
                          onClick={handleModalClose}
                        >
                          Cancel
                        </CustomButton>
                        <CustomButton
                          type="submit"
                          className="bg-[#1a365d] text-white px-4 py-2 rounded hover:bg-[#13294b] active:bg-[#0f2038]"
                        >
                          {editRecord && records.some(r => r.id === editRecord.id) ? 'Update' : 'Save'}
                        </CustomButton>
                      </div>
                    </div>
                  )}
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
    </DashboardLayout>
  );
};

export default FinancialRecordsOverview; 