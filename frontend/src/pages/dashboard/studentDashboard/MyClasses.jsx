import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BasicCard from '../../../components/BasicCard';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';

const MyClasses = () => {
  const [myClasses, setMyClasses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('myClasses');
    setMyClasses(stored ? JSON.parse(stored) : []);
  }, []);

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="p-6">
        <h1 className="text-lg font-bold mb-6 text-center">My Classes</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {myClasses.length > 0 ? (
            myClasses.map((cls, idx) => (
              <BasicCard
                key={idx}
                title={<div><span className="text-sm">{cls.title}</span><div className="text-xs text-gray-500 mt-1">{cls.teacher}</div></div>}
                price={<span className="text-xs">{cls.price}</span>}
                image={cls.image}
                buttonText="Learn More"
                onButtonClick={() => navigate(`/student/my-classes/${idx}`)}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 col-span-full mt-8">You have not purchased any classes yet.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyClasses; 