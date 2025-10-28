import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { markAPI } from '../../../api/Examapi';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import BasicTable from '../../../components/BasicTable';

function extractLoggedStudentId() {
  // Try common storage locations and keys used in many apps
  try {
    const keys = ['studentId', 'student_id', 'student', 'user', 'userInfo', 'auth', 'userData'];
    for (const k of keys) {
      let raw = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (!raw) continue;
      // try parse JSON
      try {
        const parsed = JSON.parse(raw);
        // Try multiple possible fields
  const candidates = ['student_id', 'studentId', 'userid', 'userId', 'id', 'username', 'registration_no', 'reg_no'];
        for (const c of candidates) {
          if (parsed && parsed[c]) return String(parsed[c]);
        }
      } catch (e) {
        // raw value is not JSON — return it directly
        return String(raw);
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

const ExamResult = () => {
  const { id, examId } = useParams();
  const exam_id = id || examId;
  const navigate = useNavigate();
  const location = useLocation();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const studentId = extractLoggedStudentId();

  useEffect(() => {
    if (!exam_id) return;
    fetchAndFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam_id, location.search]);

  const fetchAndFilter = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await markAPI.getResults(exam_id);
      const data = resp?.data ?? resp ?? [];
      const arr = Array.isArray(data) ? data : [];

      if (!studentId) {
        setResults([]);
        setError('Logged student id not found. Please sign in.');
        setLoading(false);
        return;
      }

      // Accept multiple possible student id field names in the results
      const filtered = arr.filter(r => {
        const idFields = [r.student_identifier, r.student_id, r.studentIdentifier, r.registration_no, r.reg_no, r.username, r.user_id];
        return idFields.some(f => f && String(f).toLowerCase() === String(studentId).toLowerCase());
      });

      setResults(filtered);
    } catch (err) {
      console.error('Failed to load results', err);
      setError('Failed to load results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout sidebarSections={Array.isArray(studentSidebarSections) ? studentSidebarSections : []}>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1 rounded bg-white border"
          >
            ← Back
          </button>
          <h2 style={{ margin: 0 }}>My Results</h2>
        </div>

        {!exam_id && (
          <div style={{ color: '#666' }}>No exam selected. Open an exam link like <code>/exam/&lt;examId&gt;/results</code></div>
        )}

        {error ? (
          <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>
        ) : (
          <BasicTable
            loading={loading}
            emptyMessage={studentId ? 'No results found for you in this exam.' : 'Not signed in.'}
            columns={[
              { key: 'student_identifier', label: 'Student ID' },
              { key: 'label', label: 'Question' },
              { key: 'score_awarded', label: 'Score Awarded' },
              { key: 'max_marks', label: 'Max Marks' },
            ]}
            data={results}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExamResult;
