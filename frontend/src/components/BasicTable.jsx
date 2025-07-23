import React from 'react';

/**
 * BasicTable - A reusable table component for displaying tabular data.
 * Props:
 *  - columns: Array<{ key: string, label: string, render?: (row) => ReactNode }>
 *  - data: Array<Object>
 *  - actions?: (row) => ReactNode (optional, for action buttons)
 *  - className?: string (optional)
 */

const BasicTable = ({
  columns,
  data,
  actions,
  className = '',
  page = 1,
  rowsPerPage = 25,
  totalCount = null,
  onPageChange = null,
  onRowsPerPageChange = null,
}) => {
  // Calculate pagination info
  const totalRows = totalCount !== null ? totalCount : data.length;
  const from = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const to = Math.min(page * rowsPerPage, totalRows);
  const totalPages = Math.ceil(totalRows / rowsPerPage);

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
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="p-6 text-center text-gray-500">No data available</td>
            </tr>
          ) : (
            data.map((row, idx) => (
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
          <select
            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            value={rowsPerPage}
            onChange={e => {
              const newRows = Number(e.target.value);
              if (onRowsPerPageChange) onRowsPerPageChange(newRows);
              if (onPageChange) onPageChange(1); // reset to first page
            }}
          >
            {[10, 25, 50, 100].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span>{from}-{to} of {totalRows}</span>
          <button
            className="px-2 py-1 rounded disabled:opacity-50"
            onClick={() => onPageChange && onPageChange(page - 1)}
            disabled={page <= 1 || !onPageChange}
            aria-label="Previous Page"
          >
            &#60;
          </button>
          <button
            className="px-2 py-1 rounded disabled:opacity-50"
            onClick={() => onPageChange && onPageChange(page + 1)}
            disabled={page >= totalPages || !onPageChange}
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
