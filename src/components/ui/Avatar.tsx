import React from 'react';
import { clsx } from 'clsx';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  border?: boolean;
  borderColor?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  online,
  border = false,
  borderColor = 'border-[#A3E635]',
  className,
}) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div className={clsx('relative inline-block shrink-0 select-none', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={clsx(
            'rounded-full object-cover bg-[#101726]',
            sizeMap[size],
            border && `border-2 ${borderColor}`
          )}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full bg-gradient-to-tr from-[#162032] to-[#202D42] text-[#A3E635] font-extrabold flex items-center justify-center border border-[#202D42]',
            sizeMap[size],
            border && `border-2 ${borderColor}`
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-[#0B0F17]',
            online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-500',
            size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
          )}
        />
      )}
    </div>
  );
};

/* Stacked Avatar Group */
export interface AvatarGroupProps {
  avatars: Array<{ src?: string; name: string }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ avatars, max = 4, size = 'sm' }) => {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex items-center -space-x-2 overflow-hidden">
      {visible.map((av, idx) => (
        <Avatar key={idx} src={av.src} name={av.name} size={size} border borderColor="border-[#0B0F17]" />
      ))}
      {remaining > 0 && (
        <div
          className={clsx(
            'rounded-full bg-[#162032] text-[#A3E635] font-extrabold flex items-center justify-center border-2 border-[#0B0F17] z-10',
            size === 'xs' ? 'w-6 h-6 text-[10px]' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
