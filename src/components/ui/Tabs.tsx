import React from 'react';
import { clsx } from 'clsx';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'neon' | 'pills' | 'ghost' | 'underline';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'neon',
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex items-center gap-1.5 p-1 select-none overflow-x-auto',
        variant === 'neon' || variant === 'pills'
          ? 'bg-[#101726] border border-[#202D42] rounded-2xl'
          : 'border-b border-[#202D42]',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        if (variant === 'neon') {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={clsx(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap',
                isActive
                  ? 'bg-[#A3E635] text-[#0B0F17] shadow-[0_0_15px_rgba(163,230,53,0.3)]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]'
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={clsx(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-extrabold',
                    isActive ? 'bg-[#0B0F17]/20 text-[#0B0F17]' : 'bg-[#202D42] text-white'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        if (variant === 'underline') {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={clsx(
                'px-4 py-3 text-xs font-bold transition-all duration-200 flex items-center gap-2 border-b-2 whitespace-nowrap',
                isActive
                  ? 'border-[#A3E635] text-[#A3E635]'
                  : 'border-transparent text-[#94A3B8] hover:text-white hover:border-[#202D42]'
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        }

        // Ghost
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border whitespace-nowrap',
              isActive
                ? 'bg-[#162032] border-[#A3E635] text-[#A3E635] shadow-[0_0_10px_rgba(163,230,53,0.2)]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
