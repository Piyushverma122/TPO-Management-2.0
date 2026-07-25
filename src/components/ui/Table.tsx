import React from 'react';
import { clsx } from 'clsx';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ children, className, ...props }) => (
  <div className="w-full overflow-x-auto rounded-2xl border border-[#202D42] bg-[#162032]/60 backdrop-blur-xl shadow-xl">
    <table className={clsx('w-full text-left border-collapse text-sm', className)} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <thead className={clsx('bg-[#101726]/90 border-b border-[#202D42]', className)} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <tbody className={clsx('divide-y divide-[#202D42]/60', className)} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className, ...props }) => (
  <tr
    className={clsx(
      'transition-colors duration-150 hover:bg-[#1C293F]/70 group',
      className
    )}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <th
    className={clsx(
      'px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#94A3B8] select-none',
      className
    )}
    {...props}
  >
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <td className={clsx('px-4 py-3.5 text-xs text-white font-medium align-middle', className)} {...props}>
    {children}
  </td>
);
