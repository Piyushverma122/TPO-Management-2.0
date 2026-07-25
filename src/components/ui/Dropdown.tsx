import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { clsx } from 'clsx';

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

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Single-select',
  error,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={clsx('w-full space-y-1.5 relative select-none', className)} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-[#94A3B8] tracking-wide uppercase">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full bg-[#101726]/80 border rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between transition-all duration-200',
          isOpen
            ? 'border-[#A3E635] shadow-[0_0_12px_rgba(163,230,53,0.2)]'
            : 'border-[#202D42] hover:border-[#2A3B57]',
          error && 'border-rose-500'
        )}
      >
        <span className={selectedOption ? 'text-white font-medium' : 'text-[#64748B]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={clsx('w-4 h-4 text-[#94A3B8] transition-transform duration-200', isOpen && 'rotate-180 text-[#A3E635]')} />
      </button>

      {/* Options Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#101726] border border-[#202D42] rounded-xl shadow-2xl z-40 max-h-60 overflow-y-auto p-1.5 backdrop-blur-xl">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={clsx(
                  'w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all',
                  isSelected
                    ? 'bg-[#A3E635]/15 text-[#A3E635]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]'
                )}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#A3E635]" />}
              </button>
            );
          })}
        </div>
      )}
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={clsx('w-full space-y-1.5 relative select-none', className)} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-[#94A3B8] tracking-wide uppercase">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full bg-[#101726]/80 border rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between transition-all duration-200',
          isOpen
            ? 'border-[#A3E635] shadow-[0_0_12px_rgba(163,230,53,0.2)]'
            : 'border-[#202D42] hover:border-[#2A3B57]'
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 max-w-[85%] overflow-hidden">
          {value.length === 0 ? (
            <span className="text-[#64748B]">{placeholder}</span>
          ) : (
            value.map((v) => {
              const opt = options.find((o) => o.value === v);
              return (
                <span
                  key={v}
                  className="bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                >
                  {opt?.label || v}
                  <X
                    className="w-3 h-3 hover:text-white cursor-pointer"
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
        <ChevronDown className={clsx('w-4 h-4 text-[#94A3B8] transition-transform duration-200', isOpen && 'rotate-180 text-[#A3E635]')} />
      </button>

      {/* Multi-Select Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#101726] border border-[#202D42] rounded-xl shadow-2xl z-40 max-h-64 flex flex-col p-2 backdrop-blur-xl">
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#162032] border border-[#202D42] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#A3E635]"
            />
          </div>

          <div className="overflow-y-auto space-y-1 flex-1">
            {filteredOptions.map((option) => {
              const isChecked = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className={clsx(
                    'w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all',
                    isChecked
                      ? 'bg-[#162032] text-white'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]/60'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={clsx(
                        'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                        isChecked ? 'bg-[#A3E635] border-[#A3E635]' : 'border-[#202D42] bg-[#101726]'
                      )}
                    >
                      {isChecked && <Check className="w-3 h-3 text-[#0B0F17] stroke-[3]" />}
                    </div>
                    <span>{option.label}</span>
                  </div>
                  {option.badge && (
                    <span className="text-[10px] text-[#A3E635] bg-[#A3E635]/10 px-1.5 py-0.5 rounded">
                      {option.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
