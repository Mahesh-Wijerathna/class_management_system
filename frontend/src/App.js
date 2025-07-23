
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/loginPage/LoginPage';
import RegisterPage from './pages/registerPage/RegisterPage';
import StudentDashboard from '././pages/dashboard/studentDashboard/StudentDashboard';
import TeacherDashboard from '././pages/dashboard/teacherDashboard/TeacherDashboard';
import AdminDashboard from './pages/dashboard/adminDashboard/AdminDashboard';
import CreateTeacherLogin from './pages/dashboard/adminDashboard/CreateTeacherLogin';
import InstituteRegister from './pages/registerPage/InstituteRegister';
import NewStudentRegister from './pages/registerPage/NewStudentRegister';
import ForgotPassword from './pages/loginPage/ForgotPassword';
import ManageClassSchedules from './pages/dashboard/teacherDashboard/ManageClassSchedules';
import HallAvailability from './pages/dashboard/teacherDashboard/HallAvailability';
import ClassHalls from './pages/dashboard/adminDashboard/ClassHalls';
import ClassScheduling from './pages/dashboard/adminDashboard/ClassScheduling';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/register" element={<RegisterPage/>} />
        <Route path="/admindashboard" element={<AdminDashboard/>} />
        <Route path="/studentdashboard" element={<StudentDashboard/>} />
        <Route path="/teacherdashboard" element={<TeacherDashboard/>} />
        <Route path="/admin/teachers/create" element={<CreateTeacherLogin/>} />
        <Route path="/admin/class-halls" element={<ClassHalls/>} />
        <Route path="admin/schedule" element={<ClassScheduling/>} />
        <Route path="/teacher/schedules" element={<ManageClassSchedules/>} />
        <Route path="/teacher/halls" element={<HallAvailability/>} />
        <Route path="/register/institute" element={<InstituteRegister/>} />
        <Route path="/register/new" element={<NewStudentRegister/>} />
        <Route path="/forgotpassword" element={<ForgotPassword/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
