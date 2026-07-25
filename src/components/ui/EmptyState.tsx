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
        'w-full bg-[#162032]/60 border border-[#202D42] rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4 backdrop-blur-xl',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#A3E635]/10 border border-[#A3E635]/30 text-[#A3E635] flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.15)]">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-lg font-extrabold text-white">{title}</h3>
        <p className="text-xs text-[#94A3B8] leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction} className="mt-2 font-bold">
          {actionText}
        </Button>
      )}
    </div>
  );
};
