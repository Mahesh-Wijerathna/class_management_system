import BarcodeAttendanceScanner from './pages/barcode/BarcodeAttendanceScanner';

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { authRoutes, adminRoutes, adminDashboardRoutes, teacherRoutes, studentRoutes, cashierRoutes } from './routes';

import AuthGuard from './components/AuthGuard';
import PublicRoute from './components/PublicRoute';
import LogoutSync from './components/LogoutSync';
import LogoutHandler from './components/LogoutHandler';
import { SidebarProvider } from './components/layout/SidebarContext';

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
            element={
              <AuthGuard requiredRole="admin">
                <SidebarProvider>
                  <LogoutHandler>
                    {route.element}
                  </LogoutHandler>
                </SidebarProvider>
              </AuthGuard>
            }
          />
        ))}

        {/* Barcode Attendance Scanner Route - Public */}
        <Route path="/scanner" element={<BarcodeAttendanceScanner />} />

        {/* Admin Nested Routes - Protected */}
        {adminRoutes.map((route, index) => (
          <Route 
            key={index} 
            path={route.path} 
            element={
              <AuthGuard requiredRole="admin">
                <SidebarProvider>
                  <LogoutHandler>
                    {route.element}
                  </LogoutHandler>
                </SidebarProvider>
              </AuthGuard>
            }
          >
            {route.children?.map((child, childIndex) => (
              <Route 
                key={childIndex} 
                path={child.path} 
                element={child.element} 
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
            element={
              <AuthGuard requiredRole="teacher">
                <SidebarProvider>
                  <LogoutHandler>
                    {route.element}
                  </LogoutHandler>
                </SidebarProvider>
              </AuthGuard>
            } 
          />
        ))}

        {/* Student Routes - Protected with SidebarProvider */}
        {studentRoutes.map((route, index) => (
          <Route 
            key={index}
            path={route.path} 
            element={
              <AuthGuard requiredRole="student">
                <SidebarProvider>
                  <LogoutHandler>
                    {route.element}
                  </LogoutHandler>
                </SidebarProvider>
              </AuthGuard>
            } 
          />
        ))}

        {/* Cashier Routes - Protected */}
        {cashierRoutes.map((route, index) => (
          <Route 
            key={index} 
            path={route.path} 
            element={
              <AuthGuard requiredRole="cashier">
                <SidebarProvider>
                  <LogoutHandler>
                    {route.element}
                  </LogoutHandler>
                </SidebarProvider>
              </AuthGuard>
            } 
          />
        ))}
  {/* Barcode Attendance Scanner Route - Public */}
  <Route path="/scanner" element={<BarcodeAttendanceScanner />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
