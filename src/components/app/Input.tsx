import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input as ShadInput } from '@/components/ui/input';
import { Textarea as ShadTextarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, helperText, className, id, type, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const isPasswordType = type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    const effectiveType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    const defaultPasswordToggle = isPasswordType ? (
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="text-muted-foreground hover:text-primary transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
        tabIndex={-1}
        title={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    ) : null;

    const activeRightIcon = rightIcon !== undefined ? rightIcon : defaultPasswordToggle;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <Label htmlFor={inputId} className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
            {label}
          </Label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 pointer-events-none text-muted-foreground flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <ShadInput
            id={inputId}
            ref={ref}
            type={effectiveType}
            className={cn(
              'h-auto w-full bg-secondary dark:bg-secondary border-transparent rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
              leftIcon && 'pl-10',
              activeRightIcon && 'pr-10',
              error && 'border-rose-500/80 focus-visible:border-rose-500 focus-visible:ring-rose-500/30',
              className
            )}
            {...props}
          />
          {activeRightIcon && (
            <div className="absolute right-3.5 text-muted-foreground flex items-center justify-center">
              {activeRightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-400 mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

/* Textarea Component */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, rows = 4, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <Label htmlFor={textareaId} className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
            {label}
          </Label>
        )}
        <ShadTextarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            'w-full bg-secondary dark:bg-secondary border-transparent rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none',
            error && 'border-rose-500/80 focus-visible:border-rose-500 focus-visible:ring-rose-500/30',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-400 mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/* SearchInput Component */
export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ placeholder = 'Search...', className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        placeholder={placeholder}
        leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
        className={className}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
