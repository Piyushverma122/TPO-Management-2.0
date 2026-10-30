import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { clsx } from 'clsx';
import {
  Breadcrumb as ShadBreadcrumb,
  BreadcrumbItem as ShadBreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, showHome = true, className }) => (
  <ShadBreadcrumb className={clsx('select-none', className)}>
    <BreadcrumbList className="gap-2 text-xs font-medium text-muted-foreground sm:gap-2">
      {showHome && (
        <>
          <ShadBreadcrumbItem>
            <BreadcrumbLink asChild className="flex items-center gap-1 hover:text-foreground">
              <Link to="/dashboard">
                <Home className="w-3.5 h-3.5" />
                <span className="sr-only">Home</span>
              </Link>
            </BreadcrumbLink>
          </ShadBreadcrumbItem>
          <BreadcrumbSeparator />
        </>
      )}

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ShadBreadcrumbItem>
              {item.path && !isLast ? (
                <BreadcrumbLink asChild className="hover:text-foreground">
                  <Link to={item.path}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className={clsx(isLast ? 'text-primary font-bold' : 'text-muted-foreground')}>
                  {item.label}
                </BreadcrumbPage>
              )}
            </ShadBreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        );
      })}
    </BreadcrumbList>
  </ShadBreadcrumb>
);
