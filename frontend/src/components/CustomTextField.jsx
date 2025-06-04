import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const CustomTextField = ({ id, name, type, value, onChange, label, icon: Icon, error, touched, isPassword, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const paddingRight = isPassword ? 'pr-10' : 'pr-4';

  // Determine label and icon color based on focus or value
   const activeColorClass = 'text-[#1a365d]'; // Button color
   const defaultColorClass = 'text-gray-400';

   // The label position and color is controlled by peer-focus and peer-placeholder-shown


  return (
    <div className='flex flex-col'>
      <div className='relative'>
        <input
          id={id}
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={props.onFocus} // Pass through focus handler if needed
          onBlur={props.onBlur} // Pass through blur handler if needed
          placeholder=" " // Placeholder must be non-empty for peer-placeholder-shown to work correctly
          className={`peer w-full pl-2 ${paddingRight} py-2.5 text-xs border-2 border-[#1a365d] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:border-[#1a365d] transition-shadow shadow-sm focus:shadow-md`}
          {...props}
        />

        {/* Floating Label */}
        <label 
          htmlFor={id}
          className={`absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-medium bg-white px-1 transition-all duration-200 pointer-events-none 
            peer-focus:-top-3 peer-focus:${activeColorClass} peer-focus:text-[10px] 
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-xs peer-placeholder-shown:${defaultColorClass}
            ${value ? '-top-3 text-[10px] ' + activeColorClass : ''}
          `}
        >
            <span className='flex items-center'>
              {Icon && <Icon className='mr-2' />}
              {label}
            </span>
        </label>

        {/* Password Visibility Toggle (remains separately positioned)*/}
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