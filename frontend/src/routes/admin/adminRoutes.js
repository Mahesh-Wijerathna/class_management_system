import ClassTabsPage from '../../pages/dashboard/adminDashboard/ClassTabsPage';
import CreateClass from '../../pages/dashboard/adminDashboard/CreateClass';
import ClassScheduling from '../../pages/dashboard/adminDashboard/ClassScheduling';
import StudentTabsPage from '../../pages/dashboard/adminDashboard/StudentTabsPage';
import StudentEnrollment from '../../pages/dashboard/adminDashboard/StudentEnrollment';
import PhysicalStudentRegisterTab from '../../pages/dashboard/adminDashboard/PhysicalStudentRegisterTab';
import TeacherTabsPage from '../../pages/dashboard/adminDashboard/TeacherTabsPage';
import TeacherInfo from '../../pages/dashboard/adminDashboard/TeacherInfo';
import CreateTeacherLogin from '../../pages/dashboard/adminDashboard/CreateTeacherLogin';

export const adminRoutes = [
  {
    path: "/admin/classes",
    element: <ClassTabsPage/>,
    children: [
      { path: "create", element: <CreateClass /> },
      { path: "schedule", element: <ClassScheduling /> },
      { index: true, element: <CreateClass /> }
    ]
  },
  {
    path: "/admin/students",
    element: <StudentTabsPage/>,
    children: [
      { index: true, element: <StudentEnrollment /> },
      { path: "enrollment", element: <StudentEnrollment /> },
      { path: "physical", element: <PhysicalStudentRegisterTab /> }
    ]
  },
  {
    path: "/admin/teachers/",
    element: <TeacherTabsPage/>,
    children: [
      { index: true, element: <TeacherInfo /> },
      { path: "info", element: <TeacherInfo /> },
      { path: "create", element: <CreateTeacherLogin /> }
    ]
  }
]; 