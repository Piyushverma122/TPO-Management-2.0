import React from 'react';
import { clsx } from 'clsx';

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

  const fillStyles = {
    neon: 'bg-[#A3E635] shadow-[0_0_12px_rgba(163,230,53,0.6)]',
    cyan: 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.6)]',
    purple: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]',
    emerald: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]',
  };

  return (
    <div className={clsx('w-full space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-semibold text-[#94A3B8]">
          {label && <span>{label}</span>}
          {showValue && <span className="text-white font-extrabold">{percentage}%</span>}
        </div>
      )}
      <div className={clsx('w-full bg-[#101726] border border-[#202D42] rounded-full overflow-hidden p-0.5', sizeStyles[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500 ease-out', fillStyles[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
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
          stroke="#202D42"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Fill Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#A3E635"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out filter drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold text-white tracking-tight">{percentage}%</span>
        {label && <span className="text-[10px] font-bold uppercase text-[#94A3B8] tracking-wider mt-0.5">{label}</span>}
      </div>
    </div>
  );
};
