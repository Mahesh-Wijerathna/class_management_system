import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { markAPI, examAPI } from '../../../api/Examapi';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import BasicTable from '../../../components/BasicTable';
import { getUserData } from '../../../api/apiUtils';

const ExamResult = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
		const [examTitle, setExamTitle] = useState('');

	const getLoggedStudentId = () => {
		try {
			const user = getUserData();
			if (user) {
				return (
					user.userid || user.studentId || user.student_id || user.username || user.id || user.userId || null
				);
			}
		} catch {}
		const keys = ['studentId', 'student_id', 'userid', 'userId', 'username', 'id', 'userData'];
		for (const k of keys) {
			const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
			if (!raw) continue;
			try {
				const parsed = JSON.parse(raw);
				const val = parsed.userid || parsed.studentId || parsed.student_id || parsed.username || parsed.id || parsed.userId;
				if (val) return String(val);
			} catch {
				return String(raw);
			}
		}
		return null;
	};

	const studentIdentifier = getLoggedStudentId();

	useEffect(() => {
		// Remember current exam id for sidebar deep-links when available
		try { if (id) sessionStorage.setItem('currentExamId', String(id)); } catch {}

		const load = async () => {
			setLoading(true);
			setError('');
			try {
				if (!studentIdentifier) {
					setRows([]);
					setError('Logged student id not found. Please sign in.');
					return;
				}
				// Fetch results for the logged-in student using the provided API
				const resp = await markAPI.getByStudent(studentIdentifier);
				const data = resp?.data ?? resp ?? [];
				let arr = Array.isArray(data) ? data : [];
				// If an exam id is present in URL, filter for that exam only
				if (id) {
					arr = arr.filter(r => String(r.exam_id ?? r.examId ?? r.exam) === String(id));
				}
				setRows(arr);
			} catch (e) {
				console.error('Failed to load results', e);
				setError('Failed to load results');
				setRows([]);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [id, studentIdentifier]);

		// Fetch exam title if an exam id is present
		useEffect(() => {
			const fetchTitle = async () => {
				if (!id) { setExamTitle(''); return; }
				try {
					const resp = await examAPI.getById(id);
					const data = resp?.data ?? resp;
					const title = data?.title || data?.exam_title || '';
					setExamTitle(title || '');
				} catch {
					setExamTitle('');
				}
			};
			fetchTitle();
		}, [id]);

	// Quick stats
	const stats = useMemo(() => {
		const uniqueStudents = new Set();
		rows.forEach(r => {
			const sid = r.student_identifier || r.student_id || r.userid || r.user_id || r.reg_no || r.registration_no || r.username;
			if (sid) uniqueStudents.add(String(sid));
		});
		return { studentCount: uniqueStudents.size, rowCount: rows.length };
	}, [rows]);

	const columns = [
			{ key: 'exam', label: 'Exam', render: (r) => examTitle || r.exam_title || r.title || r.exam || r.exam_id || '-' },
			// { key: 'student_identifier', label: 'Student ID', render: (r) => r.student_identifier || r.student_id || r.userid || r.user_id || r.reg_no || r.registration_no || r.username || '-' },
			// { key: 'student_name', label: 'Name', render: (r) => r.student_name || r.name || '-' },
			{ key: 'label', label: 'Question', render: (r) => {
					const isChild = Boolean(r.parent_part_id);
					const parent = r.parent_label;
					const label = r.label || r.question || '-';
					return (
						<div>
							{isChild && (
								<div className="text-xs text-gray-500" style={{ lineHeight: 1 }}>{parent}</div>
							)}
							<div style={{ paddingLeft: isChild ? 16 : 0, fontWeight: isChild ? 500 : 600 }}>{label}</div>
						</div>
					);
				}
			},
			{ key: 'score_awarded', label: 'Score', render: (r) => {
					const v = r.score_awarded ?? r.score ?? 0;
					return <div style={{ textAlign: 'right', width: '100%' }}>{v}</div>;
				}
			},
			{ key: 'max_marks', label: 'Max', render: (r) => {
					const v = r.max_marks ?? r.max ?? '-';
					return <div style={{ textAlign: 'right', width: '100%' }}>{v}</div>;
				}
			},
			{ key: 'percent', label: '%', render: (r) => {
					const s = Number(r.score_awarded ?? r.score ?? 0);
					const m = Number(r.max_marks ?? r.max ?? 0);
					const val = m ? ((s / m) * 100).toFixed(1) + '%' : '-';
					return <div style={{ textAlign: 'right', width: '100%' }}>{val}</div>;
				}
			},
	];

	return (
		<DashboardLayout sidebarSections={Array.isArray(studentSidebarSections) ? studentSidebarSections : []}>
			<div style={{ padding: 20 }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-150 border-2 bg-white text-cyan-700 border-cyan-200 hover:bg-cyan-50"
                aria-label="Back to dashboard"
                >
                ← Back
                </button> */}
          <h1 className="text-lg font-bold">My Exam Results</h1>
						
					</div>
					<div style={{ color: '#444', fontWeight: 600 }}>
						{stats.studentCount} students • {stats.rowCount} rows
					</div>
				</div>

				{!id && !studentIdentifier && (
					<div style={{ color: '#666' }}>No exam selected and no logged student. Sign in or visit <code>/student/exam/&lt;examId&gt;/results</code></div>
				)}

				{error ? (
					<div style={{ color: 'red', marginBottom: 8 }}>{error}</div>
				) : (
					<BasicTable
						loading={loading}
						emptyMessage={'No results found.'}
						columns={columns}
						data={rows}
					/>
				)}
			</div>
		</DashboardLayout>
	);
};

export default ExamResult;

