import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaGraduationCap } from 'react-icons/fa';

const Sidebar = ({ items, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle(newState);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white shadow-lg transition-all duration-300 ease-in-out z-[55]
          ${isOpen ? 'w-64' : 'w-16'}`}
      >
        <div className="h-full overflow-y-auto">
          {/* Top bar with close button absolutely positioned and TCMS centered */}
          <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200 relative">
            {/* Close button absolutely positioned at top-left */}
            <button
              onClick={toggleSidebar}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-md bg-white shadow-md hover:bg-gray-100 transition-colors"
              style={{ zIndex: 2 }}
            >
              {isOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
            </button>
            {/* Centered TCMS icon and title */}
            {isOpen && (
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#3da58a] flex items-center justify-center shadow-xl backdrop-blur-sm">
                  <FaGraduationCap className="text-white text-xl" />
                </span>
                <h1 className="text-lg font-bold text-gray-800">TCMS</h1>
              </div>
            )}
          </div>
          <nav className="p-2">
            {items.map((section, sectionIdx) => (
              <div key={sectionIdx} className="mb-4">
                {isOpen && (
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.section}
                  </div>
                )}
                {section.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors mb-1
                      ${location.pathname === item.path
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <span className={`${isOpen ? 'mr-3' : 'mx-auto'}`}>{item.icon}</span>
                    {isOpen && <span>{item.name}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 