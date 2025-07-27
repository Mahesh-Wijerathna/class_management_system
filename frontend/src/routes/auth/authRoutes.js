import LoginPage from '../../pages/loginPage/LoginPage';
import RegisterPage from '../../pages/registerPage/RegisterPage';
import InstituteRegister from '../../pages/registerPage/InstituteRegister';
import NewStudentRegister from '../../pages/registerPage/NewStudentRegister';
import ForgotPassword from '../../pages/loginPage/ForgotPassword';

export const authRoutes = [
  { path: "/login", element: <LoginPage/> },
  { path: "/forgotpassword", element: <ForgotPassword/> },
  { path: "/register", element: <RegisterPage/> },
  { path: "/register/institute", element: <InstituteRegister/> },
  { path: "/register/new", element: <NewStudentRegister/> }
]; 