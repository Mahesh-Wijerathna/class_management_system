import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BasicCard from '../../../components/BasicCard';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';

const PurchaseClasses = () => {
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [classes, setClasses] = useState([]);
  const navigate = useNavigate();

  // Load classes from localStorage
  useEffect(() => {
    const savedClasses = localStorage.getItem('adminClasses');
    if (savedClasses) {
      const allClasses = JSON.parse(savedClasses);
      // Filter only active classes for purchase
      const activeClasses = allClasses.filter(cls => cls.status === 'active');
      setClasses(activeClasses);
    }
  }, []);

  // Filter classes based on tab and search
  const filteredClasses = classes.filter(cls => {
    const matchesTab = selectedTab === 'all' || cls.duration === selectedTab;
    const matchesSearch = cls.title.toLowerCase().includes(search.toLowerCase()) ||
                         cls.teacher.toLowerCase().includes(search.toLowerCase()) ||
                         cls.subject.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Get image based on subject or use default
  const getClassImage = (subject) => {
    const imageMap = {
      'Physics': '/assets/nfts/Nft1.png',
      'Chemistry': '/assets/nfts/Nft2.png',
      'Mathematics': '/assets/nfts/Nft3.png',
      'Biology': '/assets/nfts/Nft4.png',
      'English': '/assets/nfts/Nft5.png',
      'ICT': '/assets/nfts/Nft6.png'
    };
    return imageMap[subject] || '/assets/nfts/Nft1.png';
  };

  const tabOptions = [
    { key: 'all', label: 'All Classes' },
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' }
  ];

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="p-2 sm:p-4 md:p-6">
        <h1 className="text-lg font-bold mb-6 text-center">All Classes</h1>
        
        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {tabOptions.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-150 border-2
                ${selectedTab === tab.key
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                  : 'bg-white text-cyan-700 border-cyan-200 hover:bg-cyan-50'}
              `}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-6">
          <input
            type="text"
            placeholder="Search by class, teacher, or subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full max-w-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 gap-y-8">
          {filteredClasses.map((cls, idx) => {
            return (
              <BasicCard
                key={cls.id}
                title={<div><span className="text-sm">{cls.title}</span><div className="text-xs text-gray-500 mt-1">{cls.teacher}</div></div>}
                price={<span className="text-xs">LKR {cls.price.toLocaleString()}</span>}
                image={getClassImage(cls.subject)}
                description={
                  <div className="text-xs text-gray-600 space-y-1">
                    <div><strong>Subject:</strong> {cls.subject}</div>
                    <div><strong>Duration:</strong> {cls.duration}</div>
                    <div><strong>Schedule:</strong> {cls.schedule}</div>
                    <div><strong>Type:</strong> {cls.type}</div>
                    <div><strong>Students:</strong> {cls.currentStudents}/{cls.maxStudents}</div>
                  </div>
                }
                buttonText="Buy Now"
                onButtonClick={() => navigate(`/student/checkout/${cls.id}`)}
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