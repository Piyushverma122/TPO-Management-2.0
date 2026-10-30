import React from 'react';
import { cn } from '@/lib/utils';
import {
  Table as ShadTable,
  TableHeader as ShadTableHeader,
  TableBody as ShadTableBody,
  TableRow as ShadTableRow,
  TableHead as ShadTableHead,
  TableCell as ShadTableCell,
} from '@/components/ui/table';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  /** Drop the outer rounded border (for tables already inside a Card). */
  bare?: boolean;
}

export const Table: React.FC<TableProps> = ({ children, className, bare, ...props }) => (
  <div className={bare ? 'w-full overflow-x-auto' : 'w-full overflow-x-auto rounded-3xl border border-border bg-card'}>
    <ShadTable className={cn('text-left border-collapse text-sm', className)} {...props}>
      {children}
    </ShadTable>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <ShadTableHeader className={cn('bg-muted/90 border-b border-border', className)} {...props}>
    {children}
  </ShadTableHeader>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <ShadTableBody className={cn('divide-y divide-border/60 [&_tr]:border-0', className)} {...props}>
    {children}
  </ShadTableBody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className, ...props }) => (
  <ShadTableRow
    className={cn('transition-colors duration-150 hover:bg-accent/70 group', className)}
    {...props}
  >
    {children}
  </ShadTableRow>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <ShadTableHead
    className={cn('h-auto px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none', className)}
    {...props}
  >
    {children}
  </ShadTableHead>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <ShadTableCell className={cn('px-4 py-3.5 text-xs text-foreground font-medium align-middle whitespace-normal', className)} {...props}>
    {children}
  </ShadTableCell>
);
