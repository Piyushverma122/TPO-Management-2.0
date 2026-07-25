import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  iconOnly?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  iconOnly = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0F17] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: iconOnly ? 'w-8 h-8 text-xs p-0' : 'px-3 py-1.5 text-xs gap-1.5',
    md: iconOnly ? 'w-10 h-10 text-sm p-0' : 'px-4 py-2.5 text-sm gap-2',
    lg: iconOnly ? 'w-12 h-12 text-base p-0' : 'px-6 py-3.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#A3E635] text-[#0B0F17] hover:bg-[#BEF264] active:bg-[#84CC16] shadow-[0_0_15px_rgba(163,230,53,0.3)] hover:shadow-[0_0_25px_rgba(163,230,53,0.5)] focus:ring-[#A3E635]',
    secondary:
      'bg-[#162032] text-white border border-[#202D42] hover:bg-[#1C293F] hover:border-[#A3E635]/40 focus:ring-[#202D42]',
    tertiary:
      'bg-transparent text-[#A3E635] border border-[#A3E635]/30 hover:bg-[#A3E635]/10 hover:border-[#A3E635] focus:ring-[#A3E635]',
    ghost:
      'bg-transparent text-[#94A3B8] hover:text-white hover:bg-[#162032]/60 focus:ring-slate-700',
    danger:
      'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 focus:ring-rose-500',
    accent:
      'bg-sky-500 text-slate-950 font-bold hover:bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)] focus:ring-sky-400',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {!iconOnly && children && <span>{children}</span>}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
