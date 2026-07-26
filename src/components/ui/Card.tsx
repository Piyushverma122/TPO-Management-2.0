import React from 'react';
import { clsx } from 'clsx';
import { Button } from './Button';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowOnHover?: boolean;
  active?: boolean;
  variant?: 'default' | 'accent' | 'glass' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  children,
  glowOnHover = false,
  active = false,
  variant = 'default',
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'rounded-2xl transition-all duration-300 relative',
        variant === 'glass'
          ? 'bg-[#162032]/65 backdrop-blur-xl border border-[#202D42]/80'
          : variant === 'accent'
          ? 'bg-[#A3E635] text-[#0B0F17] border border-[#A3E635] shadow-[0_0_25px_rgba(163,230,53,0.3)]'
          : variant === 'bordered'
          ? 'bg-[#101726] border border-[#202D42]'
          : 'bg-[#162032] border border-[#202D42] text-white shadow-xl',
        active && 'border-[#A3E635] shadow-[0_0_20px_rgba(163,230,53,0.25)]',
        glowOnHover &&
          'hover:border-[#A3E635]/50 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5),0_0_20px_rgba(163,230,53,0.15)] hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={clsx('p-5 pb-3 flex items-center justify-between', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h3 className={clsx('text-base font-bold tracking-tight text-white', className)} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={clsx('p-5 pt-2', className)} {...props}>
    {children}
  </div>
);

/* Specialized Design System Card Variants from UI Kit */

// 1. Information Card (Image + Title + Description + Action button)
export interface InfoCardProps {
  image: string;
  title: string;
  description: string;
  buttonText?: string;
  onAction?: () => void;
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  image,
  title,
  description,
  buttonText = 'Action button',
  onAction,
  className,
}) => (
  <Card glowOnHover className={clsx('w-full max-w-xs', className)}>
    <div className="h-32 w-full overflow-hidden relative">
      <img src={image} alt={title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#162032] via-transparent to-transparent" />
    </div>
    <CardContent className="p-4 space-y-3">
      <h4 className="text-sm font-bold text-white leading-snug">{title}</h4>
      <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">{description}</p>
      <Button variant="primary" size="sm" fullWidth onClick={onAction}>
        {buttonText}
      </Button>
    </CardContent>
  </Card>
);

// 2. Profile Card (Avatar + Handle + Bio + Metrics)
export interface ProfileCardProps {
  avatar: string;
  name: string;
  handle: string;
  bio: string;
  online?: boolean;
  className?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  avatar,
  name,
  handle,
  bio,
  online = true,
  className,
}) => (
  <Card glowOnHover className={clsx('w-full max-w-xs p-5 text-center space-y-3', className)}>
    <div className="relative inline-block mx-auto">
      <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover border-2 border-[#A3E635]" />
      {online && (
        <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#162032] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
      )}
    </div>
    <div>
      <h4 className="text-sm font-extrabold text-white">{name}</h4>
      <p className="text-xs text-[#A3E635] font-medium">{handle}</p>
    </div>
    <p className="text-xs text-[#94A3B8] line-clamp-2 px-2">{bio}</p>
  </Card>
);

// 3. Metric Stats Card (Header icon + Main Value + Submetrics)
export interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  active?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon,
  active = false,
  className,
}) => (
  <Card active={active} glowOnHover className={clsx('p-5 space-y-3', active && 'bg-[#A3E635] text-[#0B0F17]', className)}>
    <div className="flex items-center justify-between">
      <span className={clsx('text-xs font-semibold uppercase tracking-wider', active ? 'text-[#0B0F17]/80' : 'text-[#94A3B8]')}>
        {title}
      </span>
      {icon && (
        <div className={clsx('p-2 rounded-xl', active ? 'bg-[#0B0F17]/10 text-[#0B0F17]' : 'bg-[#101726] text-[#A3E635] border border-[#202D42]')}>
          {icon}
        </div>
      )}
    </div>
    <div className="flex items-baseline justify-between">
      <span className={clsx('text-3xl font-extrabold tracking-tight', active ? 'text-[#0B0F17]' : 'text-white')}>
        {value}
      </span>
      {change && (
        <span
          className={clsx(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            active
              ? 'bg-[#0B0F17]/20 text-[#0B0F17]'
              : isPositive
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          )}
        >
          {change}
        </span>
      )}
    </div>
  </Card>
);
