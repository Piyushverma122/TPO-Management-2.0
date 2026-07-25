import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, showHome = true, className }) => {
  return (
    <nav className={clsx('flex items-center gap-2 text-xs text-[#94A3B8] font-medium select-none', className)}>
      {showHome && (
        <>
          <Link to="/dashboard" className="hover:text-white flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
        </>
      )}

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {item.path && !isLast ? (
              <Link to={item.path} className="hover:text-white transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={clsx(isLast ? 'text-[#A3E635] font-bold' : 'text-[#94A3B8]')}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
