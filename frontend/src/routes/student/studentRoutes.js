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

import MyPayments from '../../pages/dashboard/studentDashboard/MyPayments';

import PurchaseStudyPack from '../../pages/dashboard/studentDashboard/PurchaseStudyPack';
import MyStudyPacks from '../../pages/dashboard/studentDashboard/MyStudyPacks';
import StudyPackDetail from '../../pages/dashboard/studentDashboard/StudyPackDetail';
import LiveClasses from '../../pages/dashboard/studentDashboard/LiveClasses';
import AttendanceMarking from '../../pages/dashboard/studentDashboard/AttendanceMarking';
import LogoutHandler from '../../components/LogoutHandler';

export const studentRoutes = [
  { path: "/studentdashboard", element: <LogoutHandler><StudentDashboard/></LogoutHandler> },
  { path: "/student/profile", element: <LogoutHandler><MyProfile/></LogoutHandler> },
  { path: "/student/purchase-classes", element: <LogoutHandler><PurchaseClasses/></LogoutHandler> },
  { path: "/student/my-classes", element: <LogoutHandler><MyClasses/></LogoutHandler> },
  { path: "/student/my-classes/:id", element: <LogoutHandler><MyClassDetail/></LogoutHandler> },
  { path: "/student/checkout/:id", element: <LogoutHandler><Checkout/></LogoutHandler> },
  { path: "/student/invoice", element: <LogoutHandler><Invoice/></LogoutHandler> },
  { path: "/payment-success", element: <LogoutHandler><PaymentSuccess/></LogoutHandler> },
  { path: "/payment-cancel", element: <LogoutHandler><PaymentCancel/></LogoutHandler> },
  { path: "/student/receipt", element: <LogoutHandler><Receipt /></LogoutHandler> },

  { path: "/student/my-payments", element: <LogoutHandler><MyPayments/></LogoutHandler> },

  { path: "/student/purchasestudypack", element: <LogoutHandler><PurchaseStudyPack /></LogoutHandler> },
  { path: "/student/studypacks", element: <LogoutHandler><MyStudyPacks /></LogoutHandler> },
  { path: "/student/studypacks/:id", element: <LogoutHandler><StudyPackDetail /></LogoutHandler> },
  { path: "/student/liveclasses", element: <LogoutHandler><LiveClasses /></LogoutHandler> },
 
]; 