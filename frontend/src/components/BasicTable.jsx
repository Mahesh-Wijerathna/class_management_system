import React from 'react';

/**
 * BasicTable - A reusable table component for displaying tabular data.
 * Props:
 *  - columns: Array<{ key: string, label: string, render?: (row) => ReactNode }>
 *  - data: Array<Object>
 *  - actions?: (row) => ReactNode (optional, for action buttons)
 *  - className?: string (optional)
 */

import { useState } from 'react';

const BasicTable = ({
  columns,
  data,
  actions,
  className = '',
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage,
  totalCount = null,
  onPageChange,
  onRowsPerPageChange,
}) => {
  // Internal state if not controlled
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(controlledRowsPerPage || 25);
  const [internalPage, setInternalPage] = useState(controlledPage || 1);

  const rowsPerPage = controlledRowsPerPage !== undefined ? controlledRowsPerPage : internalRowsPerPage;
  const page = controlledPage !== undefined ? controlledPage : internalPage;

  // Calculate pagination info
  const totalRows = totalCount !== null ? totalCount : data.length;
  const from = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const to = Math.min(page * rowsPerPage, totalRows);
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  // Data slice for current page
  const pagedData = data.slice((page - 1) * rowsPerPage, (page - 1) * rowsPerPage + rowsPerPage);

  // Handlers
  const handleRowsPerPageChange = (newRows) => {
    if (onRowsPerPageChange) onRowsPerPageChange(newRows);
    else setInternalRowsPerPage(newRows);
    if (onPageChange) onPageChange(1);
    else setInternalPage(1);
  };
  const handlePageChange = (newPage) => {
    if (onPageChange) onPageChange(newPage);
    else setInternalPage(newPage);
  };

  return (
    <div className={`overflow-x-auto rounded-xl shadow border border-gray-200 ${className}`.trim()}>
      <table className="w-full text-left">
        <thead>
          <tr className="bg-[#bfc3fa] text-black rounded-t-xl">
            {columns.map(col => (
              <th key={col.key} className="p-3 font-semibold">{col.label}</th>
            ))}
            {actions && <th className="p-3 font-semibold">Action</th>}
          </tr>
        </thead>
        <tbody className="bg-[#f7f8fd]">
          {pagedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="p-6 text-center text-gray-500">No data available</td>
            </tr>
          ) : (
            pagedData.map((row, idx) => (
              <tr
                key={row.id || row.teacherId || idx}
                className={
                  `border-b border-[#e0e3f7] last:border-0 hover:bg-[#ecefff] transition-colors` +
                  (row.status === 'Error' ? ' bg-red-50' : '')
                }
              >
                {columns.map(col => (
                  <td key={col.key} className="p-3 align-middle">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {actions && <td className="p-3 align-middle">{actions(row)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Pagination/Footer Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#bfc3fa] px-6 py-3 rounded-b-xl text-sm mt-0">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <span className="font-medium">Rows Per Page</span>
          <input
            type="number"
            min={1}
            className="border border-gray-300 rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            value={rowsPerPage}
            onChange={e => {
              let newRows = Number(e.target.value);
              if (isNaN(newRows) || newRows < 1) newRows = 1;
              handleRowsPerPageChange(newRows);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span>{from}-{to} of {totalRows}</span>
          <button
            className="px-2 py-1 rounded disabled:opacity-50"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous Page"
          >
            &#60;
          </button>
          <button
            className="px-2 py-1 rounded disabled:opacity-50"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next Page"
          >
            &#62;
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasicTable;
