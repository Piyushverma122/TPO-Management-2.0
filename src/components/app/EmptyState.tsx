import React from 'react';
import { FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = 'No Records Found',
  description = 'There are no entries available for display at this moment.',
  actionText,
  onAction,
  className,
}) => {
  return (
    <div
      className={clsx(
        'w-full bg-card border border-border rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-secondary text-foreground flex items-center justify-center">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction} className="mt-2 font-bold">
          {actionText}
        </Button>
      )}
    </div>
  );
};
