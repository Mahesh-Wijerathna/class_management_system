import React from 'react';

export default function BasicCard({ title, price, description, image, buttonText, onButtonClick, children, buttonDisabled = false }) {
  return (
    <div className="relative flex flex-col my-2 sm:my-4 bg-[#f7f9ff] shadow-lg rounded-3xl w-full max-w-xs sm:w-80 p-2 sm:p-4 ">
      {image && (
        <div className="relative h-24 sm:h-32 overflow-hidden rounded-2xl mb-2">
          <img
            src={image}
            alt="card-image"
            className="h-24 sm:h-32 w-full object-cover"
          />
        </div>
      )}
      {title && (
        <div className="mb-1 w-full flex items-center justify-between">
          {typeof title === 'string' ? (
          <p className="text-slate-800 text-base sm:text-lg font-semibold">{title}</p>
          ) : (
            <div className="text-slate-800 text-base sm:text-lg font-semibold">{title}</div>
          )}
          {price && (typeof price === 'string' ? (
            <p className="text-cyan-600 text-base sm:text-lg font-semibold">{price}</p>
          ) : (
            <div className="text-cyan-600 text-base sm:text-lg font-semibold">{price}</div>
          ))}
        </div>
      )}
      {description && (
        <p className="text-slate-600 text-xs sm:text-sm leading-normal font-light mb-2">{description}</p>
      )}
      {children && <div className="w-full">{children}</div>}
      {buttonText && (
        <button
          className={`rounded-md w-full mt-2 py-2 px-4 border border-transparent text-center text-xs sm:text-sm transition-all shadow-md ${
            buttonDisabled
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
              : 'bg-cyan-600 text-white hover:bg-cyan-700 focus:bg-cyan-700 active:bg-cyan-700 hover:shadow-lg focus:shadow-none active:shadow-none'
          }`}
          type="button"
          onClick={onButtonClick}
          disabled={buttonDisabled}
        >
          {buttonDisabled ? 'Access Restricted' : buttonText}
        </button>
      )}
    </div>
  );
}
