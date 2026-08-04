import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
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
        className="text-[#64748B] hover:text-[#A3E635] transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
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
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#94A3B8] tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 pointer-events-none text-[#64748B] flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={effectiveType}
            className={clsx(
              'w-full bg-[#101726]/80 border border-[#202D42] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#64748B]',
              'focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] transition-all duration-200',
              leftIcon && 'pl-10',
              activeRightIcon && 'pr-10',
              error && 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500',
              className
            )}
            {...props}
          />
          {activeRightIcon && (
            <div className="absolute right-3.5 text-[#64748B] flex items-center justify-center">
              {activeRightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-400 mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#64748B] mt-1">{helperText}</p>
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
          <label htmlFor={textareaId} className="block text-xs font-semibold text-[#94A3B8] tracking-wide uppercase">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={clsx(
            'w-full bg-[#101726]/80 border border-[#202D42] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#64748B]',
            'focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] transition-all duration-200 resize-none',
            error && 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-400 mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#64748B] mt-1">{helperText}</p>
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
        leftIcon={<Search className="w-4 h-4 text-[#64748B]" />}
        className={className}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
