import AdminDashboard from '../../pages/dashboard/adminDashboard/AdminDashboard';
import ClassHalls from '../../pages/dashboard/adminDashboard/ClassHalls';
import ClassScheduling from '../../pages/dashboard/adminDashboard/ClassScheduling';
import TeacherInfo from '../../pages/dashboard/adminDashboard/TeacherInfo';
import StudentEnrollment from '../../pages/dashboard/adminDashboard/StudentEnrollment';
import FinancialRecordsOverview from '../../pages/dashboard/adminDashboard/FinancialRecordsOverview';
import Reports from '../../pages/dashboard/adminDashboard/Reports';
import AttendanceOverview from '../../pages/dashboard/adminDashboard/AttendanceOverview';
import ClassAttendanceDetail from '../../pages/dashboard/adminDashboard/ClassAttendanceDetail';
import CoreAdminInfo from '../../pages/dashboard/adminDashboard/CoreAdminInfo';
import CashiersInfo from '../../pages/dashboard/adminDashboard/CashiersInfo';
import StudentAllPayments from '../../pages/dashboard/adminDashboard/StudentAllPayments';
import StudentClassPayments from '../../pages/dashboard/adminDashboard/StudentClassPayments';
import AllClasses from '../../pages/dashboard/adminDashboard/AllClasses';
import ClassStudents from '../../pages/dashboard/adminDashboard/ClassStudents';
import AllRoles from '../../pages/dashboard/adminDashboard/AllRoles';
import RolesWithPermission from '../../pages/dashboard/adminDashboard/RolesWithPermission';
import LogoutHandler from '../../components/LogoutHandler';


export const adminDashboardRoutes = [
  { path: "/admindashboard", element: <LogoutHandler><AdminDashboard/></LogoutHandler> },
  { path: "/admin/class-halls", element: <LogoutHandler><ClassHalls/></LogoutHandler> },
  { path: "/admin/schedule", element: <LogoutHandler><ClassScheduling/></LogoutHandler> },
  { path: "/admin/core-admins",element: <LogoutHandler><CoreAdminInfo/></LogoutHandler> },
  { path: "admin/cashiers", element: <LogoutHandler><CashiersInfo/></LogoutHandler> },
  { path: "/admin/teachers", element: <LogoutHandler><TeacherInfo/></LogoutHandler> },
  { path: "/admin/students", element: <LogoutHandler><StudentEnrollment/></LogoutHandler> },
  { path: "/admin/financial", element: <LogoutHandler><FinancialRecordsOverview /></LogoutHandler> },
  { path: "/admin/reports", element: <LogoutHandler><Reports /></LogoutHandler> },
  { path: "/admin/attendance", element: <LogoutHandler><AttendanceOverview /></LogoutHandler> },
  { path: "/admin/attendance/:classId", element: <LogoutHandler><ClassAttendanceDetail /></LogoutHandler> },
  { path: "/admin/students-payments", element: <LogoutHandler><StudentAllPayments /></LogoutHandler> },
  { path: "/admin/students-payments/:classId", element: <LogoutHandler><StudentClassPayments /></LogoutHandler> },
  { path: "/admin/classes/all", element: <LogoutHandler><AllClasses /></LogoutHandler> },
  { path: "/admin/classes/all/:classId", element: <LogoutHandler><ClassStudents /></LogoutHandler> },
  { path: "/admin/roles", element: <LogoutHandler><AllRoles /></LogoutHandler> },
  { path: "/admin/roles/permissions", element: <LogoutHandler><RolesWithPermission /></LogoutHandler> }, 
  
]; 