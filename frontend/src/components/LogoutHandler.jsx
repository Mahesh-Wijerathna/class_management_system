import React from 'react';
import { logout } from '../api/apiUtils';

const LogoutHandler = ({ children }) => {
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

  // Clone children and pass the logout handler
  return React.cloneElement(children, { onLogout: handleLogout });
};

export default LogoutHandler; 