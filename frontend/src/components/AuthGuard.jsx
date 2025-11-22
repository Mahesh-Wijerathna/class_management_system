import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserData, checkTokenExpiry } from '../api/apiUtils';

const AuthGuard = ({ children, requiredRole = null }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      // Check if token is expired
      checkTokenExpiry();
      
      const authenticated = isAuthenticated();
      const user = getUserData();
      
      setIsAuth(authenticated);
      setUserRole(user?.role || null);
      setIsLoading(false);
    };

    checkAuth();
  }, [location.pathname]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3da58a]"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // If role is required and user doesn't have it, redirect to appropriate dashboard
  if (requiredRole && userRole !== requiredRole) {
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admindashboard" replace />;
      case 'teacher':
        return <Navigate to="/teacherdashboard" replace />;
      case 'student':
        return <Navigate to="/studentdashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default AuthGuard; 