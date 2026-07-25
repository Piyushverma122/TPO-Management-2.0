import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'success' | 'warning' | 'alert' | 'info' | 'neutral' | 'accent' | 'purple';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'active',
  size = 'md',
  icon,
  dot = false,
  className,
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const variantStyles = {
    active: 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/35 shadow-[0_0_10px_rgba(163,230,53,0.15)]',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/35',
    alert: 'bg-rose-500/15 text-rose-400 border border-rose-500/35',
    info: 'bg-sky-500/15 text-sky-400 border border-sky-500/35',
    neutral: 'bg-slate-700/30 text-slate-300 border border-slate-600/40',
    accent: 'bg-[#A3E635] text-[#0B0F17] font-extrabold',
    purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/35',
  };

  const dotColors = {
    active: 'bg-[#A3E635]',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    alert: 'bg-rose-400',
    info: 'bg-sky-400',
    neutral: 'bg-slate-400',
    accent: 'bg-[#0B0F17]',
    purple: 'bg-purple-400',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-bold rounded-full shrink-0 tracking-wide select-none',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0 animate-pulse', dotColors[variant])} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

/* Dedicated Status Badge for Drives/Students/Companies */
export interface StatusBadgeProps {
  status: 'Active' | 'Success' | 'Conducted' | 'Ongoing' | 'Upcoming' | 'Completed' | 'Pending' | 'Rejected' | 'Placed' | 'Unplaced' | 'Draft';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  switch (status) {
    case 'Active':
    case 'Success':
    case 'Conducted':
    case 'Placed':
      return (
        <Badge variant="active" size={size} dot>
          {status}
        </Badge>
      );
    case 'Completed':
      return (
        <Badge variant="success" size={size} dot>
          {status}
        </Badge>
      );
    case 'Ongoing':
    case 'Pending':
      return (
        <Badge variant="warning" size={size} dot>
          {status}
        </Badge>
      );
    case 'Upcoming':
      return (
        <Badge variant="info" size={size} dot>
          {status}
        </Badge>
      );
    case 'Rejected':
    case 'Unplaced':
      return (
        <Badge variant="alert" size={size} dot>
          {status}
        </Badge>
      );
    case 'Draft':
    default:
      return (
        <Badge variant="neutral" size={size} dot>
          {status}
        </Badge>
      );
  }
};
