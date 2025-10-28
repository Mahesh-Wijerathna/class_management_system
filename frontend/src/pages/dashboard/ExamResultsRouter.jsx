import React from 'react';
import { getUserData } from '../../api/apiUtils';
import ResultsView from './teacherDashboard/Exam/ResultsView';
import ExamResult from './studentDashboard/ExamResult';

const ExamResultsRouter = (props) => {
  const user = getUserData();
  const role = user?.role ? String(user.role).toLowerCase() : null;

  if (role === 'teacher') {
    return <ResultsView {...props} />;
  }

  // default: render student-facing results (will filter to logged student)
  return <ExamResult {...props} />;
};

export default ExamResultsRouter;
