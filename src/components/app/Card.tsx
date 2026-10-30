import React from 'react';
import { clsx } from 'clsx';
import { Button } from './Button';
import { Card as ShadCard, CardHeader as ShadCardHeader, CardTitle as ShadCardTitle, CardContent as ShadCardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    <ShadCard
      className={cn(
        'block flex-row gap-0 py-0 rounded-3xl shadow-none transition-colors duration-200 relative',
        variant === 'glass'
          ? 'bg-card/65 backdrop-blur-xl border border-border/80'
          : variant === 'accent'
          ? 'bg-primary text-primary-foreground border border-primary'
          : variant === 'bordered'
          ? 'bg-muted border border-border'
          : 'bg-card border border-border text-card-foreground',
        active && 'border-primary',
        glowOnHover &&
          'hover:border-foreground/20',
        className
      )}
      {...props}
    >
      {children}
    </ShadCard>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <ShadCardHeader className={cn('p-5 pb-3 flex flex-row items-center justify-between', className)} {...props}>
    {children}
  </ShadCardHeader>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <ShadCardTitle className={cn('text-base font-semibold tracking-tight text-foreground', className)} {...props}>
    {children}
  </ShadCardTitle>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <ShadCardContent className={cn('p-5 pt-2', className)} {...props}>
    {children}
  </ShadCardContent>
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
      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
    </div>
    <CardContent className="p-4 space-y-3">
      <h4 className="text-sm font-semibold text-foreground leading-snug">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
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
      <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
      {online && (
        <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-card" />
      )}
    </div>
    <div>
      <h4 className="text-sm font-semibold text-foreground">{name}</h4>
      <p className="text-xs text-primary font-medium">{handle}</p>
    </div>
    <p className="text-xs text-muted-foreground line-clamp-2 px-2">{bio}</p>
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
  <Card active={active} glowOnHover className={clsx('p-5 space-y-3', active && 'bg-primary text-primary-foreground', className)}>
    <div className="flex items-center justify-between">
      <span className={clsx('text-xs font-semibold uppercase tracking-wider', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
        {title}
      </span>
      {icon && (
        <div className={clsx('p-2 rounded-xl', active ? 'bg-background/10 text-primary-foreground' : 'bg-muted text-primary border border-border')}>
          {icon}
        </div>
      )}
    </div>
    <div className="flex items-baseline justify-between">
      <span className={clsx('text-3xl font-semibold tracking-tight', active ? 'text-primary-foreground' : 'text-foreground')}>
        {value}
      </span>
      {change && (
        <span
          className={clsx(
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            active
              ? 'bg-background/20 text-primary-foreground'
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
