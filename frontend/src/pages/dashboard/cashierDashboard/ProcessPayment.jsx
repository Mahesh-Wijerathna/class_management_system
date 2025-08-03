import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import cashierSidebarSections from './CashierDashboardSidebar';
import BasicCard from '../../../components/BasicCard';
import CustomTextField from '../../../components/CustomTextField';
import CustomSelectField from '../../../components/CustomSelectField';
import CustomButton from '../../../components/CustomButton';
import BasicAlertBox from '../../../components/BasicAlertBox';
import { useNavigate } from 'react-router-dom';
import { 
  LuSearch, 
  LuCreditCard, 
  LuUser, 
  LuCalendar, 
  LuDollarSign, 
  LuCircleCheck, 
  LuCircleX,
  LuReceipt,
  LuFileText,
  LuX
} from 'react-icons/lu';
import BasicForm from '../../../components/BasicForm';

const ProcessPayment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showStudentList, setShowStudentList] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [processedPayment, setProcessedPayment] = useState(null);
  
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    studentName: '',
    paymentType: '',
    amount: '',
    paymentMethod: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    receiptNumber: ''
  });

  const [paymentTypes] = useState([
    { value: 'class_payment', label: 'Class Payment' },
    { value: 'study_pack', label: 'Study Pack' },
    { value: 'registration_fee', label: 'Registration Fee' },
    { value: 'late_fee', label: 'Late Fee' },
    { value: 'exam_fee', label: 'Exam Fee' },
    { value: 'material_fee', label: 'Material Fee' },
    { value: 'other', label: 'Other' }
  ]);

  const [paymentMethods] = useState([
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'online', label: 'Online Payment' },
    { value: 'mobile_money', label: 'Mobile Money' }
  ]);

  useEffect(() => {
    // Load mock student data
    loadStudents();
    // Generate receipt number
    generateReceiptNumber();
  }, []);

  const loadStudents = () => {
    // Mock data - in real implementation, this would come from API
    const mockStudents = [
      { id: 1, name: 'John Doe', studentId: 'STU001', mobile: '0771234567', email: 'john@example.com', class: 'Class 10A' },
      { id: 2, name: 'Jane Smith', studentId: 'STU002', mobile: '0772345678', email: 'jane@example.com', class: 'Class 11B' },
      { id: 3, name: 'Mike Johnson', studentId: 'STU003', mobile: '0773456789', email: 'mike@example.com', class: 'Class 12A' },
      { id: 4, name: 'Sarah Wilson', studentId: 'STU004', mobile: '0774567890', email: 'sarah@example.com', class: 'Class 10B' },
      { id: 5, name: 'David Brown', studentId: 'STU005', mobile: '0775678901', email: 'david@example.com', class: 'Class 11A' },
      { id: 6, name: 'Emily Davis', studentId: 'STU006', mobile: '0776789012', email: 'emily@example.com', class: 'Class 12B' },
      { id: 7, name: 'Michael Wilson', studentId: 'STU007', mobile: '0777890123', email: 'michael@example.com', class: 'Class 10A' },
      { id: 8, name: 'Lisa Anderson', studentId: 'STU008', mobile: '0778901234', email: 'lisa@example.com', class: 'Class 11B' },
    ];
    setStudents(mockStudents);
    setFilteredStudents(mockStudents);
  };

  const generateReceiptNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const receiptNumber = `RCP${timestamp}${random}`;
    setPaymentForm(prev => ({
      ...prev,
      receiptNumber: receiptNumber
    }));
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredStudents(students);
      setShowStudentList(false);
    } else {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(query.toLowerCase()) ||
        student.studentId.toLowerCase().includes(query.toLowerCase()) ||
        student.mobile.includes(query) ||
        student.class.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredStudents(filtered);
      setShowStudentList(true);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setSearchQuery(student.name);
    setShowStudentList(false);
  };



  const validateForm = (values) => {
    if (!selectedStudent) return 'Please select a student';
    if (!values.paymentType) return 'Please select payment type';
    if (!values.amount || values.amount <= 0) return 'Please enter a valid amount';
    if (!values.paymentMethod) return 'Please select payment method';
    if (!values.date) return 'Please select payment date';
    return null;
  };

  const handleSubmit = async (values, { resetForm }) => {
    const validationError = validateForm(values);
    if (validationError) {
      alert(validationError);
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful payment processing
      const processedPaymentData = {
        ...values,
        id: Date.now(),
        status: 'completed',
        processedAt: new Date().toISOString(),
        cashierName: 'Current Cashier',
        studentInfo: selectedStudent
      };
      
      setProcessedPayment(processedPaymentData);
      setShowSuccessModal(true);
      
      // Reset form
      resetForm();
      setSelectedStudent(null);
      setSearchQuery('');
      generateReceiptNumber();
      
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setSelectedStudent(null);
    setSearchQuery('');
    generateReceiptNumber();
  };

  const printReceipt = () => {
    // In a real implementation, this would open a print dialog
    window.print();
  };

  const downloadReceipt = () => {
    // In a real implementation, this would download a PDF
    alert('Receipt download functionality would be implemented here');
  };

  return (
    <DashboardLayout userRole="Cashier" sidebarItems={cashierSidebarSections}>
      <div className="p-6 bg-white rounded-lg shadow">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Process Payment</h1>
            <p className="text-gray-600 mt-1">Record new student payments and transactions</p>
          </div>
          <div className="flex items-center space-x-3">
            <CustomButton
              onClick={() => navigate('/cashier/payment-history')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <LuFileText className="h-4 w-4" />
              <span>View History</span>
            </CustomButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <BasicForm
              initialValues={paymentForm}
              validationSchema={null}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, handleChange, values, setFieldValue, resetForm }) => (
                <>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <LuCreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
                      <p className="text-sm text-gray-600">Enter payment information</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                {/* Student Selection */}
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-900">Student Information</h3>
                  
                  <div className="relative">
                    <CustomTextField
                      label="Search Student"
                      placeholder="Search by name, ID, or mobile number..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      icon={LuSearch}
                    />
                    
                    {showStudentList && filteredStudents.length > 0 && (
                      <div className="absolute z-10 max-w-25xl  w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            onClick={() => selectStudent(student)}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-600">{student.studentId} • {student.class}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">{student.mobile}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedStudent && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <LuUser className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">{selectedStudent.name}</p>
                          <p className="text-sm text-green-700">
                            {selectedStudent.studentId} • {selectedStudent.class} • {selectedStudent.mobile}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Details */}
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-900">Payment Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomSelectField
                      label="Payment Type"
                      value={values.paymentType}
                      onChange={(value) => setFieldValue('paymentType', value)}
                      options={paymentTypes}
                      placeholder="Select payment type"
                      icon={LuReceipt}
                    />
                    
                    <CustomTextField
                      label="Amount (Rs.)"
                      type="number"
                      placeholder="0.00"
                      value={values.amount}
                      onChange={handleChange}
                      name="amount"
                      icon={LuDollarSign}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomSelectField
                      label="Payment Method"
                      value={values.paymentMethod}
                      onChange={(value) => setFieldValue('paymentMethod', value)}
                      options={paymentMethods}
                      placeholder="Select payment method"
                      icon={LuCreditCard}
                    />
                    
                    <CustomTextField
                      label="Payment Date"
                      type="date"
                      value={values.date}
                      onChange={handleChange}
                      name="date"
                      icon={LuCalendar}
                    />
                  </div>

                  <CustomTextField
                    label="Description (Optional)"
                    placeholder="Enter payment description..."
                    value={values.description}
                    onChange={handleChange}
                    name="description"
                    multiline
                    rows={3}
                  />

                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Receipt Number</p>
                        <p className="text-lg font-bold text-gray-900">{values.receiptNumber}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const timestamp = Date.now();
                          const random = Math.floor(Math.random() * 1000);
                          const receiptNumber = `RCP${timestamp}${random}`;
                          setFieldValue('receiptNumber', receiptNumber);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <CustomButton
                    type="button"
                    onClick={() => {
                      resetForm();
                      clearForm();
                    }}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <LuX className="h-4 w-4" />
                    <span>Clear Form</span>
                  </CustomButton>
                  
                  <CustomButton
                    type="submit"
                    loading={loading}
                    className="flex items-center space-x-2"
                  >
                    <LuCircleCheck className="h-4 w-4" />
                    <span>{loading ? 'Processing...' : 'Process Payment'}</span>
                  </CustomButton>
                </div>
                  </div>
                </>
              )}
            </BasicForm>
          </div>

          {/* Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <BasicCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/cashier/students')}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <LuUser className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">View Students</p>
                    <p className="text-sm text-gray-600">Browse all students</p>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/cashier/payment-history')}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <LuFileText className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Payment History</p>
                    <p className="text-sm text-gray-600">View all transactions</p>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/cashier/reports')}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <LuReceipt className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Generate Reports</p>
                    <p className="text-sm text-gray-600">Financial reports</p>
                  </div>
                </button>
              </div>
            </BasicCard>

            {/* Payment Guidelines */}
            <BasicCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Guidelines</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <LuCircleCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Always verify student identity before processing payment</p>
                </div>
                <div className="flex items-start space-x-2">
                  <LuCircleCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Double-check amount and payment type</p>
                </div>
                <div className="flex items-start space-x-2">
                  <LuCircleCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Provide receipt to student after payment</p>
                </div>
                <div className="flex items-start space-x-2">
                  <LuCircleCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Record any special notes in description</p>
                </div>
              </div>
            </BasicCard>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && processedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <LuCircleCheck className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Processed Successfully!</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Payment of Rs. {processedPayment.amount} has been recorded for {processedPayment.studentName}.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={printReceipt}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Print Receipt
                  </button>
                  <button
                    onClick={downloadReceipt}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Download Receipt
                  </button>
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
};

export default ProcessPayment; 