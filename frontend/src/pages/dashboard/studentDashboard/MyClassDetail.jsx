import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BasicCard from '../../../components/BasicCard';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';

const MyClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const stored = localStorage.getItem('myClasses');
  const myClasses = stored ? JSON.parse(stored) : [];
  const cls = myClasses[parseInt(id, 10)];

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="p-6 max-w-xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:underline text-sm">&larr; Back to My Classes</button>
        {cls ? (
          <BasicCard
            title={<div><span className="text-base font-bold">{cls.title}</span><div className="text-xs text-gray-500 mt-1">{cls.teacher}</div></div>}
            price={<span className="text-xs">{cls.price}</span>}
            image={cls.image}
            description={cls.description || 'No additional description.'}
            buttonText={null}
          />
        ) : (
          <div className="text-center text-gray-500 mt-8">Class not found.</div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyClassDetail; 