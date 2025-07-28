import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomButton2 from '../../../components/CustomButton2';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

const BankTransfer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef();

  if (!data) {
    return <div className="p-8 text-center text-gray-500">No order data. Please complete checkout first.</div>;
  }

  const validateFile = (file) => {
    if (!file) return 'Please select a file to upload.';
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only PDF, JPG, or PNG files are allowed.';
    if (file.size > MAX_SIZE) return 'File size must be less than 10MB.';
    return '';
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      setSuccess(false);
      setProgress(0);
    } else {
      setFile(f);
      setError('');
      setSuccess(false);
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      setSuccess(false);
      setProgress(0);
    } else {
      setFile(f);
      setError('');
      setSuccess(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError('');
    setSuccess(false);
    setProgress(0);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess(false);
    setProgress(0);

    // Simulate upload progress
    let percent = 0;
    const interval = setInterval(() => {
      percent += Math.floor(Math.random() * 15) + 10; // random step
      if (percent >= 100) {
        percent = 100;
        clearInterval(interval);
        setUploading(false);
        setSuccess(true);
        setFile(null);
        setProgress(100);
        // Save payment record to localStorage (for demo)
        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
        if (!payments.some(p => p.invoiceId === data.invoiceId)) {
          payments.push({
            date: data.date,
            classTitle: data.classTitle,
            total: data.total,
            method: 'bank',
            status: 'Pending',
            invoiceId: data.invoiceId,
          });
          localStorage.setItem('payments', JSON.stringify(payments));
        }
        
        // Add class to My Classes after successful bank transfer upload
        if (!data.isStudyPack) {
          const myClasses = JSON.parse(localStorage.getItem('myClasses') || '[]');
          const classToAdd = {
            id: data.classId || Date.now(), // Use classId from data or generate new one
            className: data.classTitle,
            subject: data.subject,
            teacher: data.teacher,
            stream: data.stream,
            deliveryMethod: data.deliveryMethod,
            courseType: data.courseType,
            schedule: data.schedule,
            fee: data.basePrice,
            purchaseDate: new Date().toISOString(),
            paymentStatus: 'pending',
            paymentMethod: 'bank',
            nextPaymentDate: data.nextPaymentDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            attendance: [],
            paymentHistory: [{
              date: new Date().toISOString(),
              amount: data.total,
              method: 'bank',
              status: 'pending',
              invoiceId: data.invoiceId
            }],
            // Add additional fields for MyClasses functionality
            hasExams: Math.random() > 0.5, // Random for demo
            hasTutes: Math.random() > 0.3, // Random for demo
            currentStudents: 1,
            forgetCardRequested: false,
            latePaymentRequested: false
          };
          
          // Only add if not already in My Classes
          if (!myClasses.some(c => c.id === classToAdd.id)) {
            myClasses.push(classToAdd);
            localStorage.setItem('myClasses', JSON.stringify(myClasses));
          }
        } else {
          // Add study pack to My Study Packs
          const myStudyPacks = JSON.parse(localStorage.getItem('myStudyPacks') || '[]');
          const studyPackToAdd = {
            title: data.classTitle,
            price: data.basePrice,
            teacher: data.teacher,
            image: data.image,
            description: data.description,
            purchaseDate: new Date().toISOString(),
            paymentStatus: 'pending',
            paymentMethod: 'bank',
            invoiceId: data.invoiceId
          };
          
          if (!myStudyPacks.some(p => p.title === studyPackToAdd.title && p.teacher === studyPackToAdd.teacher)) {
            myStudyPacks.push(studyPackToAdd);
            localStorage.setItem('myStudyPacks', JSON.stringify(myStudyPacks));
          }
        }
      } else {
        setProgress(percent);
      }
    }, 200);
  };

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="min-h-screen bg-[#fafaf6] flex flex-col items-center py-8">
        <div className="receipt-content bg-white rounded-xl shadow p-8 w-full max-w-2xl flex flex-col gap-8">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-cyan-700 mb-2">Bank Transfer Instructions</h1>
            <p className="text-gray-700 mb-2">Please transfer the total amount to the following bank account and upload your payment slip below to complete your registration. The slip will be sent to the admin for verification.</p>
          </div>
          <div className="bg-gray-50 rounded p-4 mb-4">
            <div className="font-semibold mb-1">Bank Name: <span className="font-normal">Commercial Bank of Ceylon PLC</span></div>
            <div className="font-semibold mb-1">Branch: <span className="font-normal">Battaramulla</span></div>
            <div className="font-semibold mb-1">Account Name: <span className="font-normal">Apeiro Institute</span></div>
            <div className="font-semibold mb-1">Account Number: <span className="font-normal">1234567890</span></div>
            <div className="font-semibold mb-1">Reference: <span className="font-normal">{data.studentId || 'Your Student ID'}</span></div>
          </div>
          <div className="mb-4">
            <div className="font-semibold mb-2">Order Summary:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div><span className="font-bold">Name:</span> {data.fullName}</div>
              <div><span className="font-bold">Email:</span> {data.email}</div>
              <div><span className="font-bold">Mobile:</span> {data.mobile}</div>
              <div><span className="font-bold">Class:</span> {data.classTitle}</div>
              <div><span className="font-bold">Invoice ID:</span> {data.invoiceId}</div>
              <div><span className="font-bold">Date:</span> {data.date}</div>
              <div><span className="font-bold">Total:</span> LKR {data.total?.toLocaleString()}</div>
            </div>
          </div>
          {/* Modern Upload slip */}
          <form onSubmit={handleUpload} className="mb-4 flex flex-col gap-2 print:hidden">
            <label className="font-semibold">Upload Payment Slip (PDF, JPG, PNG, &lt;10MB):</label>
            <div
              className={`border-2 rounded p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${dragActive ? 'border-cyan-600 bg-cyan-50' : 'border-dashed border-gray-300 bg-gray-50'}`}
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{ minHeight: 80 }}
            >
              {file ? (
                <div className="flex items-center gap-2 w-full justify-between">
                  <span className="truncate text-sm">{file.name}</span>
                  <button type="button" onClick={handleRemoveFile} className="text-red-500 text-lg font-bold ml-2">&times;</button>
                </div>
              ) : (
                <span className="text-gray-500 text-sm">Drag & drop or <span className="text-cyan-700 underline">click to select</span> a PDF, JPG, or PNG file (max 10MB)</span>
              )}
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                tabIndex={-1}
              />
            </div>
            {uploading && (
              <div className="w-full bg-gray-200 rounded h-2 mb-2">
                <div
                  className="bg-cyan-600 h-2 rounded"
                  style={{ width: `${progress}%`, transition: 'width 0.2s' }}
                ></div>
              </div>
            )}
            <CustomButton2 type="submit" color="mint" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Slip'}</CustomButton2>
            {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
            {success && <div className="text-green-600 text-xs mt-1">Slip uploaded successfully! Admin will verify your payment soon.</div>}
          </form>
          <div className="text-xs text-gray-400 print:hidden text-center mt-2">After making the transfer, please upload your payment slip here or email it to info@apeiro.lk with your student ID.</div>
        </div>
        {/* Print CSS */}
        <style>{`
          @media print {
            body { background: white !important; }
            .receipt-content { width: 100% !important; margin: 0 !important; box-shadow: none !important; }
            .print\\:hidden { display: none !important; }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

export default BankTransfer; 