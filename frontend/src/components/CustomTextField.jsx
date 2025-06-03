import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const CustomTextField = ({ id, name, type, value, onChange, placeholder, icon: Icon, error, touched, isPassword, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const paddingRight = isPassword ? 'pr-10' : 'pr-4';

  // Determine icon color based on focus or value
  const iconColorClass = isFocused || value ? 'text-[#1a365d]' : 'text-gray-400';

  return (
    <div className='flex flex-col'>
      <div className='relative'>
        <input
          id={id}
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full pl-10 ${paddingRight} py-2.5 text-xs border-2 border-[#1a365d] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:border-[#1a365d] transition-shadow shadow-sm focus:shadow-md`}
          {...props}
        />
        {Icon && <Icon className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${iconColorClass}`} />}
        {isPassword && (
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </div>
      {error && touched && (
        <span className='text-red-500 text-[10px] mt-1'>{error}</span>
      )}
    </div>
  );
};

export default CustomTextField; 