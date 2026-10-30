import React, { useState } from 'react';
import { Check, Search, X, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface DropdownOption {
  label: string;
  value: string;
  badge?: string;
}

export interface DropdownProps {
  label?: string;
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

// Radix Select does not allow an empty-string item value, so it is swapped for a sentinel.
const EMPTY = '__empty__';
const toSelect = (v: string) => (v === '' ? EMPTY : v);
const fromSelect = (v: string) => (v === EMPTY ? '' : v);

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Single-select',
  error,
  className,
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={clsx('w-full relative select-none', className)}>
      {label && (
        <Label className="block text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-1.5">
          {label}
        </Label>
      )}
      <Select
        value={selectedOption ? toSelect(selectedOption.value) : ''}
        onValueChange={(v) => onChange(fromSelect(v))}
      >
        <SelectTrigger
          className={clsx(
            'w-full h-10 bg-secondary dark:bg-secondary border-transparent rounded-full px-4 text-xs shadow-none cursor-pointer',
            'data-[state=open]:border-primary',
            error && 'border-rose-500'
          )}
        >
          <span className={clsx('truncate flex-1 min-w-0 text-left', selectedOption ? 'text-foreground font-semibold' : 'text-muted-foreground')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-2xl border-border bg-popover text-popover-foreground">
          {options.map((option) => (
            <SelectItem key={option.value} value={toSelect(option.value)} className="text-xs font-semibold">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
};

/* MultiSelect Dropdown Component matching UI Kit */
export interface MultiSelectProps {
  label?: string;
  options: DropdownOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  value = [],
  onChange,
  placeholder = 'Multi-select dropdown',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const toggleOption = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={clsx('w-full relative select-none', className)}>
      {label && (
        <Label className="block text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-1.5">
          {label}
        </Label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={clsx(
              'w-full bg-secondary border border-transparent rounded-full px-4 py-2.5 text-sm text-left flex items-center justify-between transition-all duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
              isOpen ? 'border-primary' : 'border-border hover:border-border'
            )}
          >
            <div className="flex flex-wrap items-center gap-1.5 max-w-[85%] overflow-hidden">
              {value.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                value.map((v) => {
                  const opt = options.find((o) => o.value === v);
                  return (
                    <span
                      key={v}
                      className="bg-primary/15 text-primary border border-primary/30 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                    >
                      {opt?.label || v}
                      <X
                        className="w-3 h-3 hover:text-foreground cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOption(v);
                        }}
                      />
                    </span>
                  );
                })
              )}
            </div>
            <ChevronDown className={clsx('w-4 h-4 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180 text-primary')} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) max-h-64 flex flex-col p-2 rounded-2xl border-border bg-popover text-popover-foreground"
        >
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              aria-label="Search dropdown options"
              className="h-auto bg-secondary rounded-full pl-8 pr-3 py-1.5 text-xs"
            />
          </div>

          <div role="listbox" className="overflow-y-auto space-y-1 flex-1">
            {filteredOptions.map((option) => {
              const isChecked = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isChecked}
                  onClick={() => toggleOption(option.value)}
                  className={clsx(
                    'w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all',
                    isChecked ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={clsx(
                        'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                        isChecked ? 'bg-primary border-primary' : 'border-input bg-muted'
                      )}
                    >
                      {isChecked && <Check className="w-3 h-3 text-primary-foreground stroke-[3]" />}
                    </div>
                    <span>{option.label}</span>
                  </div>
                  {option.badge && (
                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">{option.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
