import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './Card';

export type StatTone = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const TONES: Record<StatTone, string> = {
  primary: 'bg-primary/15 text-primary',
  info: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  danger: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  neutral: 'bg-secondary text-muted-foreground',
};

export interface StatTileProps {
  label: string;
  value?: number | string | null;
  icon: React.ReactNode;
  tone?: StatTone;
  /** Small line under the number, e.g. "needs your approval". */
  hint?: string;
  /** Makes the tile a button (used to jump to the matching tab). */
  onClick?: () => void;
  active?: boolean;
  /** Pulsing dot, for things happening right now. */
  pulse?: boolean;
}

/** Number tile with a tinted icon chip. Shows "-" until the value has loaded. */
export const StatTile: React.FC<StatTileProps> = ({ label, value, icon, tone = 'primary', hint, onClick, active, pulse }) => {
  const body = (
    <Card
      className={cn(
        'p-4 flex items-start gap-3 h-full transition-colors',
        onClick && 'hover:border-primary/50 cursor-pointer',
        active && 'border-primary/60 bg-primary/5'
      )}
    >
      <span className={cn('relative w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', TONES[tone])}>
        {icon}
        {pulse && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
        )}
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block text-2xl font-semibold text-foreground leading-tight">{value ?? '-'}</span>
        {hint && <span className="block text-[11px] text-muted-foreground mt-0.5">{hint}</span>}
      </span>
    </Card>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className="text-left w-full" aria-pressed={active}>
      {body}
    </button>
  ) : (
    body
  );
};
