import TeacherDashboard from '../../pages/dashboard/teacherDashboard/TeacherDashboard';
import ManageClassSchedules from '../../pages/dashboard/teacherDashboard/ManageClassSchedules';
import HallAvailability from '../../pages/dashboard/teacherDashboard/HallAvailability';

export const teacherRoutes = [
  { path: "/teacherdashboard", element: <TeacherDashboard/> },
  { path: "/teacher/schedules", element: <ManageClassSchedules/> },
  { path: "/teacher/halls", element: <HallAvailability/> }
]; 