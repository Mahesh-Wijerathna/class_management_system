import React, { useEffect } from 'react';

const LogoutSync = () => {
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'logout' && e.newValue === 'true') {
        // Clear all auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('rememberedUser');
        
        // Redirect to login
        window.location.href = '/login';
      }
    };

    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default LogoutSync; 