import React from 'react';
import { cn } from '@/lib/utils';

export interface BrandMarkProps {
  className?: string;
}

/** App logo: a graduation cap on a light tile, with an amber tassel. */
export const BrandMark: React.FC<BrandMarkProps> = ({ className }) => (
  <svg viewBox="0 0 64 64" fill="none" className={cn('h-9 w-9 shrink-0', className)} aria-hidden>
    <rect width="64" height="64" rx="16" fill="var(--primary)" />
    <path d="M32 16 10 27l22 11 22-11-22-11Z" fill="var(--primary-foreground)" />
    <path d="M20 33v9c0 3 5.4 6 12 6s12-3 12-6v-9l-12 6-12-6Z" fill="var(--primary-foreground)" />
    <path d="M54 27v13" stroke="var(--primary-foreground)" strokeWidth="3" strokeLinecap="round" />
    <circle cx="54" cy="44" r="3" fill="#fbbf24" />
  </svg>
);
