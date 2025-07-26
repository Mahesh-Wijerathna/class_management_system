import React from 'react';
import CustomButton2 from '../../../components/CustomButton2';
import { useNavigate } from 'react-router-dom';

const PaymentCancel = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Payment Cancelled</h1>
        <p className="mb-6 text-gray-700">Your payment was cancelled. If this was a mistake, you can try again or return to your dashboard.</p>
        <CustomButton2 onClick={() => navigate('/student/invoice')} className="mb-2">Back to Invoice</CustomButton2>
        <CustomButton2 onClick={() => navigate('/studentdashboard')} color="mint">Go to Dashboard</CustomButton2>
      </div>
    </div>
  );
};

export default PaymentCancel; 