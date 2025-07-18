import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomButton from '../../components/CustomButton';
import {FaGraduationCap } from 'react-icons/fa'

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'">
      <div className='max-w-md w-full flex flex-col p-8 items-center'>
      <div className='app-log flex flex-col justify-center items-center mb-8'>
          <div className='w-12 h-12 rounded-full bg-[#3da58a] flex items-center justify-center mb-3 shadow-xl backdrop-blur-sm'>
            <FaGraduationCap className='text-white text-2xl' />
          </div>
          <span className='text-2xl font-bold text-[#1a365d] mb-1'>
            TCMS
          </span>
          <span className='text-sm text-[#1a365d] font-medium'>
            Student Registration
          </span>
        </div>
      
      <div className="flex flex-col gap-6 w-full max-w-md">
        {/* Institute Student Register Card */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="mb-4">
            <div className="text-lg font-semibold mb-1">Institute Student Register</div>
            <div className="text-sm text-gray-700">
              ඔබ දැනටමත් ආයතනයේ නමින් ලියාපදිංචි, නම් ඔබගේ ආයතන ඊමේල් සහ ලියාපදිංචි නමට සම්බන්ධිත නව Institute Student Register තනතුර ලියාපදිංචි වී සිටින්න.
            </div>
          </div>
          <CustomButton
            type="button"
            onClick={() => navigate('/register/institute')}
          >
            Institute Student Register
          </CustomButton>
        </div>
        {/* New Student Register Card */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="mb-4">
            <div className="text-lg font-semibold mb-1">New Student Register</div>
            <div className="text-sm text-gray-700">
              ඔබ ආයතනයට පන්ති නොපැමිණ, නව සිසුවෙකු නම් New Student Register තනතුර ලියාපදිංචි වී සිටින්න.
            </div>
          </div>
          <CustomButton
            type="button"
            onClick={() => navigate('/register/new')}
          >
            New Student Register
          </CustomButton>
        </div>
        
      </div>
      <Link to="/login" className="mt-8 text-[#064e3b] hover:underline text-xs">Already registered?</Link>
      </div>
    </div>
  );
} 