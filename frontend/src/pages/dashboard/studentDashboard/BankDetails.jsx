import React from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';

const BankDetails = () => (
  <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
    <div className="max-w-xl mx-auto p-8 bg-white rounded-xl shadow mt-8">
      <h1 className="text-2xl font-bold mb-4 text-cyan-700">Bank Details for Payments</h1>
      <div className="mb-4">
        <div className="font-semibold mb-1">Bank Name: <span className="font-normal">Commercial Bank of Ceylon PLC</span></div>
        <div className="font-semibold mb-1">Branch: <span className="font-normal">Battaramulla</span></div>
        <div className="font-semibold mb-1">Account Name: <span className="font-normal">Apeiro Institute</span></div>
        <div className="font-semibold mb-1">Account Number: <span className="font-normal">1234567890</span></div>
      </div>
      <div className="text-sm text-gray-700 bg-cyan-50 rounded p-3">
        <b>Note:</b> Please use your <span className="font-mono">Student ID</span> as the payment reference when making a bank transfer. After payment, upload your slip in the system or email it to info@apeiro.lk.
      </div>
    </div>
  </DashboardLayout>
);

export default BankDetails; 