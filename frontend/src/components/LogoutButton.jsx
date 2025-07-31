import React from 'react';
import { logout } from '../api/apiUtils';

const LogoutButton = ({ className = "" }) => {
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Logout failed:', error);
        // Fallback: force logout even if API call fails
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('rememberedUser');
        localStorage.setItem('logout', 'true');
        window.location.href = '/login';
      }
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors ${className}`}
    >
      Logout
    </button>
  );
};

export default LogoutButton; 