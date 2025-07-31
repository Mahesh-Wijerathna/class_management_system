import React from 'react';
import { logout } from '../api/apiUtils';

const LogoutHandler = ({ children }) => {
  const handleLogout = async () => {
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
  };

  // Clone children and pass the logout handler
  return React.cloneElement(children, { onLogout: handleLogout });
};

export default LogoutHandler; 