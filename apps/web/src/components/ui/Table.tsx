import {
  forwardRef,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';

import { cn } from '@/lib/cn';

export type TableProps = TableHTMLAttributes<HTMLTableElement>;

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, ...rest },
  ref,
) {
  return (
    <div className="overflow-x-auto">
      <table
        ref={ref}
        className={cn(
          'w-full bg-surface border border-default rounded-md overflow-hidden',
          className,
        )}
        {...rest}
      />
    </div>
  );
});

export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  function TableHeader({ className, ...rest }, ref) {
    return (
      <thead ref={ref} className={cn('bg-subtle', className)} {...rest} />
    );
  },
);

export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  function TableBody({ className, ...rest }, ref) {
    return <tbody ref={ref} className={cn(className)} {...rest} />;
  },
);

export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  function TableRow({ className, ...rest }, ref) {
    return (
      <tr
        ref={ref}
        className={cn(
          'border-t border-default hover:bg-subtle transition-colors',
          className,
        )}
        {...rest}
      />
    );
  },
);

export type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement>;

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  function TableHead({ className, ...rest }, ref) {
    return (
      <th
        ref={ref}
        scope="col"
        className={cn(
          'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary',
          className,
        )}
        {...rest}
      />
    );
  },
);

export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  function TableCell({ className, ...rest }, ref) {
    return (
      <td
        ref={ref}
        className={cn('px-4 py-3 text-sm text-primary', className)}
        {...rest}
      />
    );
  },
);
