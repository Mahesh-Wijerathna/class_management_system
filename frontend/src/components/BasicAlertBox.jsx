import React from 'react';

/**
 * BasicAlertBox - A stylish alert/confirmation box component.
 * Props:
 *  - open: boolean (show/hide)
 *  - message: string (main message)
 *  - onConfirm: function (called on confirm/OK)
 *  - onCancel: function (called on cancel, only for confirmation)
 *  - confirmText: string (button text, default 'OK')
 *  - cancelText: string (button text, optional)
 *  - type: 'info' | 'success' | 'danger' (theme)
 *
 * Usage:
 * <BasicAlertBox open={open} message="..." onConfirm={...} onCancel={...} confirmText="OK" cancelText="Cancel" type="danger" />
 */

const theme = {
  info: {
    border: 'border-[#bfc3fa] border-4',
    bg: 'bg-white',
    text: 'text-[#1a237e]',
    btnBg: 'bg-[#bfc3fa] hover:bg-[#a5a9e6] text-white border border-[#bfc3fa] font-bold',
    btnCancel: 'bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold',
  },
  success: {
    border: 'border-[#bfc3fa] border-4',
    bg: 'bg-white',
    text: 'text-[#1a237e]',
    btnBg: 'bg-green-600 hover:bg-green-700 text-white font-bold',
    btnCancel: 'bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold',
  },
  danger: {
    border: 'border-[#bfc3fa] border-4',
    bg: 'bg-white',
    text: 'text-[#1a237e]',
    btnBg: 'bg-[#ef4444] hover:bg-[#b91c1c] text-white border border-[#ef4444] font-bold',
    btnCancel: 'bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold',
  },
};

const BasicAlertBox = ({
  open,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = '',
  type = 'info',
}) => {
  if (!open) return null;
  const t = theme[type] || theme.info;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
      <div className={`rounded-xl shadow-2xl p-6 w-full max-w-xs flex flex-col items-center border-2 ${t.border} ${t.bg}`}>
        <div className={`text-lg font-bold mb-4 text-center ${t.text}`}>{message}</div>
        <div className={`flex gap-4 mt-2 ${!cancelText ? 'justify-center' : ''}`}>
          {cancelText ? (
            <>
              <button
                className={`px-4 py-2 rounded ${t.btnCancel}`}
                onClick={onCancel}
              >
                {cancelText}
              </button>
              <button
                className={`px-4 py-2 rounded ${t.btnBg}`}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              className={`px-4 py-2 rounded ${t.btnBg}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicAlertBox;
