import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button as ShadButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  iconOnly?: boolean;
}

const shadVariant = {
  primary: 'default',
  secondary: 'secondary',
  tertiary: 'outline',
  ghost: 'ghost',
  danger: 'destructive',
  accent: 'default',
} as const;

const variantClasses = {
  primary: 'font-medium hover:bg-primary/90',
  secondary: 'font-medium hover:bg-secondary/80',
  tertiary: 'bg-transparent font-medium text-foreground border-input hover:bg-accent',
  ghost: 'font-medium text-muted-foreground hover:text-foreground hover:bg-accent',
  danger: 'font-medium bg-destructive/15 text-red-400 border border-destructive/30 hover:bg-destructive/25',
  accent: 'font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80',
};

const sizeClasses = {
  sm: 'rounded-full text-xs',
  md: 'rounded-full text-sm',
  lg: 'rounded-full text-base',
};

const shadSize = {
  sm: { text: 'sm', icon: 'icon-sm' },
  md: { text: 'default', icon: 'icon' },
  lg: { text: 'lg', icon: 'icon-lg' },
} as const;

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
}) => (
  <ShadButton
    variant={shadVariant[variant]}
    size={iconOnly ? shadSize[size].icon : shadSize[size].text}
    className={cn(
      'select-none',
      sizeClasses[size],
      variantClasses[variant],
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
  </ShadButton>
);
