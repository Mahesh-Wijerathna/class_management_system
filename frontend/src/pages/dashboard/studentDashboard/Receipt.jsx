import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomButton2 from '../../../components/CustomButton2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Receipt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  if (!data) {
    return <div className="p-8 text-center text-gray-500">No receipt data. Please complete checkout first.</div>;
  }

  return (
    <div className="min-h-screen bg-[#fafaf6] flex flex-col items-center py-8">
      <div className="receipt-content bg-white rounded-xl shadow p-8 w-full max-w-2xl flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-3xl font-bold">Ⓔ</span>
          <span className="text-xl font-bold">APEIRO</span>
        </div>
        <div className="text-sm text-gray-700 mb-2">NO 44/11/C Henati Kubura Road<br/>Thalangama Noth, Sri Lanka<br/>+94 70 424 4444</div>
        <div className="text-right mb-2">
          <div className="font-bold">RECEIPT INV-{data.invoiceId || '751989'}</div>
          <div className="text-xs text-gray-500">Date Issued: {data.date || (new Date()).toLocaleDateString()}</div>
        </div>
        {/* Student Details */}
        <div className="mb-4">
          <div className="font-semibold mb-2">Student Details:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><span className="font-bold">Name:</span> {data.fullName || data.lastName}</div>
            <div><span className="font-bold">Address:</span> {data.address || '-'}</div>
            <div><span className="font-bold">Email:</span> {data.email}</div>
            <div><span className="font-bold">Mobile:</span> {data.mobile}</div>
            <div><span className="font-bold">Medium:</span> {data.medium}</div>
            <div><span className="font-bold">Invoice Status:</span> <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">Paid</span></div>
          </div>
        </div>
        {/* Items Table */}
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-12 text-xs font-bold text-gray-500 mb-2">
            <div className="col-span-7">ITEM</div>
            <div className="col-span-2 text-center">QTY</div>
            <div className="col-span-3 text-right">PRICE</div>
          </div>
          <div className="grid grid-cols-12 text-sm mb-2">
            <div className="col-span-7">{data.className}</div>
            <div className="col-span-2 text-center">1</div>
            <div className="col-span-3 text-right">LKR {data.basePrice?.toLocaleString()}</div>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-end text-xs text-green-600 mb-1">Promo Applied: - LKR {data.discount.toLocaleString()}</div>
          )}
          {data.speedPostFee > 0 && (
            <div className="flex justify-end text-xs text-red-600 mb-1">Speed Post: + LKR {data.speedPostFee.toLocaleString()}</div>
          )}
          <div className="flex justify-end font-bold mt-2">Total: LKR {data.amount?.toLocaleString()}</div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <span className="font-bold">Note:</span> This is your official payment receipt. Please keep a printed or digital copy for your records.
        </div>
        <CustomButton2
          type="button"
          color="mint"
          className="w-full flex items-center justify-center gap-2 text-black print:hidden"
          onClick={() => window.print()}
        >
          🖨️ Print Receipt
        </CustomButton2>
        <div className="text-xs text-gray-400 print:hidden text-center mt-2">For best results, use A4 paper and set margins to default in your print dialog.</div>
      </div>
      {/* Print CSS */}
      <style>{`
        @media print {
          body { background: white !important; }
          .receipt-content { width: 100% !important; margin: 0 !important; box-shadow: none !important; }
          .print\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Receipt; 