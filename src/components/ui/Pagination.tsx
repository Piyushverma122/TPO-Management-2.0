import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalEntries?: number;
  pageSize?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalEntries,
  pageSize = 10,
  className,
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const startEntry = (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalEntries || currentPage * pageSize);

  return (
    <div className={clsx('flex flex-col sm:flex-row items-center justify-between gap-4 p-4 text-xs select-none', className)}>
      {/* Row Count / Summary Indicator */}
      <div className="text-[#94A3B8] font-medium">
        {totalEntries !== undefined ? (
          <span>
            Showing <strong className="text-white">{startEntry}</strong> to{' '}
            <strong className="text-white">{endEntry}</strong> of{' '}
            <strong className="text-white">{totalEntries}</strong> entries
          </span>
        ) : (
          <span>Row count {currentPage}</span>
        )}
      </div>

      {/* Page Numbers Navigation */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 rounded-lg bg-[#101726] border border-[#202D42] text-[#94A3B8] hover:text-white hover:border-[#A3E635]/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) => {
          if (typeof page === 'string') {
            return (
              <span key={idx} className="px-2 text-[#64748B] font-bold">
                {page}
              </span>
            );
          }
          const isCurrent = page === currentPage;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onPageChange(page)}
              className={clsx(
                'w-8 h-8 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center justify-center',
                isCurrent
                  ? 'bg-[#A3E635] text-[#0B0F17] shadow-[0_0_12px_rgba(163,230,53,0.5)] border border-[#A3E635]'
                  : 'bg-[#101726] border border-[#202D42] text-[#94A3B8] hover:text-white hover:bg-[#162032]'
              )}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 rounded-lg bg-[#101726] border border-[#202D42] text-[#94A3B8] hover:text-white hover:border-[#A3E635]/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
