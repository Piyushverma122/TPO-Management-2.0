import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import {
  Pagination as ShadPagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';

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
      <div className="text-muted-foreground font-medium">
        {totalEntries !== undefined ? (
          <span>
            Showing <strong className="text-foreground">{startEntry}</strong> to{' '}
            <strong className="text-foreground">{endEntry}</strong> of{' '}
            <strong className="text-foreground">{totalEntries}</strong> entries
          </span>
        ) : (
          <span>Row count {currentPage}</span>
        )}
      </div>

      {/* Page Numbers Navigation */}
      <ShadPagination className="mx-0 w-auto">
        <PaginationContent className="gap-1.5">
          <PaginationItem>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Previous page"
              className="rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:border-primary/40"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </PaginationItem>

          {getPageNumbers().map((page, idx) => {
            if (typeof page === 'string') {
              return (
                <PaginationItem key={idx}>
                  <span className="px-2 text-muted-foreground font-bold">{page}</span>
                </PaginationItem>
              );
            }
            const isCurrent = page === currentPage;
            return (
              <PaginationItem key={idx}>
                <Button
                  type="button"
                  variant={isCurrent ? 'default' : 'outline'}
                  size="icon-sm"
                  onClick={() => onPageChange(page)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={clsx(
                    'rounded-lg text-xs font-semibold',
                    isCurrent
                      ? ''
                      : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-card'
                  )}
                >
                  {page}
                </Button>
              </PaginationItem>
            );
          })}

          <PaginationItem>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Next page"
              className="rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:border-primary/40"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </ShadPagination>
    </div>
  );
};
