import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { markAPI } from '../../../../api/Examapi';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import teacherSidebarSections from '../TeacherDashboardSidebar';
import BasicTable from '../../../../components/BasicTable';


const ResultsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterStudent, setFilterStudent] = useState('');
  const [filterQuestion, setFilterQuestion] = useState('');
  const [filterMinScore, setFilterMinScore] = useState('');
  const [filterMaxScore, setFilterMaxScore] = useState('');

  useEffect(() => {
    fetchResults();
  }, [id]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, filterStudent, filterQuestion, filterMinScore, filterMaxScore]);

  const fetchResults = async () => {
    try {
      const response = await markAPI.getResults(id);
      // support axios response shape and raw data
      const data = response?.data ?? response ?? [];
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching results:', error);
      setResults([]);
    }
  };

  const applyFilters = () => {
    let filtered = results;

    if (filterStudent) {
      filtered = filtered.filter(r => (r.student_identifier || '').toLowerCase().includes(filterStudent.toLowerCase()));
    }

    if (filterQuestion) {
      filtered = filtered.filter(r => (r.label || '').toLowerCase().includes(filterQuestion.toLowerCase()));
    }

    if (filterMinScore !== '') {
      const min = parseFloat(filterMinScore);
      if (!Number.isNaN(min)) filtered = filtered.filter(r => r.score_awarded >= min);
    }

    if (filterMaxScore !== '') {
      const max = parseFloat(filterMaxScore);
      if (!Number.isNaN(max)) filtered = filtered.filter(r => r.score_awarded <= max);
    }

    setFilteredResults(filtered);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredResults].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredResults(sorted);
  };

  const calculateStudentTotals = () => {
    const totals = {};
    results.forEach(r => {
      const idKey = r.student_identifier ?? 'unknown';
      if (!totals[idKey]) totals[idKey] = 0;
      totals[idKey] += Number(r.score_awarded) || 0;
    });
    return totals;
  };

  const studentTotals = calculateStudentTotals();

  return (
    <DashboardLayout sidebarSections={Array.isArray(teacherSidebarSections) ? teacherSidebarSections : []}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/teacher/exams/dashboard')}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                background: '#fff',
                cursor: 'pointer'
              }}
              aria-label="Back to dashboard"
            >
              ← Back
            </button>
          <h1 className="text-lg font-bold">Results & Analysis</h1>

          </div>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <input
            type="text"
            placeholder="Filter by student ID"
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
            style={{ padding: '5px' }}
          />
          <input
            type="text"
            placeholder="Filter by question"
            value={filterQuestion}
            onChange={(e) => setFilterQuestion(e.target.value)}
            style={{ padding: '5px' }}
          />
          <input
            type="number"
            placeholder="Min score"
            value={filterMinScore}
            onChange={(e) => setFilterMinScore(e.target.value)}
            style={{ padding: '5px' }}
          />
          <input
            type="number"
            placeholder="Max score"
            value={filterMaxScore}
            onChange={(e) => setFilterMaxScore(e.target.value)}
            style={{ padding: '5px' }}
          />
          <button onClick={fetchResults} style={{ padding: '6px 10px', borderRadius: 6 }}>Refresh</button>
        </div>

        <div style={{ overflowX: 'auto' }}>

          

          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th onClick={() => handleSort('student_identifier')} style={{ border: '1px solid #ddd', padding: '8px', cursor: 'pointer' }}>
                  Student ID {sortConfig.key === 'student_identifier' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('label')} style={{ border: '1px solid #ddd', padding: '8px', cursor: 'pointer' }}>
                  Question {sortConfig.key === 'label' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('score_awarded')} style={{ border: '1px solid #ddd', padding: '8px', cursor: 'pointer' }}>
                  Score Awarded {sortConfig.key === 'score_awarded' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('max_marks')} style={{ border: '1px solid #ddd', padding: '8px', cursor: 'pointer' }}>
                  Max Marks {sortConfig.key === 'max_marks' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
           

            
            <tbody>
              {filteredResults.map((result, index) => (
                
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.student_identifier}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.label}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.score_awarded}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.max_marks}</td>
                </tr>
                
              ))}
              {filteredResults.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', color: '#666' }}>
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: '30px' }}>Student Totals</h3>
        <ul>
          {Object.entries(studentTotals).map(([student, total]) => (
            <li key={student}>{student}: {total}</li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
};

export default ResultsView;