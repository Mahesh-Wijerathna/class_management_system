import React from 'react';
import NavbarWithAlert from './Navbar';
import Sidebar from './Sidebar';
import { useSidebar, SidebarProvider } from './SidebarContext';

const DashboardContent = ({ 
  children, 
  userRole, 
  sidebarItems,
  onLogout,
  customHeaderElements,
  customTitle,
  customSubtitle,
  isLocked = false
}) => {
  const { isSidebarOpen, isMobile, toggleSidebar, setSidebarOpen } = useSidebar();

  // Force sidebar to close when session is locked
  const effectiveSidebarOpen = isLocked ? false : isSidebarOpen;

  return (
    <div className="min-h-screen bg-gray-100">
      <NavbarWithAlert 
        userRole={userRole} 
        isSidebarOpen={effectiveSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onLogout={onLogout}
        customHeaderElements={customHeaderElements}
        customTitle={customTitle}
        customSubtitle={customSubtitle}
        isMobile={isMobile}
        isLocked={isLocked}
      />
      <Sidebar 
        items={sidebarItems} 
        onToggle={setSidebarOpen}
        isMobile={isMobile}
        isOpen={effectiveSidebarOpen}
        isLocked={isLocked}
      />
      
      <main className={`pt-16 transition-all duration-300 ${
        isMobile 
          ? 'pl-0' // No left padding on mobile
          : effectiveSidebarOpen 
            ? 'pl-64' 
            : 'pl-16'
      }`}>
        <div className="p-2 sm:p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

const DashboardLayout = ({ 
  children, 
  userRole, 
  sidebarItems,
  onLogout,
  customHeaderElements,
  customTitle,
  customSubtitle,
  defaultSidebarOpen = true,
  isLocked = false
}) => {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <DashboardContent
        userRole={userRole}
        sidebarItems={sidebarItems}
        onLogout={onLogout}
        customHeaderElements={customHeaderElements}
        customTitle={customTitle}
        customSubtitle={customSubtitle}
        isLocked={isLocked}
      >
        {children}
      </DashboardContent>
    </SidebarProvider>
  );
};

export default DashboardLayout; 