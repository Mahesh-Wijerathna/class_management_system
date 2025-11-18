import CashierDashboard from '../../pages/dashboard/cashierDashboard/CashierDashboard';
import StudentTracking from '../../pages/dashboard/cashierDashboard/StudentTracking';
import SessionEndReportHistory from '../../pages/dashboard/cashierDashboard/SessionEndReportHistory';
import DayEndReportHistory from '../../pages/dashboard/cashierDashboard/DayEndReportHistory';

export const cashierRoutes = [
  {
    path: '/cashierdashboard',
    element: <CashierDashboard />,
  },
  {
    path: '/cashier/late-payments',
    element: <StudentTracking />,
  },
  {
    path: '/cashier/forget-id-card',
    element: <StudentTracking />,
  },
  {
    path: '/cashier/session-report-history',
    element: <SessionEndReportHistory />,
  }
  ,
  {
    path: '/cashier/day-end-report-history',
    element: <DayEndReportHistory />,
  }
];

export default cashierRoutes;
