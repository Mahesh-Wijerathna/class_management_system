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
        // Clear both storages to be safe
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('rememberedUser');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('tokenExpiry');
        
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('usePersistentStorage');
        sessionStorage.removeItem('tokenExpiry');
        
        // Signal logout to other tabs
        localStorage.setItem('logout', 'true');
        
        // Redirect to login
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