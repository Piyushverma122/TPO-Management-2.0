import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import { Label } from '@/components/ui/label';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, checked, onChange, id, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <Label htmlFor={checkboxId} className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
        <div className="relative flex items-center justify-center">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          <div
            className={clsx(
              'w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center',
              'border-input bg-muted/90 shadow-xs peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50',
              ' group-hover:border-primary/60',
              className
            )}
          >
            <Check className={clsx('w-3.5 h-3.5 text-primary-foreground stroke-[3] transition-opacity duration-150', checked ? 'opacity-100' : 'opacity-0')} />
          </div>
        </div>
        {label && <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>}
      </Label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
