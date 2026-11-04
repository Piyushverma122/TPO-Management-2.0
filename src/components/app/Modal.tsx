import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full' | 'screen';
}

const maxWidthMap = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
  '5xl': 'sm:max-w-5xl',
  full: 'sm:max-w-6xl',
  // Almost the whole window, for detail views that hold a lot of information.
  screen: 'sm:max-w-[min(1360px,96vw)] max-h-[94vh]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
}) => (
  <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent
      aria-describedby={undefined}
      onOpenAutoFocus={(e) => e.preventDefault()}
      className={cn(
        'flex max-h-[90vh] w-full flex-col gap-0 rounded-3xl border-border bg-card p-0 shadow-2xl',
        maxWidthMap[maxWidth]
      )}
    >
      <DialogHeader className="shrink-0 border-b border-border p-6 pb-4 text-left">
        <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
        {subtitle && <DialogDescription className="mt-0.5 text-xs text-muted-foreground">{subtitle}</DialogDescription>}
      </DialogHeader>

      <div className="flex-1 overflow-y-auto p-6 pb-8">{children}</div>

      {footer ? (
        <DialogFooter className="shrink-0 flex-row items-center justify-end gap-3 rounded-b-3xl border-t border-border bg-muted p-4 px-6">
          {footer}
        </DialogFooter>
      ) : null}
    </DialogContent>
  </Dialog>
);
