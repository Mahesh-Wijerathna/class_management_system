import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import studentSidebarSections from '../StudentDashboardSidebar';
import BasicCard from '../../../../components/BasicCard';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TEACHER_API = process.env.REACT_APP_TEACHER_API_BASE_URL || 'http://localhost:8088';

const PurchaseStudyPack = () => {
  const [search, setSearch] = useState('');
  const [packs, setPacks] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${TEACHER_API}/routes.php/study_packs`);
        if (data?.success) {
          const list = Array.isArray(data.data) ? data.data : [];
          setPacks(list);
          setStatus('');
        } else {
          setStatus(data?.message || 'Failed to load study packs.');
        }
      } catch (e) {
        setStatus(e?.response?.data?.message || e?.message || 'Error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredPacks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return packs;
    return packs.filter((p) =>
      (p.title || '').toLowerCase().includes(term) ||
      (p.teacher_name || p.teacher_id || '').toLowerCase().includes(term)
    );
  }, [packs, search]);

  const truncateToTwoWords = (text) => {
  if (!text || typeof text !== 'string') return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= 2) return text;
  return `${words.slice(0, 2).join(' ')} ........`;
};

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="p-2 sm:p-4 md:p-6">
        <h1 className="text-lg font-bold mb-6 text-center">All Study Packs</h1>
        <div className="flex justify-center mb-6">
          <input
            type="text"
            placeholder="Search by pack or teacher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full max-w-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        {loading ? (
          <div className="text-gray-500 text-center">Loading...</div>
        ) : status ? (
          <div className="text-red-600 text-center text-sm">{status}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 gap-y-8">
            {filteredPacks.map((pack) => (
              <BasicCard
                key={pack.id}
                title={<div><span className="text-sm">{pack.title}</span><div className="text-xs text-gray-500 mt-1">{pack.teacher_name || pack.teacher_id}</div></div>}
                price={<span className="text-xs">LKR {Number(pack.price || 0).toLocaleString()}</span>}
                image={'/assets/nfts/Nft3.png'}
                description={truncateToTwoWords(pack.description) || 'No description.'}
                buttonText="Buy Now"
                onButtonClick={() => navigate(`/student/studypack/checkout/${pack.id}`, { state: { pack } })}
              />
            ))}
          </div>
        )}
        {!loading && !status && filteredPacks.length === 0 && (
          <div className="text-center text-gray-500 mt-8">No study packs found.</div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PurchaseStudyPack; 