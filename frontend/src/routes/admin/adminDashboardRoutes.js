import AdminDashboard from '../../pages/dashboard/adminDashboard/AdminDashboard';
import CreateTeacherLogin from '../../pages/dashboard/adminDashboard/CreateTeacherLogin';
import ClassHalls from '../../pages/dashboard/adminDashboard/ClassHalls';
import ClassScheduling from '../../pages/dashboard/adminDashboard/ClassScheduling';
import TeacherInfo from '../../pages/dashboard/adminDashboard/TeacherInfo';
import StudentEnrollment from '../../pages/dashboard/adminDashboard/StudentEnrollment';
import FinancialRecordsOverview from '../../pages/dashboard/adminDashboard/FinancialRecordsOverview';
import Reports from '../../pages/dashboard/adminDashboard/Reports';
import AttendanceOverview from '../../pages/dashboard/adminDashboard/AttendanceOverview';
import ClassAttendanceDetail from '../../pages/dashboard/adminDashboard/ClassAttendanceDetail';

export const adminDashboardRoutes = [
  { path: "/admindashboard", element: <AdminDashboard/> },
  { path: "/admin/class-halls", element: <ClassHalls/> },
  { path: "/admin/schedule", element: <ClassScheduling/> },
  { path: "/admin/teachers", element: <TeacherInfo/> },
  { path: "/admin/students", element: <StudentEnrollment/> },
  { path: "/admin/financial", element: <FinancialRecordsOverview /> },
  { path: "/admin/reports", element: <Reports /> },
  { path: "/admin/attendance", element: <AttendanceOverview /> },
  { path: "/admin/attendance/:classId", element: <ClassAttendanceDetail /> }
]; 