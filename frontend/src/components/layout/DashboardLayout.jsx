// import React from 'react';
// import NavbarWithAlert from './Navbar';
// import Sidebar from './Sidebar';
// import { useSidebar } from './SidebarContext';

// const DashboardLayout = ({ 
//   children, 
//   userRole, 
//   sidebarItems,
//   onLogout
// }) => {
//   const { isSidebarOpen, isMobile, toggleSidebar, setSidebarOpen } = useSidebar();

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <NavbarWithAlert 
//         userRole={userRole} 
//         isSidebarOpen={isSidebarOpen}
//         onToggleSidebar={toggleSidebar}
//         onLogout={onLogout}
//       />
//       <Sidebar 
//         items={sidebarItems} 
//         onToggle={setSidebarOpen}
//         isMobile={isMobile}
//         isOpen={isSidebarOpen}
//       />
      
//       <main className={`pt-16 transition-all duration-300 ${
//         isMobile 
//           ? 'pl-0' // No left padding on mobile
//           : isSidebarOpen 
//             ? 'pl-64' 
//             : 'pl-16'
//       }`}>
//         <div className="p-2 sm:p-4 lg:p-6">
//           {children}
//         </div>
//       </main>
//     </div>
//   );
// };

// export default DashboardLayout; 




import React from 'react';
import NavbarWithAlert from './Navbar';
import Sidebar from './Sidebar';
import { useSidebar } from './SidebarContext';

const DashboardLayout = ({ 
  children, 
  userRole, 
  sidebarItems,
  sidebarSections, // added to accept alternate prop name
  onLogout
}) => {
  const { isSidebarOpen, isMobile, toggleSidebar, setSidebarOpen } = useSidebar();

  // Normalize sidebar data and ensure an array is always passed to Sidebar
  const sections = Array.isArray(sidebarItems)
    ? sidebarItems
    : Array.isArray(sidebarSections)
      ? sidebarSections
      : [];

  return (
    <div className="min-h-screen bg-gray-100">
      <NavbarWithAlert 
        userRole={userRole} 
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onLogout={onLogout}
      />
      <Sidebar 
        items={sections} 
        onToggle={setSidebarOpen}
        isMobile={isMobile}
        isOpen={isSidebarOpen}
      />
      
      <main className={`pt-16 transition-all duration-300 ${
        isMobile 
          ? 'pl-0' // No left padding on mobile
          : isSidebarOpen 
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

export default DashboardLayout;
// ...existing