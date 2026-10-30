import React from 'react';
import { clsx } from 'clsx';
import { Tabs as ShadTabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <ShadTabs value={activeTab} onValueChange={onChange} className="gap-0">
    <TabsList
      className={clsx(
        'h-auto w-full justify-start gap-1.5 p-1 select-none overflow-x-auto',
        variant === 'neon' || variant === 'pills'
          ? 'bg-muted border-0 rounded-full'
          : 'bg-transparent rounded-none border-b border-border',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        if (variant === 'neon') {
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={clsx(
                'h-auto flex-none px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-0 after:hidden',
                isActive
                  ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={clsx(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                    isActive ? 'bg-background/20 text-primary-foreground' : 'bg-secondary text-foreground'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          );
        }

        if (variant === 'underline') {
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={clsx(
                'h-auto flex-none px-4 py-3 text-xs font-semibold transition-all duration-200 flex items-center gap-2 border-0 border-b-2 rounded-none whitespace-nowrap after:hidden bg-transparent data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </TabsTrigger>
          );
        }

        // Ghost
        return (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={clsx(
              'h-auto flex-none px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-2 border whitespace-nowrap after:hidden',
              isActive
                ? 'bg-card dark:bg-card border-primary dark:border-primary text-primary dark:text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
    </ShadTabs>
  );
};
