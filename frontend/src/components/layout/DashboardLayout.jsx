import React, { useState } from 'react';
import NavbarWithAlert from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ 
  children, 
  userRole, 
  sidebarItems
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSidebarToggle = (newState) => {
    setIsSidebarOpen(newState);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavbarWithAlert 
        userRole={userRole} 
        isSidebarOpen={isSidebarOpen}
      />
      <Sidebar 
        items={sidebarItems} 
        onToggle={handleSidebarToggle}
      />
      
      <main className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-16'}`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 