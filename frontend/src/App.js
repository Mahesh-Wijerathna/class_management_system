
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/loginPage/LoginPage';
import RegisterPage from './pages/registerPage/RegisterPage';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import TeacherDashboard from './pages/dashboard/TeacherDashboard';
import AdminDashboard from './pages/dashboard/adminDashboard/AdminDashboard';
import CreateTeacherLogin from './pages/dashboard/adminDashboard/CreateTeacherLogin';

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
