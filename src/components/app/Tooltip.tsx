import React from 'react';
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className,
}) => (
  <TooltipProvider delayDuration={0}>
    <ShadTooltip>
      <TooltipTrigger asChild>
        <span className="relative inline-block">{children}</span>
      </TooltipTrigger>
      <TooltipContent
        side={position}
        className={cn(
          'px-3 py-1.5 rounded-xl bg-card text-foreground border border-primary/40 text-xs font-medium shadow-xl whitespace-nowrap',
          className
        )}
      >
        {content}
      </TooltipContent>
    </ShadTooltip>
  </TooltipProvider>
);
