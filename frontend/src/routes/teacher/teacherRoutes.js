import TeacherDashboard from '../../pages/dashboard/teacherDashboard/TeacherDashboard';
import ManageClassSchedules from '../../pages/dashboard/teacherDashboard/ManageClassSchedules';
import HallAvailability from '../../pages/dashboard/teacherDashboard/HallAvailability';
import TeacherAllClasses from '../../pages/dashboard/teacherDashboard/TeacherAllClasses';
import TeacherAttendanceOverview from '../../pages/dashboard/teacherDashboard/TeacherAttendanceOverview';
import TeacherAttendanceManagement from '../../pages/dashboard/teacherDashboard/TeacherAttendanceManagement';
import TeacherClassAttendanceDetail from '../../pages/dashboard/teacherDashboard/TeacherClassAttendanceDetail';
import TeacherEnrollments from '../../pages/dashboard/teacherDashboard/TeacherEnrollments';
import TeacherClassPayments from '../../pages/dashboard/teacherDashboard/TeacherClassPayments';

export const teacherRoutes = [
  { path: "/teacherdashboard", element: <TeacherDashboard/> },
  { path: "/teacher/my-classes", element: <TeacherAllClasses/> },
  { path: "/teacher/schedules", element: <ManageClassSchedules/> },
  { path: "/teacher/halls", element: <HallAvailability/> },
  { path: "/teacher/attendance-management", element: <TeacherAttendanceManagement/> },
  { path: "/teacher/attendance", element: <TeacherAttendanceOverview/> },
  { path: "/teacher/attendance/:classId", element: <TeacherClassAttendanceDetail/> },
  { path: "/teacher/enrollments", element: <TeacherEnrollments/> },
  { path: "/teacher/payments", element: <TeacherClassPayments/> }
]; 