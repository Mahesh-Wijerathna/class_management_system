import TeacherDashboard from '../../pages/dashboard/teacherDashboard/TeacherDashboard';
import ManageClassSchedules from '../../pages/dashboard/teacherDashboard/ManageClassSchedules';
import HallAvailability from '../../pages/dashboard/teacherDashboard/HallAvailability';
import TeacherAllClasses from '../../pages/dashboard/teacherDashboard/TeacherAllClasses';
import TeacherAttendanceOverview from '../../pages/dashboard/teacherDashboard/TeacherAttendanceOverview';
import TeacherClassAttendanceDetail from '../../pages/dashboard/teacherDashboard/TeacherClassAttendanceDetail';

export const teacherRoutes = [
  { path: "/teacherdashboard", element: <TeacherDashboard/> },
  { path: "/teacher/my-classes", element: <TeacherAllClasses/> },
  { path: "/teacher/schedules", element: <ManageClassSchedules/> },
  { path: "/teacher/halls", element: <HallAvailability/> },
  { path: "/teacher/attendance", element: <TeacherAttendanceOverview/> },
  { path: "/teacher/attendance/:classId", element: <TeacherClassAttendanceDetail/> }
]; 