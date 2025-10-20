import TeacherDashboard from '../../pages/dashboard/teacherDashboard/TeacherDashboard';
import ManageClassSchedules from '../../pages/dashboard/teacherDashboard/ManageClassSchedules';
import HallAvailability from '../../pages/dashboard/teacherDashboard/HallAvailability';
import TeacherAllClasses from '../../pages/dashboard/teacherDashboard/TeacherAllClasses';
import TeacherAttendanceOverview from '../../pages/dashboard/teacherDashboard/TeacherAttendanceOverview';
import TeacherClassAttendanceDetail from '../../pages/dashboard/teacherDashboard/TeacherClassAttendanceDetail';
import TeacherEnrollments from '../../pages/dashboard/teacherDashboard/TeacherEnrollments';
import TeacherClassPayments from '../../pages/dashboard/teacherDashboard/TeacherClassPayments';

import ExamDesigner from '../../pages/dashboard/teacherDashboard/Exam/ExamDesigner';
import MarkingView from '../../pages/dashboard/teacherDashboard/Exam/MarkingView';
import ResultsView from '../../pages/dashboard/teacherDashboard/Exam/ResultsView';
import Dashboard from '../../pages/dashboard/teacherDashboard/Exam/Dashboard';

export const teacherRoutes = [
  { path: "/teacherdashboard", element: <TeacherDashboard/> },
  { path: "/teacher/my-classes", element: <TeacherAllClasses/> },
  { path: "/teacher/schedules", element: <ManageClassSchedules/> },
  { path: "/teacher/halls", element: <HallAvailability/> },
  { path: "/teacher/attendance", element: <TeacherAttendanceOverview/> },
  { path: "/teacher/attendance/:classId", element: <TeacherClassAttendanceDetail/> },
  { path: "/teacher/enrollments", element: <TeacherEnrollments/> },
  { path: "/teacher/payments", element: <TeacherClassPayments/> },

  { path: "/teacher/exams/create", element: <ExamDesigner/> },
  { path: "/teacher/exams/manage", element: <MarkingView/> },
  { path: "/teacher/exams/results", element: <ResultsView/> },
  { path: "/teacher/exams/dashboard", element: <Dashboard/> },


];