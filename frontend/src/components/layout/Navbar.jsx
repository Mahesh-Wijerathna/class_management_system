import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSun, FaMoon } from 'react-icons/fa';
import CustomButton from '../CustomButton';

const Navbar = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    // Optionally, add logic to toggle dark mode in your app
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${isScrolled 
          ? 'bg-white/20 backdrop-blur-sm shadow-lg' 
          : 'bg-white/30 backdrop-blur-sm shadow-lg'
        }`}
    >
      <div className="w-full px-4">
        <div className="flex justify-end h-16 items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
          </button>
          <CustomButton 
            type="button" 
            onClick={onLogout} 
            className="py-2 px-3 text-xs rounded mt-0 mb-0 w-auto min-w-0"
          >
            Logout
          </CustomButton>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 