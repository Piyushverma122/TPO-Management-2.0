import React from 'react';
import { clsx } from 'clsx';
import { Progress } from '@/components/ui/progress';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'neon' | 'cyan' | 'purple' | 'emerald';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  variant = 'neon',
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };


  return (
    <div className={clsx('w-full space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          {label && <span>{label}</span>}
          {showValue && <span className="text-foreground font-semibold">{percentage}%</span>}
        </div>
      )}
      <Progress
        value={percentage}
        className={clsx(
          'w-full bg-muted border border-border rounded-full p-0.5',
          sizeStyles[size],
          variant === 'neon' && '[&>div]:bg-primary',
          variant === 'cyan' && '[&>div]:bg-sky-400',
          variant === 'purple' && '[&>div]:bg-purple-500',
          variant === 'emerald' && '[&>div]:bg-emerald-400'
        )}
      />
    </div>
  );
};

/* Radial Progress Ring Component (as shown in UI Kit 75%) */
export interface RadialProgressProps {
  value: number; // 0 to 100
  size?: number; // width/height in px
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export const RadialProgress: React.FC<RadialProgressProps> = ({
  value,
  size = 140,
  strokeWidth = 12,
  label,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={clsx('relative inline-flex items-center justify-center select-none', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--secondary)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Fill Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out filter"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-semibold text-foreground tracking-tight">{percentage}%</span>
        {label && <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mt-0.5">{label}</span>}
      </div>
    </div>
  );
};
