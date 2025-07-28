import StudentDashboard from '../../pages/dashboard/studentDashboard/StudentDashboard';
import MyProfile from '../../pages/dashboard/studentDashboard/MyProfile';
import PurchaseClasses from '../../pages/dashboard/studentDashboard/PurchaseClasses';
import MyClasses from '../../pages/dashboard/studentDashboard/MyClasses';
import MyClassDetail from '../../pages/dashboard/studentDashboard/MyClassDetail';
import Checkout from '../../pages/dashboard/studentDashboard/Checkout';
import Invoice from '../../pages/dashboard/studentDashboard/Invoice';
import PaymentSuccess from '../../pages/dashboard/studentDashboard/PaymentSuccess';
import PaymentCancel from '../../pages/dashboard/studentDashboard/PaymentCancel';
import Receipt from '../../pages/dashboard/studentDashboard/Receipt';
import BankTransfer from '../../pages/dashboard/studentDashboard/BankTransfer';
import MyPayments from '../../pages/dashboard/studentDashboard/MyPayments';
import BankDetails from '../../pages/dashboard/studentDashboard/BankDetails';
import PurchaseStudyPack from '../../pages/dashboard/studentDashboard/PurchaseStudyPack';
import MyStudyPacks from '../../pages/dashboard/studentDashboard/MyStudyPacks';
import StudyPackDetail from '../../pages/dashboard/studentDashboard/StudyPackDetail';
import LiveClasses from '../../pages/dashboard/studentDashboard/LiveClasses';
import AttendanceMarking from '../../pages/dashboard/studentDashboard/AttendanceMarking';

export const studentRoutes = [
  { path: "/studentdashboard", element: <StudentDashboard/> },
  { path: "/student/profile", element: <MyProfile/> },
  { path: "/student/purchase-classes", element: <PurchaseClasses/> },
  { path: "/student/my-classes", element: <MyClasses/> },
  { path: "/student/my-classes/:id", element: <MyClassDetail/> },
  { path: "/student/checkout/:id", element: <Checkout/> },
  { path: "/student/invoice", element: <Invoice/> },
  { path: "/payment-success", element: <PaymentSuccess/> },
  { path: "/payment-cancel", element: <PaymentCancel/> },
  { path: "/student/receipt", element: <Receipt /> },
  { path: "/student/bank-transfer", element: <BankTransfer /> },
  { path: "/student/my-payments", element: <MyPayments/> },
  { path: "/student/bankdetails", element: <BankDetails/> },
  { path: "/student/purchasestudypack", element: <PurchaseStudyPack /> },
  { path: "/student/studypacks", element: <MyStudyPacks /> },
  { path: "/student/studypacks/:id", element: <StudyPackDetail /> },
  { path: "/student/liveclasses", element: <LiveClasses /> },
 
]; 