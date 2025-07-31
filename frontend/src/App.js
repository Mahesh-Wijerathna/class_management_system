
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { authRoutes, adminRoutes, adminDashboardRoutes, teacherRoutes, studentRoutes } from './routes';

import AuthGuard from './components/AuthGuard';
import PublicRoute from './components/PublicRoute';
import LogoutSync from './components/LogoutSync';
import LogoutHandler from './components/LogoutHandler';

function App() {
  return (
    <BrowserRouter>
      <LogoutSync />
      <Routes>
        
        
        {/* Auth Routes - Public (redirect if authenticated) */}
        {authRoutes.map((route, index) => (
          <Route 
            key={index} 
            path={route.path} 
            element={<PublicRoute>{route.element}</PublicRoute>} 
          />
        ))}

        {/* Admin Dashboard Routes - Protected */}
        {adminDashboardRoutes.map((route, index) => (
          <Route 
            key={index} 
            path={route.path} 
            element={<AuthGuard requiredRole="admin"><LogoutHandler>{route.element}</LogoutHandler></AuthGuard>} 
          />
        ))}

        {/* Admin Nested Routes - Protected */}
        {adminRoutes.map((route, index) => (
          <Route 
            key={index} 
            path={route.path} 
            element={<AuthGuard requiredRole="admin"><LogoutHandler>{route.element}</LogoutHandler></AuthGuard>}
          >
            {route.children?.map((child, childIndex) => (
              <Route 
                key={childIndex} 
                path={child.path} 
                element={<LogoutHandler>{child.element}</LogoutHandler>} 
                index={child.index}
              />
            ))}
          </Route>
        ))}

        {/* Teacher Routes - Protected */}
        {teacherRoutes.map((route, index) => (
          <Route 
            key={index} 
            path={route.path} 
            element={<AuthGuard requiredRole="teacher"><LogoutHandler>{route.element}</LogoutHandler></AuthGuard>} 
          />
        ))}

        {/* Student Routes - Protected */}
        {studentRoutes.map((route, index) => (
          <Route 
            key={index} 
            path={route.path} 
            element={<AuthGuard requiredRole="student"><LogoutHandler>{route.element}</LogoutHandler></AuthGuard>} 
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
