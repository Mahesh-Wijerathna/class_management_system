import React from 'react';
import { Navigate } from 'react-router-dom';

// Import cashier dashboard components
import CashierDashboard from '../../pages/dashboard/cashierDashboard/CashierDashboard';
import ProcessPayment from '../../pages/dashboard/cashierDashboard/ProcessPayment';
import PaymentHistory from '../../pages/dashboard/cashierDashboard/PaymentHistory';
import StudentRecords from '../../pages/dashboard/cashierDashboard/StudentRecords';
import FinancialReports from '../../pages/dashboard/cashierDashboard/FinancialReports';
import Receipt from '../../pages/dashboard/cashierDashboard/Receipt';

// Main cashier routes
export const cashierRoutes = [
  { path: "/cashierdashboard", element: <CashierDashboard />},
  { path: "/cashier", element: <Navigate to="/cashierdashboard" replace />},
  { path: "/cashier/process-payment", element: <ProcessPayment />},
  { path: "/cashier/payment-history", element: <PaymentHistory />},
  { path: "/cashier/students", element: <StudentRecords />},
  { path: "/cashier/reports", element: <FinancialReports />},
  { path: "/cashier/receipt", element: <Receipt />},
  { path: "/cashier/student-payments", element: <PaymentHistory />},
  { path: "/cashier/daily-transactions", element: <PaymentHistory />},
  { path: "/cashier/monthly-reports", element: <FinancialReports />},
  { path: "/cashier/revenue-summary", element: <FinancialReports />},
  { path: "/cashier/analytics", element: <FinancialReports />},
  { path: "/cashier/print-receipts", element: <PaymentHistory />},
  { path: "/cashier/payment-schedule", element: <PaymentHistory />},
  { path: "/cashier/due-dates", element: <PaymentHistory />},
  { path: "/cashier/profile", element: <CashierDashboard />},
  { path: "/cashier/settings", element: <CashierDashboard />},
  { path: "/cashier/notifications", element: <CashierDashboard />},
];

