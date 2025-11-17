import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHistory, FaFileInvoice, FaDownload, FaEye, FaCalendarAlt, FaFilter, FaTimes, FaPrint } from 'react-icons/fa';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import cashierSidebarSections from './CashierDashboardSidebar';
import { getUserData } from '../../../api/apiUtils';
import { sessionAPI } from '../../../api/cashier';

// View Report Modal Component - Same format as Cashier Tool Panel
const ViewReportModal = ({ report, onClose }) => {
  if (!report) return null;

  // Parse report_data if it's a string
  const reportData = typeof report.report_data === 'string' 
    ? JSON.parse(report.report_data) 
    : (report.report_data || {});
  const cardSummary = reportData.card_summary || {};
  const perClass = reportData.per_class || [];

  // Calculate actual collections and receipts from per_class data if available
  const calculatedCollections = perClass.reduce((sum, cls) => sum + Number(cls.total_amount || 0), 0);
  const calculatedReceipts = perClass.reduce((sum, cls) => sum + Number(cls.tx_count || 0), 0);
  
  // Use calculated values if they're greater than stored values (in case session wasn't updated)
  const totalCollections = Math.max(Number(report.total_collections || 0), calculatedCollections);
  const totalReceipts = Math.max(Number(report.total_receipts || 0), calculatedReceipts);
  const expectedClosing = Number(report.opening_balance || 0) + totalCollections;

  const formatCurrency = (amount) => `LKR ${Number(amount || 0).toLocaleString()}`;
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-5 print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FaFileInvoice className="text-3xl" />
                Session End Report
              </h2>
              <div className="text-sm opacity-90 mt-1">
                {formatDate(report.session_date)} • {formatTime(report.report_time)}
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors text-xl">
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Content - Same format as screenshot */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Report Header for Print */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-3xl">🎓</span>
              <h1 className="text-2xl font-bold text-emerald-700">TCMS</h1>
            </div>
            <div className="text-gray-600 text-base">Session End Report</div>
          </div>

          {/* Meta Information - 2 Column Grid like screenshot */}
          <div className="bg-gray-100 rounded-lg p-4 mb-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Date:</span>
              <span className="text-gray-900">{formatDate(report.session_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Report Generated:</span>
              <span className="text-gray-900">{formatTime(report.report_time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Cashier:</span>
              <span className="text-gray-900">{report.cashier_name || 'Cashier'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Report Type:</span>
              <span className="text-gray-900">{report.report_type === 'full' ? 'Session Full Report' : 'Session Summary'}</span>
            </div>
          </div>

          {/* Financial Summary - Card Grid like screenshot */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Financial Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Opening Balance</div>
                <div className="text-3xl font-bold text-gray-800">{formatCurrency(report.opening_balance)}</div>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Session's Collections (Net)</div>
                <div className="text-3xl font-bold text-emerald-600">{formatCurrency(totalCollections)}</div>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Expected Closing Balance</div>
                <div className="text-3xl font-bold text-gray-800">{formatCurrency(expectedClosing)}</div>
                <div className="text-xs text-gray-500 mt-1">Opening + Collections</div>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Cash Drawer Balance</div>
                <div className="text-2xl font-bold text-gray-800">{formatCurrency(expectedClosing - (report.cash_out_amount || 0))}</div>
                {report.cash_out_amount > 0 && (
                  <div className="text-[10px] text-gray-500 mt-0.5">After cashout confirmed</div>
                )}
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Cash Out Balance</div>
                <div className="text-3xl font-bold text-emerald-600">{formatCurrency(report.cash_out_amount)}</div>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Receipts Issued</div>
                <div className="text-3xl font-bold text-gray-800">{totalReceipts}</div>
              </div>
            </div>
          </div>

          {/* Card Breakdown - Always Show */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Card Issuance Breakdown</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Full Cards Issued (count)</div>
                <div className="text-xl font-bold text-gray-800">{cardSummary.full_count || 0}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Amount: {formatCurrency(cardSummary.full_amount)}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Half Cards Issued (count)</div>
                <div className="text-xl font-bold text-gray-800">{cardSummary.half_count || 0}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Amount: {formatCurrency(cardSummary.half_amount)}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Free Cards Issued</div>
                <div className="text-xl font-bold text-gray-800">{cardSummary.free_count || 0}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Amount: {formatCurrency(cardSummary.free_amount)}</div>
              </div>
            </div>
          </div>

          {/* Collections by Class */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Collections by Class</h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Class Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Teacher</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Full Cards Issued</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Half Cards Issued</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Free Cards Issued</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Total Amount Collected</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Transactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {perClass.length > 0 ? perClass.map((cls, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-xs">{cls.class_name || '-'}</td>
                      <td className="px-3 py-2 text-xs">{cls.teacher || '-'}</td>
                      <td className="px-3 py-2 text-center text-xs">{Number(cls.full_count) || 0}</td>
                      <td className="px-3 py-2 text-center text-xs">{Number(cls.half_count) || 0}</td>
                      <td className="px-3 py-2 text-center text-xs">{Number(cls.free_count) || 0}</td>
                      <td className="px-3 py-2 text-right font-semibold text-xs">{formatCurrency(Number(cls.total_amount) || 0)}</td>
                      <td className="px-3 py-2 text-center text-xs">{Number(cls.tx_count) || 0}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="px-3 py-4 text-center text-gray-500 text-xs">No class data available</td>
                    </tr>
                  )}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan="5" className="px-3 py-2 text-right text-xs">Grand Total</td>
                    <td className="px-3 py-2 text-right text-xs">{formatCurrency(totalCollections)}</td>
                    <td className="px-3 py-2 text-center text-xs"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary & Notes */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Summary & Notes</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-gray-200">
                  <span className="font-semibold text-gray-700">Opening Time:</span>
                  <span className="text-gray-900">{formatTime(report.session_start_time)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200">
                  <span className="font-semibold text-gray-700">Closing Time:</span>
                  <span className="text-gray-900">{report.session_end_time ? formatTime(report.session_end_time) : '-'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200">
                  <span className="font-semibold text-gray-700">Total Transactions:</span>
                  <span className="text-gray-900">{totalReceipts} receipts issued</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200">
                  <span className="font-semibold text-gray-700">Payment Methods:</span>
                  <span className="text-gray-900">Cash</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="font-semibold text-gray-700">Status:</span>
                  <span className={`font-semibold ${report.is_final ? 'text-green-600' : 'text-gray-600'}`}>
                    {report.is_final ? 'Session Completed' : 'Ongoing Session'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="border-t-2 border-gray-800 mt-10 mb-1.5"></div>
                <div className="text-xs text-gray-600">Cashier Signature</div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-800 mt-10 mb-1.5"></div>
                <div className="text-xs text-gray-600">Admin Signature</div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-gray-500 text-[10px] mt-4 pb-3 border-t pt-3">
            <div className="mb-0.5">Generated by TCMS (Tuition Class Management System)</div>
            <div>This is a computer generated report and requires proper authorization.</div>
            <div className="text-emerald-600 font-semibold mt-2 text-xs print:hidden">Report ready for printing</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t flex gap-3 justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <FaPrint /> Print Report
          </button>
        </div>
      </div>
    </div>
  );
};

const SessionEndReportHistory = () => {
  const navigate = useNavigate();
  const user = useMemo(() => getUserData(), []);
  const cashierId = user?.userid;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    onlyFinal: false,
  });
  const [selectedReport, setSelectedReport] = useState(null);

  // Helper function to calculate actual collections from report_data
  const getActualCollections = (report) => {
    try {
      const reportData = typeof report.report_data === 'string' 
        ? JSON.parse(report.report_data) 
        : (report.report_data || {});
      const perClass = reportData.per_class || [];
      const calculated = perClass.reduce((sum, cls) => sum + Number(cls.total_amount || 0), 0);
      return Math.max(Number(report.total_collections || 0), calculated);
    } catch (e) {
      return Number(report.total_collections || 0);
    }
  };

  // Helper function to calculate actual receipts from report_data
  const getActualReceipts = (report) => {
    try {
      const reportData = typeof report.report_data === 'string' 
        ? JSON.parse(report.report_data) 
        : (report.report_data || {});
      const perClass = reportData.per_class || [];
      const calculated = perClass.reduce((sum, cls) => sum + Number(cls.tx_count || 0), 0);
      return Math.max(Number(report.total_receipts || 0), calculated);
    } catch (e) {
      return Number(report.total_receipts || 0);
    }
  };

  useEffect(() => {
    if (cashierId) {
      loadReports();
    }
  }, [cashierId]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sessionAPI.getSessionReportHistory({
        cashierId: cashierId,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        onlyFinal: filters.onlyFinal,
        limit: 100,
      });

      if (response.success && response.data.reports) {
        setReports(response.data.reports);
      } else {
        setError('Failed to load reports');
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load session reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadReports();
  };

  const handleResetFilters = () => {
    setFilters({
      fromDate: '',
      toDate: '',
      onlyFinal: false,
    });
    setTimeout(loadReports, 100);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount) => {
    return `LKR ${Number(amount || 0).toLocaleString()}`;
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
  };

  const handleDownloadReport = (report) => {
    // Open report in new window for PDF download - Same format as Cashier Tool Panel
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    
    if (!printWindow) {
      alert('Please allow pop-ups to download the report');
      return;
    }

    // Parse report_data if it's a string
    const reportData = typeof report.report_data === 'string' 
      ? JSON.parse(report.report_data) 
      : (report.report_data || {});
    const cardSummary = reportData.card_summary || {};
    const perClass = reportData.per_class || [];

    // Calculate actual collections and receipts from per_class data if available
    const calculatedCollections = perClass.reduce((sum, cls) => sum + Number(cls.total_amount || 0), 0);
    const calculatedReceipts = perClass.reduce((sum, cls) => sum + Number(cls.tx_count || 0), 0);
    
    // Use calculated values if they're greater than stored values
    const totalCollections = Math.max(Number(report.total_collections || 0), calculatedCollections);
    const totalReceipts = Math.max(Number(report.total_receipts || 0), calculatedReceipts);
    const expectedClosing = Number(report.opening_balance || 0) + totalCollections;

    const formatCurrency = (amount) => `LKR ${Number(amount || 0).toLocaleString()}`;
    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };
    const formatTime = (dateStr) => {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Session End Report #${report.report_id}</title>
        <meta charset="UTF-8">
        <style>
          @media print {
            @page { margin: 0.5in; size: A4; }
            body { margin: 0; }
          }
          
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          body {
            font-family: Arial, sans-serif;
            padding: 15mm;
            max-width: 210mm;
            margin: 0 auto;
            background: white;
          }

          .report-container {
            background: white;
            padding: 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          
          .header .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 10px;
          }
          
          .header .logo-icon {
            font-size: 28px;
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
            margin: 0;
          }
          
          .header .subtitle {
            font-size: 14px;
            color: #64748b;
            margin-top: 3px;
          }

          .meta-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 30px;
            background: #f1f5f9;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-size: 11px;
          }

          .meta-item {
            display: flex;
            justify-content: space-between;
          }

          .meta-label {
            font-weight: 600;
            color: #475569;
          }

          .meta-value {
            color: #1e293b;
          }

          .section {
            margin-bottom: 15px;
          }

          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #e2e8f0;
          }

          .card-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .card-grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }

          .card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px;
          }

          .card-label {
            font-size: 10px;
            color: #64748b;
            margin-bottom: 4px;
          }

          .card-value {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
          }

          .card-value.success {
            color: #059669;
          }

          .card-note {
            font-size: 9px;
            color: #94a3b8;
            margin-top: 2px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }

          thead {
            background: #f1f5f9;
          }

          th, td {
            padding: 6px 8px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }

          th {
            font-weight: 600;
            color: #475569;
            font-size: 10px;
          }

          td {
            color: #334155;
            font-size: 10px;
          }

          .text-center {
            text-align: center;
          }

          .text-right {
            text-align: right;
          }

          .font-semibold {
            font-weight: 600;
          }

          .footer {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 9px;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <div class="logo">
              <span class="logo-icon">🎓</span>
              <h1>TCMS</h1>
            </div>
            <div class="subtitle">Session End Report</div>
          </div>
          
          <div class="meta-info">
            <div class="meta-item">
              <span class="meta-label">Date:</span>
              <span class="meta-value">${formatDate(report.session_date)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Report Generated:</span>
              <span class="meta-value">${formatTime(report.report_time)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Cashier:</span>
              <span class="meta-value">${report.cashier_name || 'Cashier'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Report Type:</span>
              <span class="meta-value">${report.report_type === 'full' ? 'Session Full Report' : 'Session Summary'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Financial Summary</div>
            <div class="card-grid">
              <div class="card">
                <div class="card-label">Opening Balance</div>
                <div class="card-value">${formatCurrency(report.opening_balance)}</div>
              </div>
              <div class="card">
                <div class="card-label">Today's Collections (Net)</div>
                <div class="card-value success">${formatCurrency(totalCollections)}</div>
              </div>
              <div class="card">
                <div class="card-label">Expected Closing Balance</div>
                <div class="card-value">${formatCurrency(expectedClosing)}</div>
                <div class="card-note">Opening + Collections</div>
              </div>
              <div class="card">
                <div class="card-label">Cash Drawer Balance</div>
                <div class="card-value">${formatCurrency(expectedClosing - (report.cash_out_amount || 0))}</div>
                ${report.cash_out_amount > 0 ? '<div class="card-note"> (After cashout confirmed) </div>' : ''}
              </div>
              <div class="card">
                <div class="card-label">Cash Out Balance</div>
                <div class="card-value success">${formatCurrency(report.cash_out_amount)}</div>
              </div>
              <div class="card">
                <div class="card-label">Receipts Issued</div>
                <div class="card-value">${totalReceipts}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Card Issuance Breakdown</div>
            <div class="card-grid-3">
              <div class="card">
                <div class="card-label">Full Cards Issued (count)</div>
                <div class="card-value">${cardSummary.full_count || 0}</div>
                <div class="card-note">Amount: ${formatCurrency(cardSummary.full_amount)}</div>
              </div>
              <div class="card">
                <div class="card-label">Half Cards Issued (count)</div>
                <div class="card-value">${cardSummary.half_count || 0}</div>
                <div class="card-note">Amount: ${formatCurrency(cardSummary.half_amount)}</div>
              </div>
              <div class="card">
                <div class="card-label">Free Cards Issued</div>
                <div class="card-value">${cardSummary.free_count || 0}</div>
                <div class="card-note">Amount: ${formatCurrency(cardSummary.free_amount)}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Collections by Class</div>
            <table>
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Teacher</th>
                  <th class="text-center">Full Cards Issued</th>
                  <th class="text-center">Half Cards Issued</th>
                  <th class="text-center">Free Cards Issued</th>
                  <th class="text-right">Total Amount Collected</th>
                  <th class="text-center">Transactions</th>
                </tr>
              </thead>
              <tbody>
                ${perClass.length > 0 ? perClass.map(cls => `
                  <tr>
                    <td>${cls.class_name || '-'}</td>
                    <td>${cls.teacher || '-'}</td>
                    <td class="text-center">${Number(cls.full_count) || 0}</td>
                    <td class="text-center">${Number(cls.half_count) || 0}</td>
                    <td class="text-center">${Number(cls.free_count) || 0}</td>
                    <td class="text-right font-semibold">${formatCurrency(Number(cls.total_amount) || 0)}</td>
                    <td class="text-center">${Number(cls.tx_count) || 0}</td>
                  </tr>
                `).join('') : '<tr><td colspan="7" style="text-align:center;padding:20px;color:#64748b;">No class data available</td></tr>'}
                <tr style="background:#f1f5f9;font-weight:bold;">
                  <td colspan="5" class="text-right">Grand Total</td>
                  <td class="text-right">${formatCurrency(totalCollections)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Summary & Notes</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 25px;font-size:10px;background:white;border:1px solid #e2e8f0;border-radius:6px;padding:10px;">
              <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e2e8f0;">
                <span style="font-weight:600;color:#475569;">Opening Time:</span>
                <span style="color:#1e293b;">${formatTime(report.session_start_time)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e2e8f0;">
                <span style="font-weight:600;color:#475569;">Closing Time:</span>
                <span style="color:#1e293b;">${report.session_end_time ? formatTime(report.session_end_time) : '-'}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e2e8f0;">
                <span style="font-weight:600;color:#475569;">Total Transactions:</span>
                <span style="color:#1e293b;">${totalReceipts} receipts issued</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e2e8f0;">
                <span style="font-weight:600;color:#475569;">Payment Methods:</span>
                <span style="color:#1e293b;">Cash</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:5px 0;">
                <span style="font-weight:600;color:#475569;">Status:</span>
                <span style="font-weight:600;color:${report.is_final ? '#059669' : '#64748b'};">
                  ${report.is_final ? 'Session Completed' : 'Ongoing Session'}
                </span>
              </div>
            </div>
          </div>

          <div class="section" style="margin-top:15px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;">
              <div style="text-align:center;">
                <div style="border-top:2px solid #000;margin-top:35px;margin-bottom:5px;"></div>
                <div style="font-size:10px;color:#475569;">Cashier Signature</div>
              </div>
              <div style="text-align:center;">
                <div style="border-top:2px solid #000;margin-top:35px;margin-bottom:5px;"></div>
                <div style="font-size:10px;color:#475569;">Admin Signature</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div style="margin-bottom:3px;">Generated by TCMS (Tuition Class Management System)</div>
            <div style="font-size:8px;">This is a computer generated report and requires proper authorization.</div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <DashboardLayout 
      userRole="Cashier" 
      sidebarItems={cashierSidebarSections}
      onLogout={handleLogout}
      customTitle="TCMS"
      customSubtitle={`Cashier Dashboard - ${user?.name || 'Cashier'}`}
    >
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <FaHistory className="text-emerald-600" />
            Session End Report History
          </h1>
          <p className="text-gray-600">View and manage all session end reports</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filter Reports</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-2" />
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-2" />
                To Date
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter Options</label>
              <label className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                <input
                  type="checkbox"
                  checked={filters.onlyFinal}
                  onChange={(e) => setFilters({ ...filters, onlyFinal: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">Final Reports Only</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Actions</label>
              <div className="flex gap-2">
                <button 
                  onClick={handleApplyFilters}
                  className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-all hover:shadow-lg"
                >
                  Apply
                </button>
                <button 
                  onClick={handleResetFilters}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={loadReports}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-all"
              >
                Retry
              </button>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 bg-gray-50">
              <FaFileInvoice className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No session end reports found</p>
              <small className="text-gray-400">Reports will appear here after you generate session end reports</small>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Report ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Session Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Report Generated</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Opening Balance</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Collections</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cash Out</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Receipts</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.report_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-emerald-600 font-bold">#{report.report_id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{formatDate(report.session_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{formatDateTime(report.report_time)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          report.report_type === 'full' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {report.report_type === 'full' ? 'Full' : 'Summary'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{formatCurrency(report.opening_balance)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{formatCurrency(getActualCollections(report))}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.cash_out_amount ? (
                          <span className="text-emerald-600 font-semibold">
                            {formatCurrency(report.cash_out_amount)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{getActualReceipts(report)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          report.is_final 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {report.is_final ? '✓ Final' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewReport(report)}
                            className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all flex items-center gap-1"
                            title="View Report"
                          >
                            <FaEye /> View
                          </button>
                          <button
                            onClick={() => handleDownloadReport(report)}
                            className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-purple-600 transition-all flex items-center gap-1"
                            title="Download as PDF"
                          >
                            <FaDownload /> PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600">
            Total Reports: <strong className="text-emerald-600 text-xl">{reports.length}</strong>
          </p>
        </div>
      </div>

      {/* View Report Modal */}
      {selectedReport && (
        <ViewReportModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </DashboardLayout>
  );
};

export default SessionEndReportHistory;
