import TeacherDashboard from '../../pages/dashboard/teacherDashboard/TeacherDashboard';
import ManageClassSchedules from '../../pages/dashboard/teacherDashboard/ManageClassSchedules';
import HallAvailability from '../../pages/dashboard/teacherDashboard/HallAvailability';
import LogoutHandler from '../../components/LogoutHandler';

export const teacherRoutes = [
  { path: "/teacherdashboard", element: <LogoutHandler><TeacherDashboard/></LogoutHandler> },
  { path: "/teacher/schedules", element: <LogoutHandler><ManageClassSchedules/></LogoutHandler> },
  { path: "/teacher/halls", element: <LogoutHandler><HallAvailability/></LogoutHandler> }
]; 