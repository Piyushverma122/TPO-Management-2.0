import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface CompanyLogoProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8 rounded-xl text-xs',
  md: 'h-11 w-11 rounded-2xl text-sm',
  lg: 'h-14 w-14 rounded-2xl text-base',
  xl: 'h-20 w-20 rounded-3xl text-xl',
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2)).toUpperCase();
};

/** Square logo tile used for companies: logo image on a neutral tile, initials as fallback. */
export const CompanyLogo: React.FC<CompanyLogoProps> = ({ src, name = 'Company', size = 'md', className }) => {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden border border-border bg-secondary font-semibold text-foreground select-none',
        sizeMap[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={src as string}
          alt={name}
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
};
