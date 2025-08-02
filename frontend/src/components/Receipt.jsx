import React from 'react';
import { FaPrint, FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Receipt = ({ paymentData, onClose }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.text('PAYMENT RECEIPT', 105, 20, { align: 'center' });
    
    // Add company info
    doc.setFontSize(12);
    doc.text('Class Management System', 105, 35, { align: 'center' });
    doc.text('123 Education Street, Colombo, Sri Lanka', 105, 42, { align: 'center' });
    doc.text('Phone: +94 11 234 5678 | Email: info@cms.lk', 105, 49, { align: 'center' });
    
    // Add receipt details
    doc.setFontSize(14);
    doc.text('Receipt Details', 20, 70);
    
    const receiptData = [
      ['Receipt Number:', paymentData.transactionId || paymentData.invoiceId],
      ['Date:', paymentData.date],
      ['Student Name:', paymentData.fullName],
      ['Mobile:', paymentData.mobile],
      ['Email:', paymentData.email],
    ];
    
    autoTable(doc, {
      startY: 75,
      head: [],
      body: receiptData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 100 }
      }
    });
    
    // Add class details
    doc.setFontSize(14);
    doc.text('Class Details', 20, 130);
    
    const classData = [
      ['Class Name:', paymentData.className],
      ['Subject:', paymentData.subject],
      ['Teacher:', paymentData.teacher],
      ['Stream:', paymentData.stream],
      ['Course Type:', paymentData.courseType],
    ];
    
    autoTable(doc, {
      startY: 135,
      head: [],
      body: classData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 100 }
      }
    });
    
    // Add payment details
    doc.setFontSize(14);
    doc.text('Payment Details', 20, 190);
    
    const paymentDetails = [
      ['Base Price:', `LKR ${paymentData.basePrice?.toLocaleString() || '0'}`],
      ['Discount:', `LKR ${paymentData.discount?.toLocaleString() || '0'}`],
      ['Speed Post Fee:', `LKR ${paymentData.speedPostFee?.toLocaleString() || '0'}`],
      ['Total Amount:', `LKR ${paymentData.amount?.toLocaleString() || '0'}`],
      ['Payment Method:', paymentData.paymentMethod || 'Online'],
      ['Status:', 'Paid'],
    ];
    
    autoTable(doc, {
      startY: 195,
      head: [],
      body: paymentDetails,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 100 }
      }
    });
    
    // Add footer
    doc.setFontSize(10);
    doc.text('Thank you for your payment!', 105, 270, { align: 'center' });
    doc.text('This is a computer generated receipt.', 105, 277, { align: 'center' });
    
    // Save the PDF
    doc.save(`receipt-${paymentData.transactionId || paymentData.invoiceId}.pdf`);
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .receipt-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .company-info { font-size: 14px; color: #666; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .detail-row { display: flex; margin-bottom: 5px; }
            .label { font-weight: bold; width: 150px; }
            .value { flex: 1; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="receipt-title">PAYMENT RECEIPT</div>
            <div class="company-info">
              Class Management System<br>
              123 Education Street, Colombo, Sri Lanka<br>
              Phone: +94 11 234 5678 | Email: info@cms.lk
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Receipt Details</div>
            <div class="detail-row">
              <span class="label">Receipt Number:</span>
              <span class="value">${paymentData.transactionId || paymentData.invoiceId}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date:</span>
              <span class="value">${paymentData.date}</span>
            </div>
            <div class="detail-row">
              <span class="label">Student Name:</span>
              <span class="value">${paymentData.fullName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Mobile:</span>
              <span class="value">${paymentData.mobile}</span>
            </div>
            <div class="detail-row">
              <span class="label">Email:</span>
              <span class="value">${paymentData.email}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Class Details</div>
            <div class="detail-row">
              <span class="label">Class Name:</span>
              <span class="value">${paymentData.className}</span>
            </div>
            <div class="detail-row">
              <span class="label">Subject:</span>
              <span class="value">${paymentData.subject}</span>
            </div>
            <div class="detail-row">
              <span class="label">Teacher:</span>
              <span class="value">${paymentData.teacher}</span>
            </div>
            <div class="detail-row">
              <span class="label">Stream:</span>
              <span class="value">${paymentData.stream}</span>
            </div>
            <div class="detail-row">
              <span class="label">Course Type:</span>
              <span class="value">${paymentData.courseType}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Payment Details</div>
            <div class="detail-row">
              <span class="label">Base Price:</span>
              <span class="value">LKR ${paymentData.basePrice?.toLocaleString() || '0'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Discount:</span>
              <span class="value">LKR ${paymentData.discount?.toLocaleString() || '0'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Speed Post Fee:</span>
              <span class="value">LKR ${paymentData.speedPostFee?.toLocaleString() || '0'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Total Amount:</span>
              <span class="value">LKR ${paymentData.amount?.toLocaleString() || '0'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Payment Method:</span>
              <span class="value">${paymentData.paymentMethod || 'Online'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value">Paid</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>This is a computer generated receipt.</p>
          </div>
          
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()">Print Receipt</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Payment Receipt</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Receipt Header */}
          <div className="text-center border-b pb-4">
            <h3 className="text-lg font-bold">PAYMENT RECEIPT</h3>
            <p className="text-sm text-gray-600">Class Management System</p>
            <p className="text-xs text-gray-500">123 Education Street, Colombo, Sri Lanka</p>
          </div>
          
          {/* Receipt Details */}
          <div>
            <h4 className="font-semibold mb-2">Receipt Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Receipt Number:</span> {paymentData.transactionId || paymentData.invoiceId}</div>
              <div><span className="font-medium">Date:</span> {paymentData.date}</div>
              <div><span className="font-medium">Student Name:</span> {paymentData.fullName}</div>
              <div><span className="font-medium">Mobile:</span> {paymentData.mobile}</div>
              <div><span className="font-medium">Email:</span> {paymentData.email}</div>
            </div>
          </div>
          
          {/* Class Details */}
          <div>
            <h4 className="font-semibold mb-2">Class Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Class Name:</span> {paymentData.className}</div>
              <div><span className="font-medium">Subject:</span> {paymentData.subject}</div>
              <div><span className="font-medium">Teacher:</span> {paymentData.teacher}</div>
              <div><span className="font-medium">Stream:</span> {paymentData.stream}</div>
              <div><span className="font-medium">Course Type:</span> {paymentData.courseType}</div>
            </div>
          </div>
          
          {/* Payment Details */}
          <div>
            <h4 className="font-semibold mb-2">Payment Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Base Price:</span> LKR {paymentData.basePrice?.toLocaleString() || '0'}</div>
              <div><span className="font-medium">Discount:</span> LKR {paymentData.discount?.toLocaleString() || '0'}</div>
              <div><span className="font-medium">Speed Post Fee:</span> LKR {paymentData.speedPostFee?.toLocaleString() || '0'}</div>
              <div><span className="font-medium">Total Amount:</span> LKR {paymentData.amount?.toLocaleString() || '0'}</div>
              <div><span className="font-medium">Payment Method:</span> {paymentData.paymentMethod || 'Online'}</div>
              <div><span className="font-medium">Status:</span> <span className="text-green-600 font-semibold">Paid</span></div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center border-t pt-4">
            <p className="text-sm text-gray-600">Thank you for your payment!</p>
            <p className="text-xs text-gray-500">This is a computer generated receipt.</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={printReceipt}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FaPrint />
            Print Receipt
          </button>
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <FaDownload />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt; 