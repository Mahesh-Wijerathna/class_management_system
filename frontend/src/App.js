
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
import MyProfile from './pages/dashboard/studentDashboard/MyProfile';
import ClassScheduling from './pages/dashboard/adminDashboard/ClassScheduling';
import TeacherInfo from './pages/dashboard/adminDashboard/TeacherInfo';
import PurchaseClasses from './pages/dashboard/studentDashboard/PurchaseClasses';
import MyClasses from './pages/dashboard/studentDashboard/MyClasses';
import MyClassDetail from './pages/dashboard/studentDashboard/MyClassDetail';
import Checkout from './pages/dashboard/studentDashboard/Checkout';
import Invoice from './pages/dashboard/studentDashboard/Invoice';
import PaymentSuccess from './pages/dashboard/studentDashboard/PaymentSuccess';
import PaymentCancel from './pages/dashboard/studentDashboard/PaymentCancel';
import Receipt from './pages/dashboard/studentDashboard/Receipt';
import BankTransfer from './pages/dashboard/studentDashboard/BankTransfer';
import MyPayments from './pages/dashboard/studentDashboard/MyPayments';
import BankDetails from './pages/dashboard/studentDashboard/BankDetails';
import StudentEnrollment from './pages/dashboard/adminDashboard/StudentEnrollment';
import PhysicalStudentRegisterTab from './pages/dashboard/adminDashboard/PhysicalStudentRegisterTab';
import StudentTabsPage from './pages/dashboard/adminDashboard/StudentTabsPage';
import TeacherTabsPage from './pages/dashboard/adminDashboard/TeacherTabsPage';
import CreateClass from './pages/dashboard/adminDashboard/CreateClass';
import ClassTabsPage from './pages/dashboard/adminDashboard/ClassTabsPage';
import AttendanceOverview from './pages/dashboard/adminDashboard/AttendanceOverview';
import ClassAttendanceDetail from './pages/dashboard/adminDashboard/ClassAttendanceDetail';
import FinancialRecordsOverview from './pages/dashboard/adminDashboard/FinancialRecordsOverview';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/register" element={<RegisterPage/>} />
        <Route path="/admindashboard" element={<AdminDashboard/>} />
        <Route path="/studentdashboard" element={<StudentDashboard/>} />
        <Route path="/teacherdashboard" element={<TeacherDashboard/>} />
        <Route path="/admin/class-halls" element={<ClassHalls/>} />
        <Route path="/admin/financial" element={<FinancialRecordsOverview />} />
        
        <Route path="/admin/classes" element={<ClassTabsPage/>}>
          <Route path="create" element={<CreateClass />} />
          <Route path="schedule" element={<ClassScheduling />} />
          <Route index element={<CreateClass />} />
        </Route>
        
        <Route path="/admin/students" element={<StudentTabsPage/>}>
          <Route index element={<StudentEnrollment />} />
          <Route path="enrollment" element={<StudentEnrollment />} />
          <Route path="physical" element={<PhysicalStudentRegisterTab />} />
        </Route>

        <Route path="/admin/teachers/" element={<TeacherTabsPage/>}>
          <Route index element={<TeacherInfo />} />
          <Route path="info" element={<TeacherInfo />} />
          <Route path="create" element={<CreateTeacherLogin />} />
        </Route>
        
        <Route path="/admin/attendance" element={<AttendanceOverview />} />
        <Route path="/admin/attendance/:classId" element={<ClassAttendanceDetail />} />
        <Route path="/teacher/schedules" element={<ManageClassSchedules/>} />
        <Route path="/teacher/halls" element={<HallAvailability/>} />
        <Route path="/register/institute" element={<InstituteRegister/>} />
        <Route path="/register/new" element={<NewStudentRegister/>} />
        <Route path="/forgotpassword" element={<ForgotPassword/>} />

        <Route path="/admindashboard" element={<AdminDashboard/>} />
        <Route path="/admin/teachers/create" element={<CreateTeacherLogin/>} />
        <Route path="/admin/class-halls" element={<ClassHalls/>} />
        <Route path="/admin/schedule" element={<ClassScheduling/>} />
        <Route path="/admin/teachers" element={<TeacherInfo/>} />
        <Route path="/admin/students" element={<StudentEnrollment/>} />

        <Route path="/teacherdashboard" element={<TeacherDashboard/>} />
        <Route path="/teacher/schedules" element={<ManageClassSchedules/>} />
        <Route path="/teacher/halls" element={<HallAvailability/>} />

        <Route path="/studentdashboard" element={<StudentDashboard/>} />
        <Route path="/student/profile" element={<MyProfile/>} />
        <Route path="/student/purchase-classes" element={<PurchaseClasses/>} />
        <Route path="/student/my-classes" element={<MyClasses/>} />
        <Route path="/student/my-classes/:id" element={<MyClassDetail/>} />
        <Route path="/student/checkout/:id" element={<Checkout/>} />
        <Route path="/student/invoice" element={<Invoice/>} />
        <Route path="/payment-success" element={<PaymentSuccess/>} />
        <Route path="/payment-cancel" element={<PaymentCancel/>} />
        <Route path="/student/receipt" element={<Receipt />} />
        <Route path="/student/bank-transfer" element={<BankTransfer />} />
        <Route path="/student/my-payments" element={<MyPayments/>} />
        <Route path="/student/bankdetails" element={<BankDetails/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
