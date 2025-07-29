import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import CustomButton2 from '../../../components/CustomButton2';
import { FaCcVisa, FaCcMastercard, FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// REMINDER: Add this to your public/index.html
// <script type="text/javascript" src="https://www.payhere.lk/lib/payhere.js"></script>

const Invoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;
  const [agreed, setAgreed] = useState(false);
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!data) {
    return <div className="p-8 text-center text-gray-500">No invoice data. Please complete checkout first.</div>;
  }

  // PayHere integration - Simplified for demo
  const handlePayHere = async () => {
    if (!agreed) {
      alert('Please agree to the privacy policy and terms first.');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save payment record to localStorage
      const payments = JSON.parse(localStorage.getItem('payments') || '[]');
      payments.push({
        date: data.date,
        classTitle: data.classTitle,
        total: data.total,
        method: 'online',
        status: 'Paid',
        invoiceId: data.invoiceId,
        paymentDate: new Date().toISOString()
      });
      localStorage.setItem('payments', JSON.stringify(payments));
      
                // Add class to My Classes after successful payment
          if (!data.isStudyPack) {
            const myClasses = JSON.parse(localStorage.getItem('myClasses') || '[]');
            // Debug: Log the data received
            console.log('Invoice - Received data zoom link:', data.zoomLink);
            
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
              paymentStatus: 'paid',
              paymentMethod: 'online',
              nextPaymentDate: data.nextPaymentDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              attendance: [],
              paymentHistory: [{
                date: new Date().toISOString(),
                amount: data.total,
                method: 'online',
                status: 'paid',
                invoiceId: data.invoiceId
              }],
              // Add payment tracking data
                      paymentTracking: data.paymentTracking || { enabled: false },
        paymentTrackingFreeDays: data.paymentTrackingFreeDays || 7,
        // Add zoom link and other important fields
        zoomLink: data.zoomLink || '',
        description: data.description || '',
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
          paymentStatus: 'paid',
          paymentMethod: 'online',
          invoiceId: data.invoiceId
        };
        
        if (!myStudyPacks.some(p => p.title === studyPackToAdd.title && p.teacher === studyPackToAdd.teacher)) {
          myStudyPacks.push(studyPackToAdd);
          localStorage.setItem('myStudyPacks', JSON.stringify(myStudyPacks));
        }
      }
      
      // Mark as paid
      setPaid(true);
      
      // Navigate to success page after a short delay
      setTimeout(() => {
        navigate('/student/payment-success', { 
          state: { 
            ...data, 
            paymentDate: new Date().toISOString(),
            transactionId: `TXN${Date.now()}`
          } 
        });
      }, 1000);
      
    } catch (err) {
      console.error('Payment failed:', err);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const doc = new jsPDF();

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('Aperio', 15, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('NO 44/11/C Henati Kubura Road', 15, 28);
    doc.text('Thalangama Noth, Sri Lanka', 15, 34);
    doc.text('+94 70 424 4444', 15, 40);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`INVOICE INV:${data.invoiceId}`, 195, 20, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Date Issued: ${data.date}`, 195, 28, { align: 'right' });

    // Line
    doc.setDrawColor(180);
    doc.line(15, 46, 195, 46);

    // Student details
    let y = 54;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Student Details :', 15, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Name: ${data.fullName || data.lastName}${data.studentId ? '-' + data.studentId : ''}`, 15, y);
    y += 6;
    doc.text(`Address: ${data.address || '-'}`, 15, y);
    y += 6;
    doc.text(`Email: ${data.email}`, 15, y);
    y += 6;
    doc.text(`Mobile: ${data.mobile}${data.otherMobile ? ' | Other Mobile: ' + data.otherMobile : ''}`, 15, y);
    y += 6;
    doc.text(`Paid By: ${data.paymentMethod || 'Online'} - ${paid ? 'Paid' : 'Unpaid'}`, 15, y);

    // Item and summary table
    y += 10;
    autoTable(doc, {
      startY: y,
      head: [['Item', 'Qty', 'Price']],
      body: [
        [data.classTitle, '1', `LKR ${data.basePrice?.toLocaleString()}`],
        [
          { content: 'Sub Total', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
          `LKR ${data.basePrice?.toLocaleString()}`
        ],
        [
          { content: 'Discount', colSpan: 2, styles: { halign: 'right' } },
          `LKR ${data.discount?.toLocaleString()}`
        ],
        [
          { content: 'Speed Post', colSpan: 2, styles: { halign: 'right' } },
          `LKR ${data.speedPostFee?.toLocaleString()}`
        ],
        [
          { content: 'Total', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: `LKR ${data.total?.toLocaleString()}`, styles: { fontStyle: 'bold' } }
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [42, 157, 143], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 11, cellPadding: 3 },
      margin: { left: 20, right: 20 }
    });

    // Note
    let noteY = doc.lastAutoTable.finalY + 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('NOTE: The above amount is charged only for your order. (Once paid, your classes and orders cannot be changed.)', 15, noteY, { maxWidth: 180 });

    doc.save(`invoice_${data.invoiceId}.pdf`);
  };

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="min-h-screen bg-[#fafaf6] flex flex-col items-center py-8">
        <div className="bg-white rounded-xl shadow p-8 w-full max-w-4xl flex flex-col md:flex-row gap-8">
          {/* Left: Logo and Address */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl font-bold">Ⓔ</span>
              <span className="text-xl font-bold">APEIRO</span>
            </div>
            <div className="text-sm text-gray-700 mb-2">NO 44/11/C Henati Kubura Road<br/>Thalangama Noth,Sri Lanka<br/>+94 70 424 4444</div>
          </div>
          {/* Right: Invoice Info and Payment */}
          <div className="w-full md:w-80 flex flex-col items-end">
            <div className="text-right mb-2">
              <div className="font-bold">INVOICE INV-{data.invoiceId || '751989'}</div>
              <div className="text-xs text-gray-500">Date Issued: {data.date || (new Date()).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center mb-2">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="accent-pink-600 mr-2" id="agree" />
              <label htmlFor="agree" className="text-xs">I agree to <span className="text-pink-600 underline">privacy policy & terms</span></label>
            </div>
            <CustomButton2
              type="button"
              color={paid ? 'danger' : 'mint'}
              className={`w-full mb-2 ${paid ? 'bg-gray-400 hover:bg-gray-500 text-white' : ''}`}
              onClick={handlePayHere}
              disabled={!agreed || paid || loading}
            >
              {loading ? 'Processing Payment...' : paid ? 'Payment Successful!' : 'Confirm and Pay Now'}
            </CustomButton2>
            <div className="flex items-center gap-2 mb-2">
              <FaCcVisa className="text-3xl text-blue-700" />
              <FaCcMastercard className="text-3xl text-red-600" />
              <img src="https://www.combank.net/images/logo.png" alt="Commercial Bank" className="h-6" />
            </div>
            <CustomButton2
              type="button"
              color="mint"
              className="w-full flex items-center justify-center gap-2 text-black"
              onClick={handleDownload}
            >
              <FaDownload /> Download Invoice
            </CustomButton2>
          </div>
        </div>
        {/* Student Details and Items */}
        <div className="bg-white rounded-xl shadow p-8 w-full max-w-4xl mt-6">
          <div className="mb-4">
            <div className="font-semibold mb-2">Student Details:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div><span className="font-bold">Name:</span> {data.fullName || data.lastName}</div>
              <div><span className="font-bold">Address:</span> {data.address || '-'}</div>
              <div><span className="font-bold">Email:</span> {data.email}</div>
              <div><span className="font-bold">Mobile:</span> {data.mobile}</div>
              <div><span className="font-bold">Medium:</span> {data.medium}</div>
              <div><span className="font-bold">Invoice Status:</span> <span className={`px-2 py-1 rounded text-xs ${paid ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{paid ? 'Paid' : 'Unpaid'}</span></div>
            </div>
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-12 text-xs font-bold text-gray-500 mb-2">
              <div className="col-span-7">ITEM</div>
              <div className="col-span-2 text-center">QTY</div>
              <div className="col-span-3 text-right">PRICE</div>
            </div>
            <div className="grid grid-cols-12 text-sm mb-2">
              <div className="col-span-7">{data.classTitle}</div>
              <div className="col-span-2 text-center">1</div>
              <div className="col-span-3 text-right">LKR {data.basePrice?.toLocaleString()}</div>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-end text-xs text-green-600 mb-1">Promo Applied: - LKR {data.discount.toLocaleString()}</div>
            )}
            {data.speedPostFee > 0 && (
              <div className="flex justify-end text-xs text-red-600 mb-1">Speed Post: + LKR {data.speedPostFee.toLocaleString()}</div>
            )}
            <div className="flex justify-end font-bold mt-2">Total: LKR {data.total?.toLocaleString()}</div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="font-bold">Note:</span> ඉහත සඳහන් මුදල සම්පූර්ණයෙන්ම අය කරනු ලබන්නේ ඔබගේ ඇනවුම සදහා පමණි. (මුදල් once paid ඇතුළු ඔබගේ පන්ති හා ඇනවුම් වෙනස් කල නොහැක.)
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoice; 