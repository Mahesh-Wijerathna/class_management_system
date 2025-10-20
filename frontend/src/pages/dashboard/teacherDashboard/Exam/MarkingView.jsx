import { useState, useEffect } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import { questionAPI, markAPI } from '../../../../api/Examapi';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import teacherSidebarSections from '../TeacherDashboardSidebar';

const MarkingView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [students, setStudents] = useState(['']); 
  const [marks, setMarks] = useState({});

  useEffect(() => {
    fetchQuestions();
  }, [id]);

  const fetchQuestions = async () => {
    try {
      const response = await questionAPI.getByExamId(id);
      setQuestions(response?.data ?? response ?? []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions([]);
    }
  };

  const buildHierarchy = (questions) => {
    if (!Array.isArray(questions)) return [];
    const map = {};
    const roots = [];

    questions.forEach(q => {
      map[q.part_id] = { ...q, children: [] };
    });

    questions.forEach(q => {
      if (q.parent_part_id && map[q.parent_part_id]) {
        map[q.parent_part_id].children.push(map[q.part_id]);
      } else {
        roots.push(map[q.part_id]);
      }
    });

    return roots;
  };

  const handleStudentChange = (index, value) => {
    const newStudents = [...students];
    newStudents[index] = value;
    setStudents(newStudents);
  };

  const handleMarkChange = (studentIndex, questionId, value) => {
    const key = `${studentIndex}-${questionId}`;
    setMarks(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const addStudentRow = () => {
    setStudents([...students, '']);
  };

  const calculateTotal = (studentIndex) => {
    return questions.reduce((total, q) => {
      const key = `${studentIndex}-${q.part_id}`;
      return total + (marks[key] || 0);
    }, 0);
  };

  const renderQuestionHierarchy = (nodes, studentIndex, level = 0) => {
    return nodes.map(node => (
      <div key={node.part_id} style={{ marginLeft: `${level * 20}px`, marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px', minWidth: '100px' }}>
            {node.label} ({node.max_marks} marks):
          </span>
          <input
            type="number"
            min="0"
            max={node.max_marks}
            value={marks[`${studentIndex}-${node.part_id}`] ?? ''}
            onChange={(e) => handleMarkChange(studentIndex, node.part_id, e.target.value)}
            style={{ width: '60px' }}
          />
        </div>
        {node.children && node.children.length > 0 && renderQuestionHierarchy(node.children, studentIndex, level + 1)}
      </div>
    ));
  };

  const handleSaveMarks = async () => {
    const marksData = [];
    students.forEach((student, studentIndex) => {
      if (student && student.trim()) {
        questions.forEach(q => {
          const key = `${studentIndex}-${q.part_id}`;
          const score = marks[key] || 0;
          marksData.push({
            student_identifier: student,
            question_part_id: q.part_id,
            score_awarded: score
          });
        });
      }
    });

    try {
      await markAPI.saveMarks(id, { marks: marksData });
      alert('Marks saved successfully!');
      // Clear all fields after successful save
      setStudents(['']);
      setMarks({});
    } catch (error) {
      console.error('Error saving marks:', error);
      alert('Error saving marks');
    }
  };

  const hierarchy = buildHierarchy(questions);

  return (
    <DashboardLayout sidebarSections={Array.isArray(teacherSidebarSections) ? teacherSidebarSections : []}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
            <h2 style={{ margin: 0 }}>Marking View</h2>
          </div>

          <div>
            <button
              onClick={addStudentRow}
              style={{ marginRight: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer' }}
            >
              + Add Student Row
            </button>
            <button
              onClick={handleSaveMarks}
              style={{ marginRight: 8, padding: '8px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Save Marks
            </button>
            <button
              onClick={fetchQuestions}
              style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer' }}
            >
              Refresh Questions
            </button>
          </div>
        </div>

        {students.map((student, index) => (
          <div key={index} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '20px', borderRadius: '5px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Student ID:</label>
              <input
                type="text"
                value={student}
                onChange={(e) => handleStudentChange(index, e.target.value)}
                placeholder="Enter student ID"
                style={{ padding: '5px', marginRight: '10px' }}
              />
              <span style={{ fontWeight: 'bold' }}>Total Score: {calculateTotal(index)}</span>
            </div>
            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
              {hierarchy.length > 0 ? renderQuestionHierarchy(hierarchy, index) : <p>No questions available</p>}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default MarkingView;