import React from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className,
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    card: 'rounded-2xl h-48',
  };

  return (
    <div
      className={clsx(
        'bg-[#162032] animate-pulse relative overflow-hidden',
        variantStyles[variant],
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
  );
};

/* Specialized Skeletons */
export const SkeletonCard: React.FC = () => (
  <div className="bg-[#162032] border border-[#202D42] rounded-2xl p-5 space-y-4 animate-pulse">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" className="w-28" />
      <Skeleton variant="circular" className="w-8 h-8" />
    </div>
    <Skeleton variant="text" className="w-20 h-8" />
    <Skeleton variant="rectangular" className="w-full h-12" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full bg-[#162032] border border-[#202D42] rounded-2xl p-4 space-y-3 animate-pulse">
    <div className="flex gap-4 border-b border-[#202D42] pb-3">
      <Skeleton variant="text" className="w-1/4" />
      <Skeleton variant="text" className="w-1/4" />
      <Skeleton variant="text" className="w-1/4" />
      <Skeleton variant="text" className="w-1/4" />
    </div>
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} className="flex gap-4 items-center py-2">
        <Skeleton variant="circular" className="w-6 h-6" />
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-1/4" />
        <Skeleton variant="text" className="w-1/6" />
      </div>
    ))}
  </div>
);
