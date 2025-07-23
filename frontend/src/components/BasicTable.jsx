import React from 'react';

/**
 * BasicTable - A reusable table component for displaying tabular data.
 * Props:
 *  - columns: Array<{ key: string, label: string, render?: (row) => ReactNode }>
 *  - data: Array<Object>
 *  - actions?: (row) => ReactNode (optional, for action buttons)
 *  - className?: string (optional)
 */
const BasicTable = ({ columns, data, actions, className = '' }) => {
  return (
    <table className={`w-full text-left border ${className}`}>
      <thead>
        <tr className="bg-gray-100">
          {columns.map(col => (
            <th key={col.key} className="p-2">{col.label}</th>
          ))}
          {actions && <th className="p-2">Action</th>}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length + (actions ? 1 : 0)} className="p-4 text-center text-gray-500">No data available</td>
          </tr>
        ) : (
          data.map((row, idx) => (
            <tr key={row.id || row.teacherId || idx} className="border-t">
              {columns.map(col => (
                <td key={col.key} className="p-2">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {actions && <td className="p-2">{actions(row)}</td>}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default BasicTable;
