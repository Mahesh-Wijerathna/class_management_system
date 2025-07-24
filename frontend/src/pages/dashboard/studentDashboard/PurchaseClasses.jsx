import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BasicCard from '../../../components/BasicCard';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import classData from './PurchaseClassesData';


const PurchaseClasses = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const filteredClasses = classData.filter(
    cls =>
      cls.title.toLowerCase().includes(search.toLowerCase()) ||
      cls.teacher.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="p-6">
        <h1 className="text-lg font-bold mb-6 text-center">All Classes</h1>
        <div className="flex justify-center mb-6">
          <input
            type="text"
            placeholder="Search by class or teacher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full max-w-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls, idx) => {
            // Find the index in the original classData for navigation
            const classIdx = classData.findIndex(c => c.title === cls.title && c.teacher === cls.teacher);
            return (
              <BasicCard
                key={idx}
                title={<div><span className="text-sm">{cls.title}</span><div className="text-xs text-gray-500 mt-1">{cls.teacher}</div></div>}
                price={<span className="text-xs">{cls.price}</span>}
                image={cls.image}
                buttonText="Buy Now"
                onButtonClick={() => navigate(`/student/checkout/${classIdx}`)}
              />
            );
          })}
        </div>
        {filteredClasses.length === 0 && (
          <div className="text-center text-gray-500 mt-8">No classes found.</div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PurchaseClasses; 