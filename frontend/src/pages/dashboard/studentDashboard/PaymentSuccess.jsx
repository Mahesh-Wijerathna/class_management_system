import React from 'react';
import CustomButton2 from '../../../components/CustomButton2';
import { useNavigate, useLocation } from 'react-router-dom';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state;
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-green-700">Payment Successful!</h1>
        <p className="mb-6 text-gray-700">Thank you for your payment. Your transaction was successful and your invoice has been updated.</p>
        <CustomButton2 onClick={() => navigate('/studentdashboard')} className="mb-2">Go to Dashboard</CustomButton2>
        <CustomButton2 onClick={() => navigate('/student/my-classes')} color="mint" className="mb-2">View My Classes</CustomButton2>
        <CustomButton2
          onClick={() => data && navigate('/student/receipt', { state: data })}
          color="mint"
          disabled={!data}
        >
          Print Receipt
        </CustomButton2>
      </div>
    </div>
  );
};

export default PaymentSuccess; 