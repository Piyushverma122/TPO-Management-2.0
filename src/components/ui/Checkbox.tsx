import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, checked, onChange, id, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <label htmlFor={checkboxId} className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
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
              'border-[#202D42] bg-[#101726]/90 peer-checked:bg-[#A3E635] peer-checked:border-[#A3E635]',
              'peer-checked:shadow-[0_0_10px_rgba(163,230,53,0.4)] group-hover:border-[#A3E635]/60',
              className
            )}
          >
            <Check className={clsx('w-3.5 h-3.5 text-[#0B0F17] stroke-[3] transition-opacity duration-150', checked ? 'opacity-100' : 'opacity-0')} />
          </div>
        </div>
        {label && <span className="text-sm text-[#94A3B8] group-hover:text-white transition-colors">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
